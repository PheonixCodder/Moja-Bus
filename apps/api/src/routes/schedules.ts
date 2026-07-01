import { type Router as ExpressRouter, Router } from "express";
import { getPrismaClient } from "@moja/db";
import {
  createScheduleSchema,
  updateScheduleSchema,
  exceptionSchema,
  updateScheduleBasicSchema,
  updateCalendarSchema,
  updateFareSchema,
} from "@moja/schemas";
import { AppError } from "../lib/errors.js";
import {
  requireOperatorSession,
  requireOperatorCompany,
} from "../middleware/operator-auth.js";
import { generateTripsForSchedule } from "../lib/trip-generator.js";

const prisma = getPrismaClient();

export function createSchedulesRouter(): ExpressRouter {
  const router = Router();

  // Get operator's schedules list
  router.get(
    "/schedules",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const schedules = await prisma.schedule.findMany({
          where: { companyId: req.companyId },
          include: {
            route: {
              include: {
                originTerminal: { include: { cityRelation: true } },
                destTerminal: { include: { cityRelation: true } },
              },
            },
            calendar: true,
            _count: {
              select: {
                trips: true,
                fares: true,
              },
            },
          },
          orderBy: { departureTime: "asc" },
        });
        res.json(schedules);
      } catch (error) {
        next(error);
      }
    },
  );

  // Get single schedule details including exceptions and fares
  router.get(
    "/schedules/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const schedule = await prisma.schedule.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
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
          return next(new AppError(404, "Schedule not found"));
        }

        res.json(schedule);
      } catch (error) {
        next(error);
      }
    },
  );

  // Create a new schedule + calendar + fares, then trigger trip generation
  router.post(
    "/schedules",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = createScheduleSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const { name, routeId, defaultBusId, departureTime, calendar, fares } =
          bodyValidation.data;

        // Verify route belongs to company
        const route = await prisma.route.findFirst({
          where: { id: routeId, companyId: req.companyId },
        });
        if (!route) {
          return next(new AppError(400, "Invalid route selected"));
        }

        // Verify default bus belongs to company
        const bus = await prisma.bus.findFirst({
          where: {
            id: defaultBusId,
            companyId: req.companyId,
            status: "ACTIVE",
          },
        });
        if (!bus) {
          return next(
            new AppError(400, "Selected bus is invalid or is not active"),
          );
        }

        const newSchedule = await prisma.$transaction(async (tx) => {
          const schedule = await tx.schedule.create({
            data: {
              companyId: req.companyId,
              routeId,
              name: name ?? null,
              departureTime,
              isActive: true,
            },
          });

          // Create ServiceCalendar
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

          // Create Fares
          const faresData = fares.map((f: any) => ({
            scheduleId: schedule.id,
            type: f.type as any,
            seatClass: f.seatClass as any,
            fromStopOrder: f.fromStopOrder,
            toStopOrder: f.toStopOrder,
            priceXOF: f.priceXOF,
            validFrom: f.validFrom ? new Date(f.validFrom) : null,
            validUntil: f.validUntil ? new Date(f.validUntil) : null,
            isActive: true,
          }));

          await tx.fare.createMany({
            data: faresData,
          });

          return schedule;
        });

        // Generate 14-day rolling trips immediately for this schedule
        try {
          await generateTripsForSchedule(newSchedule.id, defaultBusId, 14);
        } catch (err: any) {
          console.error(
            "Trip pre-generation failed on schedule create:",
            err.message,
          );
        }

        const scheduleDetails = await prisma.schedule.findUnique({
          where: { id: newSchedule.id },
          include: {
            calendar: true,
            fares: true,
          },
        });

        res.status(201).json(scheduleDetails);
      } catch (error) {
        next(error);
      }
    },
  );

  // Delete a schedule (only if associated trips have no passenger bookings)
  router.delete(
    "/schedules/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const schedule = await prisma.schedule.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!schedule) {
          return next(new AppError(404, "Schedule not found"));
        }

        // Verify if there are bookings on any trips generated by this schedule
        const bookingsCount = await prisma.booking.count({
          where: {
            trip: {
              scheduleId: schedule.id,
            },
          },
        });

        if (bookingsCount > 0) {
          return next(
            new AppError(
              400,
              "Cannot delete schedule. Active passenger bookings exist on its trips.",
            ),
          );
        }

        // Delete trips generated by this schedule (Cascade handles TripStops/TripSeats)
        await prisma.$transaction([
          prisma.trip.deleteMany({
            where: { scheduleId: schedule.id },
          }),
          prisma.schedule.delete({
            where: { id: schedule.id },
          }),
        ]);

        res.json({
          success: true,
          message: "Schedule and associated trips deleted successfully",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Create calendar exception (e.g. Cancel operations for Christmas day, or add extra service run)
  router.post(
    "/schedules/:id/exceptions",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = exceptionSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const schedule = await prisma.schedule.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!schedule) {
          return next(new AppError(404, "Schedule not found"));
        }

        const { date, type, reason, notes } = bodyValidation.data;
        const exceptionDate = new Date(date);

        const newException = await prisma.serviceException.create({
          data: {
            scheduleId: schedule.id,
            date: exceptionDate,
            type: type as any,
            reason: reason as any,
            notes: notes ?? null,
          },
        });

        // If Exception is CANCELLED: find and cancel the corresponding trip if it was pre-generated
        if (type === "CANCELLED") {
          const startOfDay = new Date(exceptionDate);
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(exceptionDate);
          endOfDay.setHours(23, 59, 59, 999);

          await prisma.trip.updateMany({
            where: {
              scheduleId: schedule.id,
              departureDate: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            data: {
              status: "CANCELLED",
              cancelReason:
                notes ?? `Cancelled due to schedule exception (${reason})`,
            },
          });
        }

        res.status(201).json(newException);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update schedule basic details
  router.patch(
    "/schedules/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = updateScheduleBasicSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const schedule = await prisma.schedule.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!schedule) {
          return next(new AppError(404, "Schedule not found"));
        }

        const { name, departureTime, isActive } = bodyValidation.data;

        const updatedSchedule = await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(departureTime !== undefined ? { departureTime } : {}),
            ...(isActive !== undefined ? { isActive } : {}),
          },
        });

        res.json(updatedSchedule);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update schedule calendar
  router.patch(
    "/schedules/:id/calendar",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = updateCalendarSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const schedule = await prisma.schedule.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!schedule) {
          return next(new AppError(404, "Schedule not found"));
        }

        const data = bodyValidation.data;

        const updatedCalendar = await prisma.serviceCalendar.update({
          where: { scheduleId: schedule.id },
          data: {
            ...(data.monday !== undefined ? { monday: data.monday } : {}),
            ...(data.tuesday !== undefined ? { tuesday: data.tuesday } : {}),
            ...(data.wednesday !== undefined
              ? { wednesday: data.wednesday }
              : {}),
            ...(data.thursday !== undefined ? { thursday: data.thursday } : {}),
            ...(data.friday !== undefined ? { friday: data.friday } : {}),
            ...(data.saturday !== undefined ? { saturday: data.saturday } : {}),
            ...(data.sunday !== undefined ? { sunday: data.sunday } : {}),
            ...(data.validFrom ? { validFrom: new Date(data.validFrom) } : {}),
            ...(data.validUntil !== undefined
              ? {
                  validUntil: data.validUntil
                    ? new Date(data.validUntil)
                    : null,
                }
              : {}),
          },
        });

        res.json(updatedCalendar);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update a single fare
  router.patch(
    "/schedules/:id/fares/:fareId",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = updateFareSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const schedule = await prisma.schedule.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!schedule) {
          return next(new AppError(404, "Schedule not found"));
        }

        const data = bodyValidation.data;

        const updatedFare = await prisma.fare.update({
          where: {
            id: req.params.fareId,
            scheduleId: schedule.id,
          },
          data: {
            ...(data.priceXOF !== undefined ? { priceXOF: data.priceXOF } : {}),
            ...(data.type !== undefined ? { type: data.type as any } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          },
        });

        res.json(updatedFare);
      } catch (error) {
        next(error);
      }
    },
  );

  // Manually extend trips generation for schedule
  router.post(
    "/schedules/:id/regenerate",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const schedule = await prisma.schedule.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
          include: {
            trips: {
              where: { status: { not: "CANCELLED" } },
              orderBy: { departureDate: "desc" },
              take: 1,
            },
          },
        });

        if (!schedule) {
          return next(new AppError(404, "Schedule not found"));
        }

        let busId = schedule.trips[0]?.busId;

        if (!busId) {
          const defaultBus = await prisma.bus.findFirst({
            where: { companyId: req.companyId, status: "ACTIVE" },
          });
          if (!defaultBus) {
            return next(
              new AppError(
                400,
                "No active bus found for this company to generate trips with. Please add a bus first.",
              ),
            );
          }
          busId = defaultBus.id;
        }

        const newTrips = await generateTripsForSchedule(schedule.id, busId, 14);

        res.json({
          success: true,
          tripsCreated: newTrips.length,
          message: `Successfully generated ${newTrips.length} new trips for schedule.`,
        });
      } catch (error: any) {
        next(error);
      }
    },
  );

  return router;
}
