import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import {
  createScheduleSchema,
  updateScheduleBasicSchema,
  updateCalendarSchema,
  updateFareSchema,
  addFareSchema,
  exceptionSchema,
  listSchedulesSchema,
} from "@moja/schemas";
import { generateTripsForSchedule } from "@/lib/trip-generator";
import {
  buildAppDepartureTimestamp,
  addAppCalendarDays,
  startOfAppCalendarDay,
} from "@/lib/timezone";
import { requirePermission } from "@/lib/permissions/authorize";
import { cancelTripWithRefunds } from "@/lib/cancel-trip-with-refunds";
import { getCandidateDepartureDates } from "@/lib/schedule-trip-window";
import type { PrismaClient } from "@moja/db";

async function pruneUnbookedFutureTrips(
  prisma: PrismaClient,
  scheduleId: string,
  companyId: string,
) {
  const now = startOfAppCalendarDay(new Date());
  const futureTrips = await prisma.trip.findMany({
    where: {
      scheduleId,
      companyId,
      status: "SCHEDULED",
      departureDate: { gte: now },
    },
    select: {
      id: true,
      _count: {
        select: {
          bookings: {
            where: {
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            },
          },
        },
      },
    },
  });

  // We don't delete booked trips here, they are handled by cancelTripWithRefunds later
  const deletableIds = futureTrips
    .filter((t: { _count: { bookings: number } }) => t._count.bookings === 0)
    .map((t: { id: string }) => t.id);

  if (deletableIds.length > 0) {
    await prisma.trip.deleteMany({
      where: { id: { in: deletableIds } },
    });
  }

  return deletableIds.length;
}

async function reconcileScheduleTrips(
  prisma: PrismaClient,
  scheduleId: string,
  companyId: string,
  busId: string,
  actorUserId?: string,
) {
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, companyId },
    include: { calendar: true, exceptions: true },
  });
  if (!schedule?.calendar || !schedule.isActive) {
    return { prunedTrips: 0, tripsCreated: 0 };
  }

  const pruned = await pruneUnbookedFutureTrips(prisma, scheduleId, companyId);
  const candidates = getCandidateDepartureDates({
    departureTime: schedule.departureTime,
    calendar: {
      monday: schedule.calendar.monday,
      tuesday: schedule.calendar.tuesday,
      wednesday: schedule.calendar.wednesday,
      thursday: schedule.calendar.thursday,
      friday: schedule.calendar.friday,
      saturday: schedule.calendar.saturday,
      sunday: schedule.calendar.sunday,
      validFrom: schedule.calendar.validFrom,
      validUntil: schedule.calendar.validUntil,
    },
    exceptions: schedule.exceptions.map((e) => ({
      date: e.date,
      type: e.type,
      overrideDepartureTime: e.overrideDepartureTime,
    })),
    daysCount: 14,
  });
  const allowed = new Set(
    candidates.map((c) => c.departureTimestamp.toISOString()),
  );

  const windowStart = startOfAppCalendarDay(new Date());
  const windowEnd = addAppCalendarDays(windowStart, 14);
  const leftover = await prisma.trip.findMany({
    where: {
      scheduleId,
      status: "SCHEDULED",
      departureDate: { gte: windowStart, lt: windowEnd },
    },
    select: {
      id: true,
      departureDate: true,
      _count: {
        select: {
          bookings: {
            where: {
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
            },
          },
        },
      },
    },
  });

  const mismatchUnbookedIds = leftover
    .filter(
      (t) =>
        t._count.bookings === 0 &&
        !allowed.has(t.departureDate.toISOString()),
    )
    .map((t) => t.id);

  if (mismatchUnbookedIds.length > 0) {
    await prisma.trip.deleteMany({ where: { id: { in: mismatchUnbookedIds } } });
  }

  const mismatchBookedTrips = leftover.filter(
    (t) =>
      t._count.bookings > 0 &&
      !allowed.has(t.departureDate.toISOString()),
  );

  let cancelledBooked = 0;
  if (actorUserId && mismatchBookedTrips.length > 0) {
    for (const trip of mismatchBookedTrips) {
      try {
        await cancelTripWithRefunds({
          prisma,
          tripId: trip.id,
          cancelReason: "Schedule was modified or cancelled",
          actor: {
            userId: actorUserId,
            companyId,
            role: "OPERATOR",
          },
          forceAfterDeparture: false,
        });
        cancelledBooked++;
      } catch (err) {
        console.error("Failed to cancel trip during reconcile:", err);
      }
    }
  }

  const created = await generateTripsForSchedule(scheduleId, busId, 14);
  return {
    prunedTrips: pruned + mismatchUnbookedIds.length + cancelledBooked,
    tripsCreated: created.length,
  };
}

