import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import {
  createScheduleSchema,
  updateScheduleBasicSchema,
  updateCalendarSchema,
  updateFareSchema,
} from "@moja/schemas";
import { generateTripsForSchedule } from "@/lib/trip-generator";
import { buildAppDepartureTimestamp, addAppCalendarDays } from "@/lib/timezone";

export const schedulesRouter = createTRPCRouter({
  list: operatorCompanyProcedure.query(async ({ ctx }) => {
    const schedules = await ctx.prisma.schedule.findMany({
      where: { companyId: ctx.companyId },
      include: {
        route: {
          include: {
            originTerminal: { include: { cityRelation: true } },
            destTerminal: { include: { cityRelation: true } },
          },
        },
        calendar: true,
        fares: {
          orderBy: [{ seatClass: "asc" }, { fromStopOrder: "asc" }],
        },
        _count: {
          select: {
            trips: true,
            fares: true,
          },
        },
      },
      orderBy: { departureTime: "asc" },
    });
    return schedules;
  }),

  get: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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
              waypoints: { orderBy: { stopOrder: "asc" } },
            },
          },
          calendar: true,
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
      const { name, routeId, defaultBusId, departureTime, calendar, fares } =
        input;

      const route = await ctx.prisma.route.findFirst({
        where: { id: routeId, companyId: ctx.companyId },
      });
      if (!route) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid route selected",
        });
      }

      const bus = await ctx.prisma.bus.findFirst({
        where: {
          id: defaultBusId,
          companyId: ctx.companyId,
          status: "ACTIVE",
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

        const faresData = fares.map((f) => {
          if (f.fromStopOrder >= f.toStopOrder) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Fare segment invalid: fromStopOrder (${f.fromStopOrder}) must be less than toStopOrder (${f.toStopOrder}).`,
            });
          }
          return {
            scheduleId: schedule.id,
            type: f.type as any,
            seatClass: f.seatClass as any,
            fromStopOrder: f.fromStopOrder,
            toStopOrder: f.toStopOrder,
            priceXOF: f.priceXOF,
            validFrom: f.validFrom ? new Date(f.validFrom) : null,
            validUntil: f.validUntil ? new Date(f.validUntil) : null,
            isActive: true,
          };
        });

        await tx.fare.createMany({
          data: faresData,
        });

        return schedule;
      });

      try {
        await generateTripsForSchedule(newSchedule.id, defaultBusId, 14);
      } catch (err: any) {
        console.error(
          "Trip pre-generation failed on schedule create:",
          err.message,
        );
      }

      return ctx.prisma.schedule.findUnique({
        where: { id: newSchedule.id },
        include: {
          calendar: true,
          fares: true,
          _count: { select: { trips: true } },
        },
      });
    }),

  delete: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

      await ctx.prisma.$transaction(async (tx) => {
        const bookingsCount = await tx.booking.count({
          where: {
            trip: {
              scheduleId: schedule.id,
            },
          },
        });

        if (bookingsCount > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot delete schedule. Active passenger bookings exist on its trips.",
          });
        }

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
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      const updateData = Object.fromEntries(
        Object.entries(input.data).filter(([, v]) => v !== undefined),
      );

      return ctx.prisma.schedule.update({
        where: { id: input.id },
        data: updateData,
      });
    }),

  updateCalendar: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: updateCalendarSchema }))
    .mutation(async ({ ctx, input }) => {
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
      const updateData: any = {};
      if (data.monday !== undefined) updateData.monday = data.monday;
      if (data.tuesday !== undefined) updateData.tuesday = data.tuesday;
      if (data.wednesday !== undefined) updateData.wednesday = data.wednesday;
      if (data.thursday !== undefined) updateData.thursday = data.thursday;
      if (data.friday !== undefined) updateData.friday = data.friday;
      if (data.saturday !== undefined) updateData.saturday = data.saturday;
      if (data.sunday !== undefined) updateData.sunday = data.sunday;
      if (data.validFrom !== undefined)
        updateData.validFrom = new Date(data.validFrom);
      if (data.validUntil !== undefined)
        updateData.validUntil = data.validUntil
          ? new Date(data.validUntil)
          : null;

      return ctx.prisma.serviceCalendar.update({
        where: { id: schedule.calendar.id },
        data: updateData,
      });
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

      // W1-D: Validate fare segment order
      const fromOrder = input.data.fromStopOrder ?? fare.fromStopOrder;
      const toOrder = input.data.toStopOrder ?? fare.toStopOrder;
      if (fromOrder >= toOrder) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `fromStopOrder (${fromOrder}) must be less than toStopOrder (${toOrder}).`,
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

  regenerateTrips: operatorCompanyProcedure
    .input(z.object({ id: z.string(), defaultBusId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      const bus = await ctx.prisma.bus.findFirst({
        where: {
          id: input.defaultBusId,
          companyId: ctx.companyId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (!bus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected bus is invalid or does not belong to your company.",
        });
      }

      try {
        const newTrips = await generateTripsForSchedule(
          schedule.id,
          input.defaultBusId,
          14,
        );
        return {
          success: true,
          tripsCreated: newTrips.length,
          message: `Successfully generated ${newTrips.length} upcoming trips`,
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to generate trips",
        });
      }
    }),

  addException: operatorCompanyProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        type: z.enum(["CANCELLED", "EXTRA_SERVICE", "MODIFIED"]),
        reason: z.enum([
          "HOLIDAY_ISLAMIC",
          "HOLIDAY_CHRISTIAN",
          "HOLIDAY_NATIONAL",
          "STRIKE",
          "WEATHER",
          "MAINTENANCE",
          "OPERATIONAL",
          "OTHER",
        ]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
        },
      });

      if (input.type === "CANCELLED") {
        const dayEnd = addAppCalendarDays(exceptionDate, 1);
        await ctx.prisma.trip.deleteMany({
          where: {
            scheduleId: input.scheduleId,
            departureDate: {
              gte: exceptionDate,
              lt: dayEnd,
            },
          },
        });
      }

      return exception;
    }),

  removeException: operatorCompanyProcedure
    .input(z.object({ exceptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

      return { success: true };
    }),
});
