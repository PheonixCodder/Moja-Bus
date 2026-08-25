import { Prisma } from "@moja/db";
import {
  assignBusSchema,
  assignDriverToTripSchema,
  cancelTripSchema,
  DRIVER_TURNAROUND_BUFFER_MINUTES,
  delayTripSchema,
  INTERCITY_TRIP_DEFAULT_MINUTES,
  isLicenseUsableThrough,
  licenseMeetsRequirement,
  tripStatusEnum,
  URBAN_TRIP_DEFAULT_MINUTES,
  URGENT_DISPATCH_WINDOW_HOURS,
  unassignDriverFromTripSchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { companyOperatorRecipients } from "@/features/notifications/company-recipients";
import { enqueuePassengerTripDelayed } from "@/features/notifications/outbox/commercial";
import {
  type DriverRecipient,
  enqueueDriverTripAssigned,
  enqueueDriverTripUnassigned,
  enqueueOperatorBusAssigned,
  enqueueOperatorDriverAssignmentConflict,
} from "@/features/notifications/outbox/dispatch";
import { cancelTripWithRefunds } from "@/lib/cancel-trip-with-refunds";
import { getDriverTripConflict } from "@/lib/driver-assignment";
import { convergeDriversAfterRunEnd } from "@/lib/driver-run-state";
import { getNovuClient } from "@/lib/novu";
import { requirePermission } from "@/lib/permissions/authorize";
import { getAppRollingTripWindow, getCalendarDateKey } from "@/lib/timezone";
import { finalizeTripArrival } from "@/lib/trip-arrival";
import { computeDestinationArrivalOffset } from "@/lib/trip-destination";
import { assertTripTransition } from "@/lib/trip-status";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";

/**
 * Guard against assigning a bus to overlapping active trips across any route.
 * Conflict occurs when the bus is assigned to another non-cancelled trip whose
 * [departureDate, estimatedArrival + 30m buffer] window overlaps with the target window.
 */
async function checkBusTripConflict(
  prisma: any,
  companyId: string,
  busId: string,
  departureTimestamp: Date,
  estimatedArrivalTimestamp: Date,
  excludeTripId?: string,
) {
  const turnaroundBufferMs = 30 * 60 * 1000;
  const targetStart = departureTimestamp.getTime();
  const targetEnd = estimatedArrivalTimestamp.getTime() + turnaroundBufferMs;

  const activeTrips = await prisma.trip.findMany({
    where: {
      companyId,
      busId,
      status: { in: ["SCHEDULED", "BOARDING", "DEPARTED", "DELAYED"] },
      archivedAt: null,
      ...(excludeTripId ? { id: { not: excludeTripId } } : {}),
    },
    select: {
      id: true,
      departureDate: true,
      estimatedArrival: true,
      bus: { select: { registrationPlate: true, internalName: true } },
    },
  });

  for (const existing of activeTrips) {
    const existingStart = new Date(existing.departureDate).getTime();
    const existingArrival = existing.estimatedArrival
      ? new Date(existing.estimatedArrival).getTime()
      : existingStart + 120 * 60 * 1000;
    const existingEnd = existingArrival + turnaroundBufferMs;

    const overlaps = targetStart < existingEnd && targetEnd > existingStart;
    if (overlaps) {
      const busName =
        existing.bus?.registrationPlate || existing.bus?.internalName || busId;
      const depStr = existing.departureDate
        .toISOString()
        .replace("T", " ")
        .substring(0, 16);
      throw new TRPCError({
        code: "CONFLICT",
        message: `Bus "${busName}" is already assigned to another active trip at ${depStr} (busy until ${new Date(existingEnd).toISOString().substring(11, 16)} UTC including turnaround buffer).`,
      });
    }
  }
}

export const tripsRouter = createTRPCRouter({
  create: operatorCompanyProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        busId: z.string(),
        departureDate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:create");
      const schedule = await ctx.prisma.schedule.findUnique({
        where: { id: input.scheduleId, companyId: ctx.companyId },
        include: {
          route: { include: { waypoints: { orderBy: { stopOrder: "asc" } } } },
          scheduleWaypoints: true,
        },
      });
      if (!schedule)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });

      const bus = await ctx.prisma.bus.findFirst({
        where: {
          id: input.busId,
          companyId: ctx.companyId,
          status: "ACTIVE",
          deletedAt: null,
        },
        include: { seats: true },
      });
      if (!bus)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bus invalid or not active",
        });

      const departureTimestamp = new Date(input.departureDate);

      const existingTrip = await ctx.prisma.trip.findFirst({
        where: {
          scheduleId: input.scheduleId,
          departureDate: departureTimestamp,
        },
      });
      if (existingTrip)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Trip already exists for this time",
        });

      // Build timing map with schedule waypoint overrides
      const timingMap = new Map(
        schedule.scheduleWaypoints?.map((sw) => [sw.routeWaypointId, sw]) ?? [],
      );

      const lastRw =
        schedule.route.waypoints[schedule.route.waypoints.length - 1];
      const destStopOrder = (lastRw?.stopOrder ?? 0) + 1;
      const fullRouteFare = await ctx.prisma.fare.findFirst({
        where: {
          scheduleId: schedule.id,
          fromStopOrder: 0,
          toStopOrder: destStopOrder,
          isActive: true,
        },
        select: { durationMinutes: true },
      });
      const fullRouteDurationMin = fullRouteFare?.durationMinutes ?? null;

      const destDepartureOffset = computeDestinationArrivalOffset({
        waypoints: schedule.route.waypoints,
        timings: timingMap,
        fullRouteDurationMin,
      });

      const estimatedArrivalTimestamp = new Date(
        departureTimestamp.getTime() + destDepartureOffset * 60000,
      );

      await checkBusTripConflict(
        ctx.prisma,
        ctx.companyId,
        input.busId,
        departureTimestamp,
        estimatedArrivalTimestamp,
      );

      return ctx.prisma.$transaction(async (tx) => {
        const createdTrip = await tx.trip.create({
          data: {
            scheduleId: input.scheduleId,
            companyId: ctx.companyId,
            busId: input.busId,
            departureDate: departureTimestamp,
            estimatedArrival: new Date(
              departureTimestamp.getTime() + destDepartureOffset * 60000,
            ),
            totalSeats: bus.seats.filter(
              (s) =>
                s.isActive &&
                s.isBookable &&
                s.seatType !== "DRIVER_AREA" &&
                s.seatType !== "EMPTY_SPACE",
            ).length,
            status: "SCHEDULED",
            // Match the bulk generator (lib/trip-generator.ts): snapshot the
            // route's service type so search and tickets can filter/display it
            // without joining geometry.
            serviceType: schedule.route.serviceType,
            routeSnapshotJson: {
              ...schedule.route,
              scheduleWaypoints: schedule.scheduleWaypoints ?? [],
              version: 1,
            },
          },
        });

        const lastWaypointOrder =
          schedule.route.waypoints.length > 0
            ? schedule.route.waypoints[schedule.route.waypoints.length - 1]!
                .stopOrder
            : 0;
        const destStopOrder = lastWaypointOrder + 1;

        await tx.tripStop.createMany({
          data: [
            {
              tripId: createdTrip.id,
              terminalId: schedule.route.originTerminalId,
              stopOrder: 0,
              scheduledArrival: departureTimestamp,
              scheduledDeparture: departureTimestamp,
              isPickup: true,
              isDropoff: false,
            },
            ...schedule.route.waypoints.map((w) => {
              const sw = timingMap.get(w.id);
              const arrivalOffset = sw?.arrivalOffsetMinutes ?? 0;
              const departureOffset = sw?.departureOffsetMinutes ?? 0;
              return {
                tripId: createdTrip.id,
                terminalId: w.terminalId,
                stopOrder: w.stopOrder,
                scheduledArrival: new Date(
                  departureTimestamp.getTime() + arrivalOffset * 60000,
                ),
                scheduledDeparture: new Date(
                  departureTimestamp.getTime() + departureOffset * 60000,
                ),
                isPickup: w.isPickup,
                isDropoff: w.isDropoff,
              };
            }),
            {
              tripId: createdTrip.id,
              terminalId: schedule.route.destTerminalId,
              stopOrder: destStopOrder,
              scheduledArrival: new Date(
                departureTimestamp.getTime() + destDepartureOffset * 60000,
              ),
              scheduledDeparture: new Date(
                departureTimestamp.getTime() + destDepartureOffset * 60000,
              ),
              isPickup: false,
              isDropoff: true,
            },
          ],
        });

        await tx.tripSeat.createMany({
          data: bus.seats.map((seat) => ({
            tripId: createdTrip.id,
            seatId: seat.id,
            isActive: seat.isActive,
          })),
        });

        return createdTrip;
      });
    }),

  list: operatorCompanyProcedure
    .input(
      z
        .object({
          status: tripStatusEnum.optional(),
          serviceType: z.enum(["INTERCITY", "URBAN"]).optional(),
          routeId: z.string().optional(),
          scheduleId: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          q: z.string().optional(),
          page: z.number().int().min(1).optional().default(1),
          pageSize: z.number().int().min(1).max(100).optional().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:read");
      const window = getAppRollingTripWindow(14);
      const startDate = input?.startDate
        ? new Date(input.startDate)
        : window.startDate;
      const endDate = input?.endDate ? new Date(input.endDate) : window.endDate;

      const filters: Record<string, unknown> = {
        companyId: ctx.companyId,
        archivedAt: null,
        departureDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (input?.status) {
        filters["status"] = input.status;
      }
      if (input?.serviceType) {
        filters["serviceType"] = input.serviceType;
      }
      if (input?.scheduleId) {
        filters["scheduleId"] = input.scheduleId;
      }
      if (input?.routeId) {
        filters["schedule"] = { routeId: input.routeId };
      }

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 50;
      const q = input?.q?.trim();

      const where: Record<string, unknown> = {
        ...filters,
      };

      if (q) {
        where["OR"] = [
          { id: { contains: q, mode: "insensitive" } },
          {
            bus: {
              registrationPlate: { contains: q, mode: "insensitive" },
            },
          },
          {
            schedule: {
              route: {
                OR: [
                  {
                    originTerminal: {
                      OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { city: { contains: q, mode: "insensitive" } },
                        {
                          cityRelation: {
                            name: { contains: q, mode: "insensitive" },
                          },
                        },
                      ],
                    },
                  },
                  {
                    destTerminal: {
                      OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { city: { contains: q, mode: "insensitive" } },
                        {
                          cityRelation: {
                            name: { contains: q, mode: "insensitive" },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ];
      }

      const [total, trips] = await Promise.all([
        ctx.prisma.trip.count({ where: where as any }),
        ctx.prisma.trip.findMany({
          where: where as any,
          include: {
            bus: {
              include: { busType: true, layoutTemplate: true },
            },
            driver: {
              select: {
                id: true,
                licenseNumber: true,
                averageRating: true,
                status: true,
                user: {
                  select: { fullName: true, phoneNumber: true, image: true },
                },
              },
            },
            reliefDriver: {
              select: {
                id: true,
                licenseNumber: true,
                user: {
                  select: { fullName: true, phoneNumber: true, image: true },
                },
              },
            },
            driverAssignments: {
              select: {
                role: true,
                driverProfileId: true,
                driverProfile: {
                  select: { user: { select: { fullName: true } } },
                },
              },
            },
            schedule: {
              include: {
                route: {
                  include: {
                    originTerminal: {
                      include: {
                        cityRelation: true,
                        municipality: true,
                        quarter: true,
                      },
                    },
                    destTerminal: {
                      include: {
                        cityRelation: true,
                        municipality: true,
                        quarter: true,
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                bookings: {
                  where: {
                    OR: [
                      { status: "CONFIRMED" },
                      {
                        status: "PENDING_PAYMENT",
                        holdExpiresAt: { gt: new Date() },
                      },
                    ],
                  },
                },
              },
            },
          },
          orderBy: { departureDate: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return {
        items: trips,
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        window: {
          startDate: getCalendarDateKey(startDate),
          endDate: getCalendarDateKey(endDate),
        },
      };
    }),

  // M2: global status counts (no pagination) so the dispatch-board chips
  // reflect every trip for the operator, not just the current page.
  statusCounts: operatorCompanyProcedure
    .input(
      z
        .object({
          scheduleId: z.string().optional(),
          routeId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:read");
      const where: Prisma.TripWhereInput = {
        companyId: ctx.companyId,
        archivedAt: null,
      };
      if (input?.scheduleId) where.scheduleId = input.scheduleId;
      if (input?.routeId) where.schedule = { routeId: input.routeId };

      const grouped = await ctx.prisma.trip.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      });

      const counts: Record<string, number> = {};
      for (const g of grouped) {
        counts[g.status] = g._count._all;
      }
      return { counts };
    }),

  get: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:read");
      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
          archivedAt: null,
        },
        include: {
          bus: {
            include: { busType: true },
          },
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  image: true,
                },
              },
            },
          },
          reliefDriver: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  image: true,
                },
              },
            },
          },
          driverAssignments: {
            include: {
              driverProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      phoneNumber: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                  destTerminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                  waypoints: { orderBy: { stopOrder: "asc" } },
                },
              },
            },
          },
          tripStops: {
            orderBy: { stopOrder: "asc" },
            include: {
              terminal: {
                include: {
                  cityRelation: true,
                  municipality: true,
                  quarter: true,
                },
              },
            },
          },
          seats: {
            include: {
              seat: true,
            },
            orderBy: [
              { seat: { deck: "asc" } },
              { seat: { row: "asc" } },
              { seat: { col: "asc" } },
            ],
          },
          bookings: {
            include: {
              seat: true,
              originTripStop: {
                include: {
                  terminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                },
              },
              destinationTripStop: {
                include: {
                  terminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                },
              },
            },
            where: {
              OR: [
                { status: "CONFIRMED" },
                {
                  status: "PENDING_PAYMENT",
                  holdExpiresAt: { gt: new Date() },
                },
              ],
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      return trip;
    }),

  // L1: split the heavy `trips.get`. getManifest returns the trip (route,
  // stops, bus, bookings) WITHOUT the full seat map — used by the manifest
  // drawer's default view so it opens fast even for 60-seat trips.
  getManifest: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:read");
      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
          archivedAt: null,
        },
        include: {
          bus: {
            include: { busType: true },
          },
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                  destTerminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                  waypoints: { orderBy: { stopOrder: "asc" } },
                },
              },
            },
          },
          tripStops: {
            orderBy: { stopOrder: "asc" },
            include: {
              terminal: {
                include: {
                  cityRelation: true,
                  municipality: true,
                  quarter: true,
                },
              },
            },
          },
          bookings: {
            include: {
              seat: true,
              originTripStop: {
                include: {
                  terminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                },
              },
              destinationTripStop: {
                include: {
                  terminal: {
                    include: {
                      cityRelation: true,
                      municipality: true,
                      quarter: true,
                    },
                  },
                },
              },
            },
            where: {
              OR: [
                { status: "CONFIRMED" },
                {
                  status: "PENDING_PAYMENT",
                  holdExpiresAt: { gt: new Date() },
                },
              ],
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      return trip;
    }),

  // L1: seat visualization payload, loaded lazily (only when the Seat Map tab
  // is opened) so it never bloats the manifest drawer's initial query.
  getSeatMap: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:read");
      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
          archivedAt: null,
        },
        select: {
          id: true,
          busId: true,
          seats: {
            include: { seat: true },
            orderBy: [
              { seat: { deck: "asc" } },
              { seat: { row: "asc" } },
              { seat: { col: "asc" } },
            ],
          },
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      return trip;
    }),

  assignBus: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: assignBusSchema }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const { busId } = input.data;

      const ALLOWED_ASSIGN = new Set(["SCHEDULED", "BOARDING", "DELAYED"]);

      const result = await ctx.prisma.$transaction(async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "trip" WHERE id = ${input.id} FOR UPDATE`,
        );

        const trip = await tx.trip.findFirst({
          where: {
            id: input.id,
            companyId: ctx.companyId,
            archivedAt: null,
          },
          include: {
            seats: true,
          },
        });

        if (!trip) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
        }

        if (!ALLOWED_ASSIGN.has(trip.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot assign a bus when trip status is ${trip.status}.`,
          });
        }

        const newBus = await tx.bus.findFirst({
          where: {
            id: busId,
            companyId: ctx.companyId,
            status: "ACTIVE",
            deletedAt: null,
          },
          include: { seats: true },
        });

        if (!newBus) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected bus is invalid or inactive",
          });
        }

        const estArrival =
          trip.estimatedArrival ??
          new Date(trip.departureDate.getTime() + 120 * 60000);
        await checkBusTripConflict(
          tx,
          ctx.companyId,
          busId,
          trip.departureDate,
          estArrival,
          trip.id,
        );

        if (trip.busId !== busId) {
          const bookings = await tx.booking.findMany({
            where: {
              tripId: trip.id,
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            },
            include: { seat: true },
          });

          if (bookings.length > 0) {
            const bookedLabels = bookings.map((b) => b.seat.label);
            const newSeatLabels = new Set(newBus.seats.map((s) => s.label));
            const allLabelsCompatible = bookedLabels.every((label) =>
              newSeatLabels.has(label),
            );

            if (!allLabelsCompatible) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Cannot swap bus: The new bus seat layout is incompatible with the seats already booked on this trip.",
              });
            }
          }
        }

        const updated = await tx.trip.update({
          where: { id: trip.id },
          data: {
            busId,
            totalSeats: newBus.seats.filter(
              (s) =>
                s.isActive &&
                s.isBookable &&
                s.seatType !== "DRIVER_AREA" &&
                s.seatType !== "EMPTY_SPACE",
            ).length,
          },
        });

        if (trip.busId !== busId) {
          const bookings = await tx.booking.findMany({
            where: {
              tripId: trip.id,
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            },
            include: { seat: true },
          });

          for (const booking of bookings) {
            const newSeat = newBus.seats.find(
              (ns) => ns.label === booking.seat.label,
            );
            if (newSeat) {
              await tx.booking.update({
                where: { id: booking.id },
                data: { seatId: newSeat.id },
              });
            } else {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Cannot swap bus: Seat ${booking.seat.label} is missing on the new bus layout.`,
              });
            }
          }

          await tx.tripSeat.deleteMany({ where: { tripId: trip.id } });
          await tx.tripSeat.createMany({
            data: newBus.seats.map((seat) => ({
              tripId: trip.id,
              seatId: seat.id,
              isActive: seat.isActive,
            })),
          });
        }

        return updated;
      });

      // P3-6 — bus-assigned notices flow through the durable outbox,
      // keyed by user.id (was: direct Novu trigger keyed by email).
      const managers = await ctx.prisma.operator.findMany({
        where: {
          companyId: ctx.companyId,
          isActive: true,
          role: { in: ["OWNER", "MANAGER"] },
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
      });

      const assignedTrip = await ctx.prisma.trip.findUnique({
        where: { id: result.id },
        include: {
          bus: { select: { registrationPlate: true } },
          schedule: {
            select: {
              route: {
                select: {
                  name: true,
                  originTerminal: {
                    select: {
                      cityRelation: { select: { name: true } },
                      name: true,
                    },
                  },
                  destTerminal: {
                    select: {
                      cityRelation: { select: { name: true } },
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (assignedTrip?.bus) {
        const route = assignedTrip.schedule?.route as any;
        const routeName =
          route?.originTerminal?.cityRelation?.name &&
          route?.destTerminal?.cityRelation?.name
            ? `${route.originTerminal.cityRelation.name} to ${route.destTerminal.cityRelation.name}`
            : (route?.name ?? "Unknown Route");

        for (const manager of managers) {
          await enqueueOperatorBusAssigned(ctx.prisma as never, {
            payload: {
              tripId: assignedTrip.id,
              staffName: manager.user.fullName ?? "Manager",
              busPlate: assignedTrip.bus.registrationPlate,
              routeName,
              departureDate: assignedTrip.departureDate,
            },
            to: {
              subscriberId: manager.user.id,
              ...(manager.user.email ? { email: manager.user.email } : {}),
              ...(manager.user.fullName
                ? { firstName: manager.user.fullName.split(" ")[0] }
                : {}),
            },
          });
        }
      }

      return result;
    }),

  delay: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: delayTripSchema }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const { delayMinutes, notes } = input.data;

      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
          archivedAt: null,
        },
        include: {
          tripStops: true,
          schedule: {
            select: {
              route: {
                select: {
                  name: true,
                  originTerminal: {
                    select: { cityRelation: { select: { name: true } } },
                  },
                  destTerminal: {
                    select: { cityRelation: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      try {
        assertTripTransition(trip.status, "DELAYED");
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error ? err.message : "Invalid status transition",
        });
      }

      const updatedTrip = await ctx.prisma.$transaction(async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT id, "delayMinutes" FROM "trip" WHERE id = ${trip.id} FOR UPDATE`,
        );
        const locked = await tx.trip.findUniqueOrThrow({
          where: { id: trip.id },
          include: { tripStops: true },
        });

        const previousDelay = locked.delayMinutes ?? 0;
        const totalDelay = previousDelay + delayMinutes;
        const incremental = delayMinutes;

        for (const stop of locked.tripStops) {
          await tx.tripStop.update({
            where: { id: stop.id },
            data: {
              scheduledArrival: stop.scheduledArrival
                ? new Date(
                    stop.scheduledArrival.getTime() + incremental * 60000,
                  )
                : null,
              scheduledDeparture: stop.scheduledDeparture
                ? new Date(
                    stop.scheduledDeparture.getTime() + incremental * 60000,
                  )
                : null,
            },
          });
        }

        return tx.trip.update({
          where: { id: locked.id },
          data: {
            delayMinutes: totalDelay,
            status: "DELAYED",
            notes: notes ?? locked.notes,
            departureDate: new Date(
              locked.departureDate.getTime() + incremental * 60000,
            ),
            estimatedArrival: locked.estimatedArrival
              ? new Date(
                  locked.estimatedArrival.getTime() + incremental * 60000,
                )
              : null,
          },
        });
      });

      // Phase 19 (P3-5) — a shifted departure can silently create driver
      // double-bookings. Re-check every active assignment against the NEW
      // window; operators are throttled-alerted (per conflict per day) so
      // they stay in charge of any reassignment.
      const activeAssignments = await ctx.prisma.tripDriverAssignment.findMany({
        where: { tripId: trip.id, role: { in: ["PRIMARY", "RELIEF"] } },
        include: {
          driverProfile: {
            include: { user: { select: { id: true, fullName: true } } },
          },
        },
      });
      if (activeAssignments.length > 0) {
        const delayedRoute = (() => {
          const r = trip.schedule?.route as any;
          if (
            r?.originTerminal?.cityRelation?.name &&
            r?.destTerminal?.cityRelation?.name
          ) {
            return `${r.originTerminal.cityRelation.name} → ${r.destTerminal.cityRelation.name}`;
          }
          return r?.name ?? "ce trajet";
        })();

        for (const assignment of activeAssignments) {
          const driverConflict = await getDriverTripConflict(
            ctx.prisma,
            assignment.driverProfileId,
            {
              departureDate: updatedTrip.departureDate,
              estimatedArrival: updatedTrip.estimatedArrival,
              serviceType: updatedTrip.serviceType,
              excludeTripId: trip.id,
            },
          );
          if (!driverConflict) continue;

          for (const operator of await companyOperatorRecipients(
            ctx.prisma,
            ctx.companyId,
          )) {
            await enqueueOperatorDriverAssignmentConflict(ctx.prisma as never, {
              payload: {
                tripId: trip.id,
                conflictTripId: driverConflict.tripId,
                driverName:
                  assignment.driverProfile.user.fullName ?? "Un chauffeur",
                delayedRoute,
                conflictRoute: driverConflict.routeName,
                conflictCompany: driverConflict.companyName || null,
                busyUntilIso: driverConflict.busyUntilIso,
              },
              to: operator,
            });
          }
        }
      }

      const bookings = await ctx.prisma.booking.findMany({
        where: {
          tripId: trip.id,
          status: "CONFIRMED",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phoneNumber: true,
            },
          },
          trip: {
            include: {
              schedule: {
                include: {
                  route: {
                    include: {
                      originTerminal: {
                        include: {
                          cityRelation: true,
                          municipality: true,
                          quarter: true,
                        },
                      },
                      destTerminal: {
                        include: {
                          cityRelation: true,
                          municipality: true,
                          quarter: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Phase 07 (F-NF-02, D3/D4) — delay notices ride the durable outbox
      // instead of a direct Novu trigger: payload now carries the required
      // bookingReference, failures retry with backoff (never swallowed), and
      // the hourly transactionId bucket lets an escalating delay re-notify.
      if (bookings.length > 0) {
        const newDeparture = updatedTrip.departureDate;
        for (const booking of bookings) {
          const email =
            booking.user?.email ??
            (booking.passengerPhone
              ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
              : null);
          if (!email) continue;
          const originCity =
            booking.trip.schedule?.route.originTerminal.cityRelation?.name ??
            "Unknown";
          const destCity =
            booking.trip.schedule?.route.destTerminal.cityRelation?.name ??
            "Unknown";
          const originMunicipality =
            booking.trip.schedule?.route.originTerminal.municipality?.name ??
            null;
          const destMunicipality =
            booking.trip.schedule?.route.destTerminal.municipality?.name ??
            null;

          await enqueuePassengerTripDelayed(ctx.prisma, {
            tripId: trip.id,
            bookingId: booking.id,
            reportedBy: "OPERATOR",
            email,
            subscriberId: booking.user?.id ?? email,
            firstName:
              (booking.user?.fullName ?? booking.passengerName).split(" ")[0] ??
              undefined,
            data: {
              email,
              passengerName: booking.user?.fullName ?? booking.passengerName,
              originCity,
              destinationCity: destCity,
              originMunicipality,
              destinationMunicipality: destMunicipality,
              originalTime: trip.departureDate.toLocaleString("en-US", {
                timeZone: "Africa/Abidjan",
              }),
              newTime: newDeparture.toLocaleString("en-US", {
                timeZone: "Africa/Abidjan",
              }),
              delayMinutes: updatedTrip.delayMinutes ?? delayMinutes,
              gate: trip.gate ?? undefined,
              phone:
                booking.user?.phoneNumber ??
                booking.passengerPhone ??
                undefined,
              bookingReference: booking.bookingReference,
              reportedBy: "OPERATOR" as const,
            },
          });
        }
      }

      return updatedTrip;
    }),

  cancel: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: cancelTripSchema }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:cancel");
      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
          archivedAt: null,
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      try {
        assertTripTransition(trip.status, "CANCELLED");
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error ? err.message : "Invalid status transition",
        });
      }

      const result = await cancelTripWithRefunds({
        prisma: ctx.prisma,
        tripId: trip.id,
        cancelReason: input.data.cancelReason,
        refundChannel: input.data.refundChannel,
        actor: {
          userId: ctx.user.id,
          companyId: ctx.companyId,
          role: "OPERATOR",
        },
      });

      return {
        id: trip.id,
        status: "CANCELLED" as const,
        cancelReason: input.data.cancelReason,
        refundResults: result.refundResults,
        skippedCheckedIn: result.skippedCheckedIn,
      };
    }),

  updateStatus: operatorCompanyProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["BOARDING", "DEPARTED", "ARRIVED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const { status } = input;

      // Explicit type check to satisfy typescript even though it's already caught by Zod
      if ((status as string) === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use trips.cancel to cancel a trip (refunds required).",
        });
      }
      if ((status as string) === "DELAYED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use trips.delay to record a delay.",
        });
      }

      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
          archivedAt: null,
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      try {
        assertTripTransition(trip.status, status);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error ? err.message : "Invalid status transition",
        });
      }

      if (status === "BOARDING" && !trip.busId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot set a trip to BOARDING without an assigned bus.",
        });
      }

      const updateData: Record<string, unknown> = { status };

      if (status === "DEPARTED") {
        updateData["actualDeparture"] = new Date();
      } else if (status === "ARRIVED") {
        updateData["actualArrival"] = new Date();
      }

      let updatedTrip;
      if (status === "ARRIVED") {
        // Phase 06 (F-DV-04) — operator arrival converges driver operational
        // state exactly like drivers.completeTrip, so a dispatch-board
        // closure never strands drivers ON_TRIP with ghost buses on the
        // fleet map. The run physically happened: affected drivers also
        // earn the completed-run credit (parity with completeTrip). Drivers
        // who never started the run are untouched.
        updatedTrip = await ctx.prisma.$transaction(async (tx) => {
          const arrived = await tx.trip.update({
            where: { id: trip.id },
            data: updateData,
          });

          const runDrivers = await convergeDriversAfterRunEnd(
            tx as any,
            trip.id,
          );
          if (runDrivers.length > 0) {
            await tx.driverProfile.updateMany({
              where: { id: { in: runDrivers } },
              data: { totalTripsCompleted: { increment: 1 } },
            });
          }

          return arrived;
        });
      } else {
        updatedTrip = await ctx.prisma.trip.update({
          where: { id: trip.id },
          data: updateData,
        });
      }

      // Triggers for passenger boarding announcements and completed trip review requests
      if (status === "BOARDING") {
        const bookings = await ctx.prisma.booking.findMany({
          where: {
            tripId: trip.id,
            status: "CONFIRMED",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
              },
            },
            company: { select: { name: true } },
            trip: {
              include: {
                bus: true,
                schedule: {
                  include: {
                    route: {
                      include: {
                        originTerminal: {
                          include: {
                            cityRelation: true,
                            municipality: true,
                            quarter: true,
                          },
                        },
                        destTerminal: {
                          include: {
                            cityRelation: true,
                            municipality: true,
                            quarter: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (bookings.length > 0) {
          const novu = getNovuClient();
          if (novu) {
            try {
              for (const booking of bookings) {
                const email =
                  booking.user?.email ??
                  (booking.passengerPhone
                    ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
                    : null);
                if (email) {
                  await novu
                    .trigger({
                      workflowId: "passenger-trip-boarding",
                      to: {
                        subscriberId: booking.user?.id ?? email,
                        email: email,
                      },
                      payload: {
                        email,
                        passengerName:
                          booking.user?.fullName ?? booking.passengerName,
                        destinationCity:
                          booking.trip.schedule?.route.destTerminal.cityRelation
                            ?.name ?? "Unknown",
                        destinationMunicipality:
                          booking.trip.schedule?.route.destTerminal.municipality
                            ?.name ?? null,
                        gate: trip.gate ?? undefined,
                        busPlate:
                          booking.trip.bus?.registrationPlate ?? undefined,
                        phone:
                          booking.user?.phoneNumber ??
                          booking.passengerPhone ??
                          undefined,
                      },
                      transactionId: `passenger-trip-boarding-${trip.id}-${booking.id}`,
                    })
                    .catch(() => {});
                }
              }
            } catch (err) {
              console.error(
                `Failed to trigger Novu status transition (${status}) workflow:`,
                err,
              );
            }
          }
        }
      } else if (status === "ARRIVED") {
        // Shared with drivers.completeTrip — stamps booking.completedAt and
        // fans out passenger-review-request (Phase 16 parity).
        await finalizeTripArrival(ctx.prisma, trip.id);
      }

      return updatedTrip;
    }),

  updateNotes: operatorCompanyProcedure
    .input(z.object({ id: z.string(), notes: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const trip = await ctx.prisma.trip.findFirst({
        where: { id: input.id, companyId: ctx.companyId, archivedAt: null },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }
      return ctx.prisma.trip.update({
        where: { id: input.id },
        data: { notes: input.notes },
      });
    }),

  setGate: operatorCompanyProcedure
    .input(z.object({ id: z.string(), gate: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const trip = await ctx.prisma.trip.findFirst({
        where: { id: input.id, companyId: ctx.companyId, archivedAt: null },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      const updatedTrip = await ctx.prisma.trip.update({
        where: { id: input.id },
        data: { gate: input.gate },
      });

      if (input.gate) {
        const bookings = await ctx.prisma.booking.findMany({
          where: {
            tripId: trip.id,
            status: "CONFIRMED",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
              },
            },
            trip: {
              include: {
                schedule: {
                  include: {
                    route: {
                      include: {
                        destTerminal: {
                          include: {
                            cityRelation: true,
                            municipality: true,
                            quarter: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (bookings.length > 0) {
          const novu = getNovuClient();
          if (novu) {
            try {
              for (const booking of bookings) {
                const email =
                  booking.user?.email ??
                  (booking.passengerPhone
                    ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
                    : null);
                if (email) {
                  const destCity =
                    booking.trip.schedule?.route.destTerminal.cityRelation
                      ?.name ?? "Unknown";
                  const destMunicipality =
                    booking.trip.schedule?.route.destTerminal.municipality
                      ?.name ?? null;
                  await novu
                    .trigger({
                      workflowId: "passenger-trip-gate-updated",
                      to: {
                        subscriberId: booking.user?.id ?? email,
                        email: email,
                      },
                      payload: {
                        email,
                        passengerName:
                          booking.user?.fullName ?? booking.passengerName,
                        destinationCity: destCity,
                        destinationMunicipality: destMunicipality,
                        departureTime: trip.departureDate.toLocaleString(
                          "en-US",
                          {
                            timeZone: "Africa/Abidjan",
                          },
                        ),
                        gate: input.gate,
                        phone:
                          booking.user?.phoneNumber ??
                          booking.passengerPhone ??
                          undefined,
                      },
                      transactionId: `passenger-trip-gate-updated-${trip.id}-${booking.id}`,
                    })
                    .catch(() => {});
                }
              }
            } catch (err) {
              console.error(
                "Failed to trigger passenger-trip-gate-updated via Novu:",
                err,
              );
            }
          }
        }
      }

      return updatedTrip;
    }),

  toggleSingleTripSeatStatus: operatorCompanyProcedure
    .input(
      z.object({
        tripId: z.string(),
        seatId: z.string(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.tripId,
          companyId: ctx.companyId,
          archivedAt: null,
        },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      if (trip.status === "CANCELLED" || trip.status === "ARRIVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot update seat status for a trip that is ${trip.status}.`,
        });
      }

      // Check if seat is currently booked on this trip before disabling
      if (!input.isActive) {
        const activeBooking = await ctx.prisma.booking.findFirst({
          where: {
            tripId: input.tripId,
            seatId: input.seatId,
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
          },
        });
        if (activeBooking) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Cannot disable seat: An active booking exists for this seat on this trip.",
          });
        }
      }

      const tripSeat = await ctx.prisma.tripSeat.upsert({
        where: {
          tripId_seatId: {
            tripId: input.tripId,
            seatId: input.seatId,
          },
        },
        create: {
          tripId: input.tripId,
          seatId: input.seatId,
          isActive: input.isActive,
        },
        update: {
          isActive: input.isActive,
        },
      });

      // Sync Trip.totalSeats
      const count = await ctx.prisma.tripSeat.count({
        where: {
          tripId: input.tripId,
          isActive: true,
          seat: { isBookable: true },
        },
      });
      await ctx.prisma.trip.update({
        where: { id: input.tripId },
        data: { totalSeats: count },
      });

      return tripSeat;
    }),

  assignDriver: operatorCompanyProcedure
    .input(assignDriverToTripSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const { tripId, driverProfileId, role, startStopOrder, endStopOrder } =
        input;

      const trip = await ctx.prisma.trip.findFirst({
        where: { id: tripId, companyId: ctx.companyId, archivedAt: null },
        include: {
          bus: {
            select: {
              registrationPlate: true,
              busType: {
                select: { requiredLicenseCategory: true, name: true },
              },
            },
          },
          schedule: {
            select: {
              route: {
                select: {
                  name: true,
                  distanceKm: true,
                  originTerminal: {
                    select: {
                      cityRelation: { select: { name: true } },
                      name: true,
                    },
                  },
                  destTerminal: {
                    select: {
                      cityRelation: { select: { name: true } },
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: { bookings: { where: { status: "CONFIRMED" } } },
          },
        },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      // Status guard — assignment only meaningful pre-departure
      if (!["SCHEDULED", "DELAYED", "BOARDING"].includes(trip.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot assign drivers to a ${trip.status.toLowerCase()} trip.`,
        });
      }

      const assignRoute = trip.schedule?.route as any;
      const routeLabel = {
        origin:
          assignRoute?.originTerminal?.cityRelation?.name ??
          assignRoute?.originTerminal?.name ??
          assignRoute?.name ??
          "Trajet",
        destination:
          assignRoute?.destTerminal?.cityRelation?.name ??
          assignRoute?.destTerminal?.name ??
          "—",
      };

      const driver = await ctx.prisma.driverProfile.findFirst({
        where: {
          id: driverProfileId,
          companyAffiliations: {
            some: { companyId: ctx.companyId, isActive: true },
          },
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      });
      if (!driver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver not affiliated with your company.",
        });
      }

      if (driver.verificationStatus !== "VERIFIED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot assign driver: Driving license compliance is not verified.",
        });
      }

      // License gate — CI ordering B < C < D < E vs the bus type requirement
      const requiredLicense = trip.bus?.busType?.requiredLicenseCategory;
      if (
        requiredLicense &&
        !licenseMeetsRequirement(driver.licenseCategory, requiredLicense)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `License mismatch: this bus (${trip.bus?.busType?.name ?? "type"}) requires class ${requiredLicense}; driver holds ${driver.licenseCategory}.`,
        });
      }

      // Phase 14 (F-OP-03) — licence must be valid THROUGH the run: a licence
      // expiring mid-trip is exactly as unusable as an expired one.
      const licenceThrough = trip.estimatedArrival ?? trip.departureDate;
      if (!isLicenseUsableThrough(driver.licenseExpiryDate, licenceThrough)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot assign driver: their license expires ${driver.licenseExpiryDate ? new Date(driver.licenseExpiryDate).toISOString().slice(0, 10) : "before"} this trip ends (${licenceThrough.toISOString().slice(0, 10)}).`,
        });
      }

      const recipient: DriverRecipient = {
        subscriberId: driver.userId,
        ...(driver.user.email ? { email: driver.user.email } : {}),
        ...(driver.user.fullName
          ? { firstName: driver.user.fullName.split(" ")[0] }
          : {}),
      };

      // Same-trip duplicate guard — one person, one role per trip
      const existingSameDriver =
        await ctx.prisma.tripDriverAssignment.findFirst({
          where: { tripId, driverProfileId },
        });

      await ctx.prisma.$transaction(async (tx) => {
        // Phase 18 (P2-8) — serialize concurrent assignments: lock the trip row,
        // then the driver row. unassignDriver follows the SAME order; never invert.
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "trip" WHERE id = ${tripId} FOR UPDATE`,
        );
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "driver_profile" WHERE id = ${driverProfileId} FOR UPDATE`,
        );

        let displacedName: string | null = null;
        let displacedUserId: string | null = null;
        let displacedEmail: string | null = null;

        if (role === "PRIMARY") {
          if (existingSameDriver && existingSameDriver.role !== "PRIMARY") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This driver already has a role on this trip.",
            });
          }
          if (trip.driverId && trip.driverId !== driverProfileId) {
            const displaced = await tx.driverProfile.findUnique({
              where: { id: trip.driverId },
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            });
            if (!displaced) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Current primary driver not found",
              });
            }
            if (!input.replacePrimary) {
              throw new TRPCError({
                code: "CONFLICT",
                message: `PRIMARY_ASSIGNED::${displaced.user.fullName ?? "Unknown"}`,
              });
            }
            displacedName = displaced.user.fullName ?? "Un chauffeur";
            displacedUserId = displaced.userId;
            displacedEmail = displaced.user.email ?? null;

            await tx.tripDriverAssignment.deleteMany({
              where: {
                tripId,
                driverProfileId: trip.driverId,
                role: "PRIMARY",
              },
            });
          }
          await tx.trip.update({
            where: { id: tripId },
            data: { driverId: driverProfileId },
          });
        } else if (role === "RELIEF") {
          if (existingSameDriver && existingSameDriver.role !== "RELIEF") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This driver already has a role on this trip.",
            });
          }
          if (trip.reliefDriverId && trip.reliefDriverId !== driverProfileId) {
            const displaced = await tx.driverProfile.findUnique({
              where: { id: trip.reliefDriverId },
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            });
            if (displaced) {
              if (!input.replacePrimary) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: `RELIEF_ASSIGNED::${displaced.user.fullName ?? "Unknown"}`,
                });
              }
              displacedName = displaced.user.fullName ?? "Un chauffeur";
              displacedUserId = displaced.userId;
              displacedEmail = displaced.user.email ?? null;

              await tx.tripDriverAssignment.deleteMany({
                where: {
                  tripId,
                  driverProfileId: trip.reliefDriverId,
                  role: "RELIEF",
                },
              });
            }
          }
          await tx.trip.update({
            where: { id: tripId },
            data: { reliefDriverId: driverProfileId },
          });
        } else {
          // CONDUCTOR — junction-only record
          if (existingSameDriver) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This driver already has a role on this trip.",
            });
          }
        }

        // Double-booking engine — cross-company interval overlap w/ turnaround buffer
        const conflict = await getDriverTripConflict(tx, driverProfileId, {
          departureDate: trip.departureDate,
          estimatedArrival: trip.estimatedArrival,
          serviceType: trip.serviceType,
          routeDistanceKm: assignRoute?.distanceKm ?? null,
          excludeTripId: tripId,
        });
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Driver is already booked on "${conflict.routeName}"${conflict.companyName ? ` (${conflict.companyName})` : ""} — busy until ${conflict.busyUntilIso.substring(11, 16)} UTC including turnaround.`,
          });
        }

        // Backstop: the partial unique indexes (one PRIMARY/RELIEF per trip)
        // turn any race that slips past the locks into a clean conflict.
        try {
          await tx.tripDriverAssignment.upsert({
            where: {
              tripId_driverProfileId_role: {
                tripId,
                driverProfileId,
                role,
              },
            },
            create: {
              tripId,
              driverProfileId,
              role,
              startStopOrder,
              endStopOrder: endStopOrder ?? null,
              assignedByStaffId: ctx.user.id,
            },
            update: {
              startStopOrder,
              ...(endStopOrder !== undefined ? { endStopOrder } : {}),
            },
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Another operator just confirmed a ${role} on this trip. Reload and review before replacing them.`,
            });
          }
          throw err;
        }

        // Notify the assigned driver — urgent variant inside the 2h window
        const minutesToDeparture =
          (new Date(trip.departureDate).getTime() - Date.now()) / 60000;
        const urgent =
          minutesToDeparture > 0 &&
          minutesToDeparture <= URGENT_DISPATCH_WINDOW_HOURS * 60;

        const companyName =
          (
            await tx.company.findUnique({
              where: { id: ctx.companyId },
              select: { name: true },
            })
          )?.name ?? "Votre opérateur";

        await enqueueDriverTripAssigned(tx as never, {
          payload: {
            tripId,
            companyName,
            busPlate: trip.bus?.registrationPlate ?? null,
            originName: routeLabel.origin,
            destinationName: routeLabel.destination,
            departureDate: trip.departureDate,
            bookedPassengers: trip._count.bookings,
            totalSeats: trip.totalSeats,
          },
          to: recipient,
          urgent,
        });

        // Notify the displaced driver when a PRIMARY/RELIEF was replaced
        if (displacedUserId) {
          await enqueueDriverTripUnassigned(tx as never, {
            payload: {
              tripId,
              companyName,
              busPlate: trip.bus?.registrationPlate ?? null,
              originName: routeLabel.origin,
              destinationName: routeLabel.destination,
              departureDate: trip.departureDate,
              bookedPassengers: trip._count.bookings,
              totalSeats: trip.totalSeats,
            },
            to: {
              subscriberId: displacedUserId,
              ...(displacedEmail ? { email: displacedEmail } : {}),
              ...(displacedName
                ? { firstName: displacedName.split(" ")[0] }
                : {}),
            },
          });
        }
      });

      return { success: true };
    }),

  unassignDriver: operatorCompanyProcedure
    .input(unassignDriverFromTripSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const { tripId, driverProfileId, role } = input;

      const trip = await ctx.prisma.trip.findFirst({
        where: { id: tripId, companyId: ctx.companyId, archivedAt: null },
        include: {
          schedule: {
            select: {
              route: {
                select: {
                  name: true,
                  originTerminal: {
                    select: {
                      cityRelation: { select: { name: true } },
                      name: true,
                    },
                  },
                  destTerminal: {
                    select: {
                      cityRelation: { select: { name: true } },
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
        },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      // Phase 06 (F-DV-04) + Phase 26 (F-OP-11) — DECISION: unassignment
      // mirrors assignDriver's window exactly. Pre-departure mistakes stay
      // fixable; DEPARTED runs refuse (cancellation via cancelTripWithRefunds
      // is the single post-departure lever and converges driver state), and
      // ARRIVED/CANCELLED runs become immutable history — manifest attribution
      // and assignment records can no longer be rewritten after the fact.
      // System-driven removals ride Phase 06's convergence path instead.
      if (
        !["SCHEDULED", "DELAYED", "BOARDING"].includes(trip.status as string)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            trip.status === "DEPARTED"
              ? "Cannot unassign a driver after departure. Cancel the trip instead."
              : `Cannot unassign a driver from a ${trip.status.toLowerCase()} trip.`,
        });
      }

      const unassignRoute = trip.schedule?.route as any;
      const unassignRouteLabel = {
        origin:
          unassignRoute?.originTerminal?.cityRelation?.name ??
          unassignRoute?.originTerminal?.name ??
          unassignRoute?.name ??
          "Trajet",
        destination:
          unassignRoute?.destTerminal?.cityRelation?.name ??
          unassignRoute?.destTerminal?.name ??
          "—",
      };

      const driver = await ctx.prisma.driverProfile.findUnique({
        where: { id: driverProfileId },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      });
      if (!driver) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Driver not found" });
      }

      await ctx.prisma.$transaction(async (tx) => {
        // Phase 18 (P2-8) — same lock order as assignDriver: trip row, then
        // driver row. Keeps unassign/replace races serialized.
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "trip" WHERE id = ${tripId} FOR UPDATE`,
        );
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "driver_profile" WHERE id = ${driverProfileId} FOR UPDATE`,
        );

        const deleted = await tx.tripDriverAssignment.deleteMany({
          where: { tripId, driverProfileId, role },
        });
        if (deleted.count === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This driver does not hold that role on this trip.",
          });
        }

        if (role === "PRIMARY" && trip.driverId === driverProfileId) {
          await tx.trip.update({
            where: { id: tripId },
            data: { driverId: null },
          });
        } else if (
          role === "RELIEF" &&
          trip.reliefDriverId === driverProfileId
        ) {
          await tx.trip.update({
            where: { id: tripId },
            data: { reliefDriverId: null },
          });
        }

        await enqueueDriverTripUnassigned(tx as never, {
          payload: {
            tripId,
            companyName:
              (
                await tx.company.findUnique({
                  where: { id: ctx.companyId },
                  select: { name: true },
                })
              )?.name ?? "Votre opérateur",
            busPlate: null,
            originName: unassignRouteLabel.origin,
            destinationName: unassignRouteLabel.destination,
            departureDate: trip.departureDate,
            bookedPassengers: trip._count.bookings,
            totalSeats: trip.totalSeats,
          },
          to: {
            subscriberId: driver.userId,
            ...(driver.user.email ? { email: driver.user.email } : {}),
            ...(driver.user.fullName
              ? { firstName: driver.user.fullName.split(" ")[0] }
              : {}),
          },
        });
      });

      return { success: true };
    }),
});