export const schedulesRouter = createTRPCRouter({
  list: operatorCompanyProcedure
    .input(listSchedulesSchema.optional())
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:read");
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 24;
      const q = input?.q?.trim();

      const where = {
        companyId: ctx.companyId,
        ...(input?.routeId ? { routeId: input.routeId } : {}),
        ...(input?.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                {
                  route: {
                    name: { contains: q, mode: "insensitive" as const },
                  },
                },
              ],
            }
          : {}),
      };

      const orderBy =
        input?.sort === "departureTime_desc"
          ? { departureTime: "desc" as const }
          : input?.sort === "name_asc"
            ? { name: "asc" as const }
            : input?.sort === "updated_desc"
              ? { updatedAt: "desc" as const }
              : { departureTime: "asc" as const };

      const windowStart = startOfAppCalendarDay(new Date());
      const windowEnd = addAppCalendarDays(windowStart, 14);

      const [total, schedules] = await Promise.all([
        ctx.prisma.schedule.count({ where }),
        ctx.prisma.schedule.findMany({
          where,
          include: {
            route: {
              include: {
                originTerminal: { include: { cityRelation: true } },
                destTerminal: { include: { cityRelation: true } },
              },
            },
            calendar: true,
            preferredBus: {
              select: {
                id: true,
                registrationPlate: true,
                internalName: true,
                status: true,
              },
            },
            _count: {
              select: {
                trips: true,
                fares: true,
              },
            },
          },
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      const scheduleIds = schedules.map((s) => s.id);
      const futureTripCounts =
        scheduleIds.length === 0
          ? []
          : await ctx.prisma.trip.groupBy({
              by: ["scheduleId"],
              where: {
                scheduleId: { in: scheduleIds },
                departureDate: { gte: windowStart, lt: windowEnd },
                status: { not: "CANCELLED" },
              },
              _count: { _all: true },
            });
      const futureMap = new Map(
        futureTripCounts.map((r) => [r.scheduleId, r._count._all]),
      );

      return {
        items: schedules.map((s) => ({
          ...s,
          futureTripsInWindow: futureMap.get(s.id) ?? 0,
        })),
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      };
    }),

  get: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:read");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
        },
        include: {
          route: {
            include: {
              originTerminal: { include: { cityRelation: true } },
              destTerminal: { include: { cityRelation: true } },
              waypoints: {
                orderBy: { stopOrder: "asc" },
                include: {
                  terminal: { include: { cityRelation: true } },
                },
              },
            },
          },
          calendar: true,
          preferredBus: {
            select: {
              id: true,
              registrationPlate: true,
              internalName: true,
              status: true,
            },
          },
          exceptions: {
            orderBy: { date: "asc" },
          },
          fares: {
            orderBy: [{ seatClass: "asc" }, { fromStopOrder: "asc" }],
          },
        },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      return schedule;
    }),

  create: operatorCompanyProcedure
    .input(createScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:create");
      const { name, routeId, preferredBusId, departureTime, calendar, fares } =
        input;

      const route = await ctx.prisma.route.findFirst({
        where: { id: routeId, companyId: ctx.companyId, status: "ACTIVE" },
        include: { waypoints: { orderBy: { stopOrder: "asc" } } },
      });
      if (!route) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or inactive route selected",
        });
      }

      const lastStopOrder =
        route.waypoints.length > 0
          ? route.waypoints[route.waypoints.length - 1]!.stopOrder + 1
          : 1;
      const hasFullRoute = fares.some(
        (f) =>
          f.fromStopOrder === 0 &&
          f.toStopOrder === lastStopOrder &&
          f.priceXOF > 0,
      );
      if (!hasFullRoute) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "At least one fare covering origin to destination is required",
        });
      }

      const bus = await ctx.prisma.bus.findFirst({
        where: {
          id: preferredBusId,
          companyId: ctx.companyId,
          status: "ACTIVE",
          deletedAt: null,
        },
      });
      if (!bus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected bus is invalid or is not active",
        });
      }

      const newSchedule = await ctx.prisma.$transaction(async (tx) => {
        const schedule = await tx.schedule.create({
          data: {
            companyId: ctx.companyId,
            routeId,
            name: name ?? null,
            departureTime,
            isActive: true,
            preferredBusId,
          },
        });

        await tx.serviceCalendar.create({
          data: {
            scheduleId: schedule.id,
            monday: calendar.monday,
            tuesday: calendar.tuesday,
            wednesday: calendar.wednesday,
            thursday: calendar.thursday,
            friday: calendar.friday,
            saturday: calendar.saturday,
            sunday: calendar.sunday,
            validFrom: new Date(calendar.validFrom),
            validUntil: calendar.validUntil
              ? new Date(calendar.validUntil)
              : null,
          },
        });

        for (const f of fares) {
          if (f.fromStopOrder >= f.toStopOrder) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Fare segment invalid: fromStopOrder (${f.fromStopOrder}) must be less than toStopOrder (${f.toStopOrder}).`,
            });
          }
          await tx.fare.create({
            data: {
              scheduleId: schedule.id,
              type: f.type,
              seatClass: f.seatClass,
              fromStopOrder: f.fromStopOrder,
              toStopOrder: f.toStopOrder,
              priceXOF: f.priceXOF,
              validFrom: f.validFrom ? new Date(f.validFrom) : null,
              validUntil: f.validUntil ? new Date(f.validUntil) : null,
              isActive: true,
            },
          });
        }

        return schedule;
      });

      let tripsCreated = 0;
      let warning: string | undefined;
      try {
        const trips = await generateTripsForSchedule(
          newSchedule.id,
          preferredBusId,
          14,
        );
        tripsCreated = trips.length;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          "Trip pre-generation failed on schedule create:",
          newSchedule.id,
          message,
        );
        // M12: keep the schedule even if initial trip generation fails. A
        // schedule with no departures in the next 14 days legitimately yields
        // zero trips (future start), and a transient bus issue should not scrap
        // the whole schedule. Surface a warning so the operator can generate
        // trips later via "Extend Trips" instead of leaving a broken, silent
        // state.
        warning = `Schedule created, but initial trip generation failed: ${message}. Use "Extend Trips" to generate them.`;
      }

      const result = await ctx.prisma.schedule.findUnique({
        where: { id: newSchedule.id },
        include: {
          calendar: true,
          fares: true,
          preferredBus: {
            select: { id: true, registrationPlate: true, internalName: true },
          },
          _count: { select: { trips: true } },
        },
      });

      return { ...result, tripsCreated, warning };
    }),

  retire: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      await ctx.prisma.schedule.update({
        where: { id: schedule.id },
        data: { isActive: false },
      });

      const pruned = await pruneUnbookedFutureTrips(
        ctx.prisma,
        schedule.id,
        ctx.companyId,
      );

      return { success: true, prunedTrips: pruned };
    }),

  delete: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:delete");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      const bookingsCount = await ctx.prisma.booking.count({
        where: {
          trip: { scheduleId: schedule.id },
        },
      });

      if (bookingsCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot delete schedule while any bookings exist on its trips. Retire (deactivate) the schedule instead.",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.trip.deleteMany({
          where: { scheduleId: schedule.id },
        });
        await tx.schedule.delete({
          where: { id: schedule.id },
        });
      });

      return { success: true };
    }),

  updateBasic: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: updateScheduleBasicSchema }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      if (input.data.preferredBusId) {
        const bus = await ctx.prisma.bus.findFirst({
          where: {
            id: input.data.preferredBusId,
            companyId: ctx.companyId,
            status: "ACTIVE",
            deletedAt: null,
          },
        });
        if (!bus) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selected bus is invalid or is not active",
          });
        }
      }

      const updateData = Object.fromEntries(
        Object.entries(input.data).filter(([, v]) => v !== undefined),
      );

      const updated = await ctx.prisma.schedule.update({
        where: { id: input.id },
        data: updateData,
      });

      if (input.data.isActive === false) {
        await pruneUnbookedFutureTrips(
          ctx.prisma,
          schedule.id,
          ctx.companyId,
        );
      } else if (
        (input.data.departureTime !== undefined ||
          input.data.preferredBusId !== undefined) &&
        updated.isActive &&
        (updated.preferredBusId || input.data.preferredBusId)
      ) {
        const busId =
          input.data.preferredBusId ?? updated.preferredBusId;
        if (busId) {
          await reconcileScheduleTrips(
            ctx.prisma,
            schedule.id,
            ctx.companyId,
            busId,
            ctx.user.id
          );
        }
      }

      return updated;
    }),

  updateCalendar: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: updateCalendarSchema }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { calendar: true },
      });

      if (!schedule || !schedule.calendar) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule or calendar not found",
        });
      }

      const data = input.data;
      const updateData: Record<string, unknown> = {};
      if (data["monday"] !== undefined) updateData["monday"] = data["monday"];
      if (data["tuesday"] !== undefined) updateData["tuesday"] = data["tuesday"];
      if (data["wednesday"] !== undefined)
        updateData["wednesday"] = data["wednesday"];
      if (data["thursday"] !== undefined)
        updateData["thursday"] = data["thursday"];
      if (data["friday"] !== undefined) updateData["friday"] = data["friday"];
      if (data["saturday"] !== undefined)
        updateData["saturday"] = data["saturday"];
      if (data["sunday"] !== undefined) updateData["sunday"] = data["sunday"];
      if (data["validFrom"] !== undefined)
        updateData["validFrom"] = new Date(data["validFrom"]);
      if (data["validUntil"] !== undefined)
        updateData["validUntil"] = data["validUntil"]
          ? new Date(data["validUntil"])
          : null;

      const updated = await ctx.prisma.serviceCalendar.update({
        where: { id: schedule.calendar.id },
        data: updateData,
      });

      if (schedule.preferredBusId && schedule.isActive) {
        await reconcileScheduleTrips(
          ctx.prisma,
          schedule.id,
          ctx.companyId,
          schedule.preferredBusId,
          ctx.user.id
        );
      }

      return updated;
    }),

  reconcileFutureTrips: operatorCompanyProcedure
    .input(
      z.object({
        id: z.string(),
        busId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { calendar: true },
      });

      if (!schedule || !schedule.calendar) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule or calendar not found",
        });
      }

      if (!schedule.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reactivate the schedule before reconciling trips",
        });
      }

      const busId = input.busId ?? schedule.preferredBusId;
      if (!busId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No preferred bus set for this schedule",
        });
      }

      const result = await reconcileScheduleTrips(
        ctx.prisma,
        schedule.id,
        ctx.companyId,
        busId,
        ctx.user.id
      );

      return { success: true, ...result };
    }),

  updateFare: operatorCompanyProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        fareId: z.string(),
        data: updateFareSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.scheduleId, companyId: ctx.companyId },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      const fare = await ctx.prisma.fare.findFirst({
        where: { id: input.fareId, scheduleId: schedule.id },
      });

      if (!fare) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fare not found" });
      }

      if (fare.fromStopOrder >= fare.toStopOrder) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `fromStopOrder (${fare.fromStopOrder}) must be less than toStopOrder (${fare.toStopOrder}).`,
        });
      }

      const updateData = Object.fromEntries(
        Object.entries(input.data).filter(([, v]) => v !== undefined),
      );

      return ctx.prisma.fare.update({
        where: { id: input.fareId },
        data: updateData,
      });
    }),

  addFare: operatorCompanyProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        data: addFareSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.scheduleId, companyId: ctx.companyId },
      });
      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }
      const f = input.data;
      if (f.fromStopOrder >= f.toStopOrder) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "fromStopOrder must be less than toStopOrder",
        });
      }

      const newValidFrom = f.validFrom ? new Date(f.validFrom) : null;
      const newValidUntil = f.validUntil ? new Date(f.validUntil) : null;

      // Overlap check
      const existingFares = await ctx.prisma.fare.findMany({
        where: {
          scheduleId: schedule.id,
          isActive: true,
          type: f.type,
          seatClass: f.seatClass,
          fromStopOrder: f.fromStopOrder,
          toStopOrder: f.toStopOrder,
        }
      });

      for (const ef of existingFares) {
        if (!newValidFrom && !newValidUntil && !ef.validFrom && !ef.validUntil) {
           throw new TRPCError({ code: "BAD_REQUEST", message: "An always-valid fare already exists for this segment."});
        }
        
        // Date overlap logic
        const efFrom = ef.validFrom?.getTime() ?? 0;
        const efUntil = ef.validUntil?.getTime() ?? Infinity;
        const newFrom = newValidFrom?.getTime() ?? 0;
        const newUntil = newValidUntil?.getTime() ?? Infinity;

        if (newFrom <= efUntil && newUntil >= efFrom) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Fare dates overlap with an existing fare (valid from ${ef.validFrom?.toISOString().split('T')[0] ?? 'forever'} to ${ef.validUntil?.toISOString().split('T')[0] ?? 'forever'}).`,
          });
        }
      }

      return await ctx.prisma.fare.create({
        data: {
          scheduleId: schedule.id,
          type: f.type,
          seatClass: f.seatClass,
          fromStopOrder: f.fromStopOrder,
          toStopOrder: f.toStopOrder,
          priceXOF: f.priceXOF,
          validFrom: newValidFrom,
          validUntil: newValidUntil,
          isActive: true,
        },
      });
    }),

  deactivateFare: operatorCompanyProcedure
    .input(z.object({ scheduleId: z.string(), fareId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.scheduleId, companyId: ctx.companyId },
      });
      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }
      const fare = await ctx.prisma.fare.findFirst({
        where: { id: input.fareId, scheduleId: schedule.id },
      });
      if (!fare) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fare not found" });
      }

      const route = await ctx.prisma.route.findFirst({
        where: { id: schedule.routeId },
        include: { waypoints: { orderBy: { stopOrder: "asc" } } },
      });
      const lastStopOrder =
        route && route.waypoints.length > 0
          ? route.waypoints[route.waypoints.length - 1]!.stopOrder + 1
          : 1;
      const isFullRoute =
        fare.fromStopOrder === 0 && fare.toStopOrder === lastStopOrder;

      if (isFullRoute && fare.isActive) {
        const otherFullActive = await ctx.prisma.fare.count({
          where: {
            scheduleId: schedule.id,
            isActive: true,
            id: { not: fare.id },
            fromStopOrder: 0,
            toStopOrder: lastStopOrder,
          },
        });
        if (otherFullActive === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot deactivate the last active full-route fare. Add another full-route fare first.",
          });
        }
      }

      return ctx.prisma.fare.update({
        where: { id: fare.id },
        data: { isActive: false },
      });
    }),

  regenerateTrips: operatorCompanyProcedure
    .input(
      z.object({
        id: z.string(),
        defaultBusId: z.string().optional(),
        preferredBusId: z.string().optional(),
        persist: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      if (!schedule.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reactivate the schedule before extending trips",
        });
      }

      const busId =
        input.preferredBusId ||
        input.defaultBusId ||
        schedule.preferredBusId;
      if (!busId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No preferred bus set for this schedule",
        });
      }

      const bus = await ctx.prisma.bus.findFirst({
        where: {
          id: busId,
          companyId: ctx.companyId,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!bus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected bus is invalid or does not belong to your company.",
        });
      }

      if (!schedule.preferredBusId || input.persist) {
        await ctx.prisma.schedule.update({
          where: { id: schedule.id },
          data: { preferredBusId: busId },
        });
      }

      try {
        const newTrips = await generateTripsForSchedule(
          schedule.id,
          busId,
          14,
        );
        return {
          success: true,
          tripsCreated: newTrips.length,
          message: `Successfully generated ${newTrips.length} upcoming trips`,
        };
      } catch (err: unknown) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error ? err.message : "Failed to generate trips",
        });
      }
    }),

  addException: operatorCompanyProcedure
    .input(
      exceptionSchema.extend({
        scheduleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.scheduleId, companyId: ctx.companyId },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      const exceptionDate = buildAppDepartureTimestamp(
        new Date(`${input.date}T00:00:00.000Z`),
        0,
        0,
      );

      const existing = await ctx.prisma.serviceException.findFirst({
        where: {
          scheduleId: input.scheduleId,
          date: exceptionDate,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An exception already exists for this date.",
        });
      }

      const exception = await ctx.prisma.serviceException.create({
        data: {
          scheduleId: input.scheduleId,
          date: exceptionDate,
          type: input.type,
          reason: input.reason,
          notes: input.notes ?? null,
          overrideDepartureTime:
            input.type === "MODIFIED"
              ? (input.overrideDepartureTime ?? null)
              : null,
        },
      });

      if (input.type === "CANCELLED") {
        const dayEnd = addAppCalendarDays(exceptionDate, 1);
        const dayTrips = await ctx.prisma.trip.findMany({
          where: {
            scheduleId: input.scheduleId,
            departureDate: {
              gte: exceptionDate,
              lt: dayEnd,
            },
          },
          select: {
            id: true,
            status: true,
            _count: {
              select: {
                bookings: {
                  where: {
                    status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
                  },
                },
              },
            },
          },
        });

        const emptyIds: string[] = [];
        for (const trip of dayTrips) {
          if (trip._count.bookings > 0) {
            await cancelTripWithRefunds({
              prisma: ctx.prisma,
              tripId: trip.id,
              cancelReason: `Service exception: ${input.reason}`,
              actor: {
                userId: ctx.user.id,
                companyId: ctx.companyId,
                role: "OPERATOR",
              },
            });
          } else if (trip.status === "SCHEDULED") {
            emptyIds.push(trip.id);
          }
        }
        if (emptyIds.length > 0) {
          await ctx.prisma.trip.deleteMany({
            where: { id: { in: emptyIds } },
          });
        }
      }

      if (input.type === "EXTRA_SERVICE" || input.type === "MODIFIED") {
        if (schedule.isActive && schedule.preferredBusId) {
          try {
            await reconcileScheduleTrips(
              ctx.prisma,
              schedule.id,
              ctx.companyId,
              schedule.preferredBusId,
              ctx.user.id
            );
          } catch (err) {
            console.error("Failed to reconcile trips after exception:", err);
          }
        }
      }

      return exception;
    }),

  removeException: operatorCompanyProcedure
    .input(z.object({ exceptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx, "schedules:update");
      const exception = await ctx.prisma.serviceException.findFirst({
        where: { id: input.exceptionId },
        include: { schedule: true },
      });

      if (!exception || exception.schedule.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exception not found",
        });
      }

      await ctx.prisma.serviceException.delete({
        where: { id: exception.id },
      });

      if (
        exception.schedule.isActive &&
        exception.schedule.preferredBusId
      ) {
        try {
          await reconcileScheduleTrips(
            ctx.prisma,
            exception.scheduleId,
            ctx.companyId,
            exception.schedule.preferredBusId,
            ctx.user.id
          );
        } catch (err) {
          console.error(
            "Failed to reconcile trips after removing exception:",
            err,
          );
        }
      }

      return { success: true };
    }),
});
