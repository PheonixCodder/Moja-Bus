import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import {
  assignBusDriverSchema,
  delayTripSchema,
  cancelTripSchema,
  tripStatusEnum,
} from "@moja/schemas";

export const tripsRouter = createTRPCRouter({
  list: operatorCompanyProcedure
    .input(
      z
        .object({
          status: tripStatusEnum.optional(),
          routeId: z.string().uuid().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const filters: any = {
        companyId: ctx.companyId,
      };

      if (input?.status) {
        filters.status = input.status;
      }
      if (input?.routeId) {
        filters.schedule = { routeId: input.routeId };
      }

      if (input?.startDate || input?.endDate) {
        filters.departureDate = {};
        if (input?.startDate) {
          filters.departureDate.gte = new Date(input.startDate);
        }
        if (input?.endDate) {
          filters.departureDate.lte = new Date(input.endDate);
        }
      }

      return ctx.prisma.trip.findMany({
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
          seats: {
            include: { seat: true },
          },
        },
        orderBy: { departureDate: "asc" },
      });
    }),

  get: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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
          bookings: true,
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      return trip;
    }),

  assignBusDriver: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid(), data: assignBusDriverSchema }))
    .mutation(async ({ ctx, input }) => {
      const { busId } = input.data;

      const trip = await ctx.prisma.trip.findFirst({
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

      const newBus = await ctx.prisma.bus.findUnique({
        where: { id: busId, companyId: ctx.companyId, status: "ACTIVE" },
        include: { seats: { where: { isActive: true } } },
      });

      if (!newBus) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected bus is invalid or inactive",
        });
      }

      if (trip.busId !== busId && trip.bookedSeats > 0) {
        const bookedSeatIds = trip.seats
          .filter((ts) => ts.status === "BOOKED")
          .map((ts) => ts.seatId);

        const bookedSeats = await ctx.prisma.seat.findMany({
          where: { id: { in: bookedSeatIds } },
        });
        const bookedLabels = bookedSeats.map((s) => s.label);

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

      return ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.trip.update({
          where: { id: trip.id },
          data: {
            busId,
            totalSeats: newBus.seats.length,
          },
        });

        if (trip.busId !== busId) {
          const oldTripSeats = await tx.tripSeat.findMany({
            where: { tripId: trip.id },
            include: { seat: true },
          });

          await tx.tripSeat.deleteMany({
            where: { tripId: trip.id },
          });

          const newTripSeats = newBus.seats.map((seat) => {
            const oldMatchingBooking = oldTripSeats.find(
              (ots) => ots.status === "BOOKED" && ots.seat.label === seat.label,
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
    }),

  delay: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid(), data: delayTripSchema }))
    .mutation(async ({ ctx, input }) => {
      const { delayMinutes, notes } = input.data;

      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      const updatedTrip = await ctx.prisma.trip.update({
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

      const stops = await ctx.prisma.tripStop.findMany({
        where: { tripId: trip.id },
      });

      for (const stop of stops) {
        await ctx.prisma.tripStop.update({
          where: { id: stop.id },
          data: {
            scheduledArrival: stop.scheduledArrival
              ? new Date(stop.scheduledArrival.getTime() + delayMinutes * 60000)
              : null,
            scheduledDeparture: stop.scheduledDeparture
              ? new Date(
                  stop.scheduledDeparture.getTime() + delayMinutes * 60000,
                )
              : null,
          },
        });
      }

      return updatedTrip;
    }),

  cancel: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid(), data: cancelTripSchema }))
    .mutation(async ({ ctx, input }) => {
      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      return ctx.prisma.trip.update({
        where: { id: trip.id },
        data: {
          status: "CANCELLED",
          cancelReason: input.data.cancelReason,
        },
      });
    }),

  updateStatus: operatorCompanyProcedure
    .input(z.object({ id: z.string().uuid(), status: tripStatusEnum }))
    .mutation(async ({ ctx, input }) => {
      const { status } = input;

      const trip = await ctx.prisma.trip.findFirst({
        where: {
          id: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      const updateData: any = { status };

      if (status === "DEPARTED") {
        updateData.actualDeparture = new Date();
      } else if (status === "ARRIVED") {
        updateData.actualArrival = new Date();
      }

      return ctx.prisma.trip.update({
        where: { id: trip.id },
        data: updateData,
      });
    }),
});
