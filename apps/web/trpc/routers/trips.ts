import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Prisma } from "@moja/db";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import { requirePermission } from "@/lib/permissions/authorize";

import {
  assignBusSchema,
  delayTripSchema,
  cancelTripSchema,
  tripStatusEnum,
} from "@moja/schemas";
import { cancelTripWithRefunds } from "@/lib/cancel-trip-with-refunds";
import { assertTripTransition } from "@/lib/trip-status";
import {
  getAppRollingTripWindow,
  getCalendarDateKey,
} from "@/lib/timezone";
import { getNovuClient } from "@/lib/novu";

export const tripsRouter = createTRPCRouter({
  create: operatorCompanyProcedure
    .input(z.object({ scheduleId: z.string(), busId: z.string(), departureDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:create");
      const schedule = await ctx.prisma.schedule.findUnique({
        where: { id: input.scheduleId, companyId: ctx.companyId },
        include: { route: { include: { waypoints: { orderBy: { stopOrder: "asc" } } } } },
      });
      if (!schedule) throw new TRPCError({ code: "NOT_FOUND", message: "Schedule not found" });

      const bus = await ctx.prisma.bus.findFirst({
        where: { id: input.busId, companyId: ctx.companyId, status: "ACTIVE", deletedAt: null },
        include: { seats: { where: { isActive: true } } },
      });
      if (!bus) throw new TRPCError({ code: "BAD_REQUEST", message: "Bus invalid or not active" });

      const departureTimestamp = new Date(input.departureDate);

      const existingTrip = await ctx.prisma.trip.findFirst({
        where: { scheduleId: input.scheduleId, departureDate: departureTimestamp },
      });
      if (existingTrip) throw new TRPCError({ code: "CONFLICT", message: "Trip already exists for this time" });

      return ctx.prisma.$transaction(async (tx) => {
        const createdTrip = await tx.trip.create({
          data: {
            scheduleId: input.scheduleId,
            companyId: ctx.companyId,
            busId: input.busId,
            departureDate: departureTimestamp,
            estimatedArrival: new Date(departureTimestamp.getTime() + (schedule.route.estimatedMinutes ?? 0) * 60000),
            totalSeats: bus.seats.length,
            status: "SCHEDULED",
            routeSnapshotJson: {
              ...schedule.route,
              version: 1,
            },
          },
        });

        const lastWaypointOrder = schedule.route.waypoints.length > 0 ? schedule.route.waypoints[schedule.route.waypoints.length - 1]!.stopOrder : 0;
        const destStopOrder = lastWaypointOrder + 1;

        await tx.tripStop.createMany({
          data: [
            { tripId: createdTrip.id, terminalId: schedule.route.originTerminalId, stopOrder: 0, scheduledArrival: departureTimestamp, scheduledDeparture: departureTimestamp, isPickup: true, isDropoff: false },
            ...schedule.route.waypoints.map(w => ({
              tripId: createdTrip.id, terminalId: w.terminalId, stopOrder: w.stopOrder, scheduledArrival: new Date(departureTimestamp.getTime() + w.arrivalOffsetMinutes * 60000), scheduledDeparture: new Date(departureTimestamp.getTime() + w.departureOffsetMinutes * 60000), isPickup: w.isPickup, isDropoff: w.isDropoff
            })),
            { tripId: createdTrip.id, terminalId: schedule.route.destTerminalId, stopOrder: destStopOrder, scheduledArrival: new Date(departureTimestamp.getTime() + (schedule.route.estimatedMinutes ?? 0) * 60000), scheduledDeparture: new Date(departureTimestamp.getTime() + (schedule.route.estimatedMinutes ?? 0) * 60000), isPickup: false, isDropoff: true }
          ]
        });

        await tx.tripSeat.createMany({
          data: bus.seats.map(seat => ({ tripId: createdTrip.id, seatId: seat.id, isActive: true }))
        });

        return createdTrip;
      });
    }),

  list: operatorCompanyProcedure
    .input(
      z
        .object({
          status: tripStatusEnum.optional(),
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
        departureDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (input?.status) {
        filters["status"] = input.status;
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
            schedule: {
              include: {
                route: {
                  include: {
                    originTerminal: { include: { cityRelation: true } },
                    destTerminal: { include: { cityRelation: true } },
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
      const where: Prisma.TripWhereInput = { companyId: ctx.companyId };
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
        },
        include: {
          bus: {
            include: { busType: true },
          },
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: { include: { cityRelation: true } },
                  destTerminal: { include: { cityRelation: true } },
                  waypoints: { orderBy: { stopOrder: "asc" } },
                },
              },
            },
          },
          tripStops: {
            orderBy: { stopOrder: "asc" },
            include: {
              terminal: { include: { cityRelation: true } },
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
                  terminal: { include: { cityRelation: true } },
                },
              },
              destinationTripStop: {
                include: {
                  terminal: { include: { cityRelation: true } },
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
        },
        include: {
          bus: {
            include: { busType: true },
          },
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: { include: { cityRelation: true } },
                  destTerminal: { include: { cityRelation: true } },
                  waypoints: { orderBy: { stopOrder: "asc" } },
                },
              },
            },
          },
          tripStops: {
            orderBy: { stopOrder: "asc" },
            include: {
              terminal: { include: { cityRelation: true } },
            },
          },
          bookings: {
            include: {
              seat: true,
              originTripStop: {
                include: {
                  terminal: { include: { cityRelation: true } },
                },
              },
              destinationTripStop: {
                include: {
                  terminal: { include: { cityRelation: true } },
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

      const ALLOWED_ASSIGN = new Set([
        "SCHEDULED",
        "BOARDING",
        "DELAYED",
      ]);

      const result = await ctx.prisma.$transaction(async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "trip" WHERE id = ${input.id} FOR UPDATE`,
        );

        const trip = await tx.trip.findFirst({
          where: {
            id: input.id,
            companyId: ctx.companyId,
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
          include: { seats: { where: { isActive: true } } },
        });

        if (!newBus) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected bus is invalid or inactive",
          });
        }

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
            totalSeats: newBus.seats.length,
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
              isActive: true,
            })),
          });
        }

        return updated;
      });

      // Trigger operator-bus-assigned to company managers
      const managers = await ctx.prisma.operator.findMany({
        where: {
          companyId: ctx.companyId,
          isActive: true,
          role: { in: ["OWNER", "MANAGER"] },
        },
        include: {
          user: { select: { email: true, fullName: true, phoneNumber: true } },
        },
      });

      const assignedTrip = await ctx.prisma.trip.findUnique({
        where: { id: result.id },
        include: {
          bus: true,
          schedule: {
            include: {
              route: {
                include: {
                  originTerminal: { include: { cityRelation: true } },
                  destTerminal: { include: { cityRelation: true } },
                },
              },
            },
          },
        },
      });

      const routeName = assignedTrip?.schedule
        ? `${assignedTrip.schedule.route.originTerminal.cityRelation?.name ?? "Unknown"} to ${assignedTrip.schedule.route.destTerminal.cityRelation?.name ?? "Unknown"}`
        : "Unknown Route";

      const novu = getNovuClient();
      if (novu && managers.length > 0 && assignedTrip?.bus) {
        try {
          for (const manager of managers) {
            if (manager.user?.email) {
              await novu
                .trigger({
                  workflowId: "operator-bus-assigned",
                  to: {
                    subscriberId: manager.user.email,
                    email: manager.user.email,
                  },
                  payload: {
                    email: manager.user.email,
                    staffName: manager.user.fullName ?? "Manager",
                    busPlate: assignedTrip.bus.registrationPlate,
                    routeName,
                    departureTime: assignedTrip.departureDate.toLocaleString(
                      "en-US",
                      { timeZone: "Africa/Abidjan" },
                    ),
                    phone: manager.user.phoneNumber ?? undefined,
                  },
                  transactionId: `operator-bus-assigned-${assignedTrip.id}-${manager.id}`,
                })
                .catch(() => {});
            }
          }
        } catch (err) {
          console.error("Failed to trigger operator-bus-assigned via Novu:", err);
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
        },
        include: { tripStops: true },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      try {
        assertTripTransition(trip.status, "DELAYED");
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Invalid status transition",
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
                ? new Date(stop.scheduledArrival.getTime() + incremental * 60000)
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
              ? new Date(locked.estimatedArrival.getTime() + incremental * 60000)
              : null,
          },
        });
      });

      const bookings = await ctx.prisma.booking.findMany({
        where: {
          tripId: trip.id,
          status: "CONFIRMED",
        },
        include: {
          user: { select: { email: true, fullName: true, phoneNumber: true } },
          trip: {
            include: {
              schedule: {
                include: {
                  route: {
                    include: {
                      originTerminal: { include: { cityRelation: true } },
                      destTerminal: { include: { cityRelation: true } },
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
            const newDeparture = updatedTrip.departureDate;
            for (const booking of bookings) {
              const email =
                booking.user?.email ??
                (booking.passengerPhone
                  ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
                  : null);
              if (email) {
                const originCity =
                  booking.trip.schedule.route.originTerminal.cityRelation
                    ?.name ?? "Unknown";
                const destCity =
                  booking.trip.schedule.route.destTerminal.cityRelation?.name ??
                  "Unknown";

                await novu
                  .trigger({
                    workflowId: "passenger-trip-delayed",
                    to: {
                      subscriberId: email,
                      email: email,
                    },
                    payload: {
                      email,
                      passengerName:
                        booking.user?.fullName ?? booking.passengerName,
                      originCity,
                      destinationCity: destCity,
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
                    },
                    transactionId: `passenger-trip-delayed-${trip.id}-${booking.id}`,
                  })
                  .catch(() => {});
              }
            }
          } catch (err) {
            console.error(
              "Failed to trigger passenger-trip-delayed via Novu:",
              err,
            );
          }
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
          message: err instanceof Error ? err.message : "Invalid status transition",
        });
      }

      const result = await cancelTripWithRefunds({
        prisma: ctx.prisma,
        tripId: trip.id,
        cancelReason: input.data.cancelReason,
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
      };
    }),

      updateStatus: operatorCompanyProcedure
    .input(z.object({ id: z.string(), status: z.enum(["BOARDING", "DEPARTED", "ARRIVED"]) }))
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
          message: err instanceof Error ? err.message : "Invalid status transition",
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
        await ctx.prisma.booking.updateMany({
          where: {
            tripId: trip.id,
            status: "CONFIRMED",
            completedAt: null,
          },
          data: { completedAt: new Date() },
        });
      }

      const updatedTrip = await ctx.prisma.trip.update({
        where: { id: trip.id },
        data: updateData,
      });

      // Triggers for passenger boarding announcements and completed trip review requests
      if (status === "BOARDING" || status === "ARRIVED") {
        const bookings = await ctx.prisma.booking.findMany({
          where: {
            tripId: trip.id,
            status: "CONFIRMED",
          },
          include: {
            user: { select: { email: true, fullName: true, phoneNumber: true } },
            company: { select: { name: true } },
            trip: {
              include: {
                bus: true,
                schedule: {
                  include: {
                    route: {
                      include: {
                        originTerminal: { include: { cityRelation: true } },
                        destTerminal: { include: { cityRelation: true } },
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
                const email = booking.user?.email ?? (booking.passengerPhone ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci` : null);
                if (email) {
                  const originCity = booking.trip.schedule.route.originTerminal.cityRelation?.name ?? "Unknown";
                  const destCity = booking.trip.schedule.route.destTerminal.cityRelation?.name ?? "Unknown";

                  if (status === "BOARDING") {
                    await novu.trigger({
                      workflowId: "passenger-trip-boarding",
                      to: {
                        subscriberId: email,
                        email: email,
                      },
                      payload: {
                        email,
                        passengerName: booking.user?.fullName ?? booking.passengerName,
                        destinationCity: destCity,
                        gate: trip.gate ?? undefined,
                        busPlate: booking.trip.bus?.registrationPlate ?? undefined,
                        phone: booking.user?.phoneNumber ?? booking.passengerPhone ?? undefined,
                      },
                      transactionId: `passenger-trip-boarding-${trip.id}-${booking.id}`,
                    }).catch(() => {});
                  } else if (status === "ARRIVED") {
                    await novu.trigger({
                      workflowId: "passenger-review-request",
                      to: {
                        subscriberId: email,
                        email: email,
                      },
                      payload: {
                        email,
                        passengerName: booking.user?.fullName ?? booking.passengerName,
                        companyName: booking.company.name,
                        originCity,
                        destinationCity: destCity,
                        tripId: trip.id,
                        bookingReference: booking.bookingReference,
                      },
                      transactionId: `passenger-review-request-${trip.id}-${booking.id}`,
                    }).catch(() => {});
                  }
                }
              }
            } catch (err) {
              console.error(`Failed to trigger Novu status transition (${status}) workflow:`, err);
            }
          }
        }
      }

      return updatedTrip;
    }),

  updateNotes: operatorCompanyProcedure
    .input(z.object({ id: z.string(), notes: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "trips:update");
      const trip = await ctx.prisma.trip.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
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
        where: { id: input.id, companyId: ctx.companyId },
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
            user: { select: { email: true, fullName: true, phoneNumber: true } },
            trip: {
              include: {
                schedule: {
                  include: {
                    route: {
                      include: {
                        destTerminal: { include: { cityRelation: true } },
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
                const email = booking.user?.email ?? (booking.passengerPhone ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci` : null);
                if (email) {
                  const destCity = booking.trip.schedule.route.destTerminal.cityRelation?.name ?? "Unknown";
                  await novu.trigger({
                    workflowId: "passenger-trip-gate-updated",
                    to: {
                      subscriberId: email,
                      email: email,
                    },
                    payload: {
                      email,
                      passengerName: booking.user?.fullName ?? booking.passengerName,
                      destinationCity: destCity,
                      departureTime: trip.departureDate.toLocaleString("en-US", {
                        timeZone: "Africa/Abidjan",
                      }),
                      gate: input.gate,
                      phone: booking.user?.phoneNumber ?? booking.passengerPhone ?? undefined,
                    },
                    transactionId: `passenger-trip-gate-updated-${trip.id}-${booking.id}`,
                  }).catch(() => {});
                }
              }
            } catch (err) {
              console.error("Failed to trigger passenger-trip-gate-updated via Novu:", err);
            }
          }
        }
      }

      return updatedTrip;
    }),
});
