import { type Router as ExpressRouter, Router } from "express";
import { getPrismaClient } from "@moja/db";
import {
  assignBusDriverSchema,
  delayTripSchema,
  cancelTripSchema,
  tripStatusEnum,
} from "@moja/schemas";
import { AppError } from "../lib/errors.js";
import {
  requireOperatorSession,
  requireOperatorCompany,
} from "../middleware/operator-auth.js";

const prisma = getPrismaClient();

export function createTripsRouter(): ExpressRouter {
  const router = Router();

  // Get rolling trip departures for operator
  router.get(
    "/trips",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const { status, routeId, startDate, endDate } = req.query;

        const filters: any = {
          companyId: req.companyId,
        };

        if (status) {
          filters.status = status;
        }
        if (routeId) {
          filters.schedule = { routeId };
        }

        if (startDate || endDate) {
          filters.departureDate = {};
          if (startDate) {
            filters.departureDate.gte = new Date(startDate as string);
          }
          if (endDate) {
            filters.departureDate.lte = new Date(endDate as string);
          }
        }

        const trips = await prisma.trip.findMany({
          where: filters,
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
                  },
                },
              },
            },
          },
          orderBy: { departureDate: "asc" },
        });

        res.json(trips);
      } catch (error) {
        next(error);
      }
    },
  );

  // Get details of a single trip, including its seat map status
  router.get(
    "/trips/:id",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const trip = await prisma.trip.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
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
            bookings: true,
          },
        });

        if (!trip) {
          return next(new AppError(404, "Trip not found"));
        }

        res.json(trip);
      } catch (error) {
        next(error);
      }
    },
  );

  // Swap Bus or assign Driver on a specific Trip
  router.patch(
    "/trips/:id/assign",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = assignBusDriverSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const { busId } = bodyValidation.data;

        const trip = await prisma.trip.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
          include: {
            seats: true,
          },
        });

        if (!trip) {
          return next(new AppError(404, "Trip not found"));
        }

        // Verify selected bus is active and belongs to operator
        const newBus = await prisma.bus.findUnique({
          where: { id: busId, companyId: req.companyId, status: "ACTIVE" },
          include: { seats: { where: { isActive: true } } },
        });

        if (!newBus) {
          return next(new AppError(400, "Selected bus is invalid or inactive"));
        }

        // Operational Rule: If the bus changes and there are active bookings
        if (trip.busId !== busId && trip.bookedSeats > 0) {
          // Simple compatibility check: does the new bus contain all the seat labels that are currently booked?
          const bookedSeatIds = trip.seats
            .filter((ts) => ts.status === "BOOKED")
            .map((ts) => ts.seatId);
          const bookedSeats = await prisma.seat.findMany({
            where: { id: { in: bookedSeatIds } },
          });
          const bookedLabels = bookedSeats.map((s) => s.label);

          const newSeatLabels = new Set(newBus.seats.map((s) => s.label));
          const allLabelsCompatible = bookedLabels.every((label) =>
            newSeatLabels.has(label),
          );

          if (!allLabelsCompatible) {
            return next(
              new AppError(
                400,
                "Cannot swap bus: The new bus seat layout is incompatible with the seats already booked on this trip.",
              ),
            );
          }
        }

        const updatedTrip = await prisma.$transaction(async (tx) => {
          // Swap bus on Trip
          const updated = await tx.trip.update({
            where: { id: trip.id },
            data: {
              busId,
              totalSeats: newBus.seats.length,
            },
          });

          // If the bus changed, we need to rebuild the TripSeat mappings
          if (trip.busId !== busId) {
            // Keep existing bookings (if labels match, move them to the new seat IDs)
            const oldTripSeats = await tx.tripSeat.findMany({
              where: { tripId: trip.id },
              include: { seat: true },
            });

            // Delete old mappings
            await tx.tripSeat.deleteMany({
              where: { tripId: trip.id },
            });

            // Build new mappings
            const newTripSeats = newBus.seats.map((seat) => {
              // Check if there was a booking with this seat label on the old bus
              const oldMatchingBooking = oldTripSeats.find(
                (ots) =>
                  ots.status === "BOOKED" && ots.seat.label === seat.label,
              );

              return {
                tripId: trip.id,
                seatId: seat.id,
                status: oldMatchingBooking
                  ? ("BOOKED" as any)
                  : ("AVAILABLE" as any),
                bookingId: oldMatchingBooking?.bookingId ?? null,
              };
            });

            await tx.tripSeat.createMany({
              data: newTripSeats,
            });
          }

          return updated;
        });

        res.json(updatedTrip);
      } catch (error) {
        next(error);
      }
    },
  );

  // Log departure/delay minutes
  router.patch(
    "/trips/:id/delay",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = delayTripSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const { delayMinutes, notes } = bodyValidation.data;

        const trip = await prisma.trip.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!trip) {
          return next(new AppError(404, "Trip not found"));
        }

        const updatedTrip = await prisma.trip.update({
          where: { id: trip.id },
          data: {
            delayMinutes,
            status: "DELAYED",
            notes: notes ?? trip.notes,
            estimatedArrival: trip.estimatedArrival
              ? new Date(trip.estimatedArrival.getTime() + delayMinutes * 60000)
              : null,
          },
        });

        // Update all scheduled stop times downstream by adding the delay
        const stops = await prisma.tripStop.findMany({
          where: { tripId: trip.id },
        });
        for (const stop of stops) {
          await prisma.tripStop.update({
            where: { id: stop.id },
            data: {
              scheduledArrival: stop.scheduledArrival
                ? new Date(
                    stop.scheduledArrival.getTime() + delayMinutes * 60000,
                  )
                : null,
              scheduledDeparture: stop.scheduledDeparture
                ? new Date(
                    stop.scheduledDeparture.getTime() + delayMinutes * 60000,
                  )
                : null,
            },
          });
        }

        res.json(updatedTrip);
      } catch (error) {
        next(error);
      }
    },
  );

  // Cancel an individual Trip run
  router.patch(
    "/trips/:id/cancel",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const bodyValidation = cancelTripSchema.safeParse(req.body);
        if (!bodyValidation.success) {
          return next(
            new AppError(
              400,
              "Validation failed",
              bodyValidation.error.flatten(),
            ),
          );
        }

        const trip = await prisma.trip.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!trip) {
          return next(new AppError(404, "Trip not found"));
        }

        const updatedTrip = await prisma.trip.update({
          where: { id: trip.id },
          data: {
            status: "CANCELLED",
            cancelReason: bodyValidation.data.cancelReason,
          },
        });

        res.json(updatedTrip);
      } catch (error) {
        next(error);
      }
    },
  );

  // Log dispatch status updates (BOARDING, DEPARTED, ARRIVED)
  router.patch(
    "/trips/:id/status",
    requireOperatorSession,
    requireOperatorCompany,
    async (req: any, res, next) => {
      try {
        const { status } = req.body;
        const statusValidation = tripStatusEnum.safeParse(status);
        if (!statusValidation.success) {
          return next(new AppError(400, "Invalid status parameter"));
        }

        const trip = await prisma.trip.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId,
          },
        });

        if (!trip) {
          return next(new AppError(404, "Trip not found"));
        }

        const updateData: any = { status };

        if (status === "DEPARTED") {
          updateData.actualDeparture = new Date();
        } else if (status === "ARRIVED") {
          updateData.actualArrival = new Date();
        }

        const updatedTrip = await prisma.trip.update({
          where: { id: trip.id },
          data: updateData,
        });

        res.json(updatedTrip);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
