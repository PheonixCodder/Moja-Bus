import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, operatorCompanyProcedure } from "../init";
import {
  assignBusDriverSchema,
  delayTripSchema,
  cancelTripSchema,
  tripStatusEnum,
} from "@moja/schemas";
import { SearchFilters } from "@/features/search/services/search-service";

export const tripsRouter = createTRPCRouter({
  search: operatorCompanyProcedure
    .input(
      z.object({
        originCityId: z.string(),
        destinationCityId: z.string(),
        date: z.string(),
        passengers: z.coerce.number().int().min(1).default(1),
        operators: z.array(z.string()).optional(),
        amenities: z.array(z.string()).optional(),
        departureTime: z
          .array(z.enum(["MORNING", "AFTERNOON", "EVENING"]))
          .optional(),
        maxPrice: z.coerce.number().optional(),
        sort: z.string().default("BEST"),
        page: z.coerce.number().int().min(1).default(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { TripSearchReadRepository } = await import(
        "../../features/search/repositories/search-read-repository"
      );
      const { SearchService } = await import(
        "../../features/search/services/search-service"
      );

      const searchRepo = new TripSearchReadRepository(ctx.prisma);
      const searchService = new SearchService(searchRepo);

      return searchService.execute({
        originCityId: input.originCityId,
        destinationCityId: input.destinationCityId,
        travelDate: new Date(input.date),
        passengerCount: input.passengers,
        filters: {
          operators: input.operators as SearchFilters['operators'],
          amenities: input.amenities as SearchFilters['amenities'],
          departureTime: input.departureTime as SearchFilters['departureTime'],
          maxPrice: input.maxPrice as SearchFilters['maxPrice'],
        },
        sort: input.sort,
        page: input.page,
      });
    }),
  list: operatorCompanyProcedure
    .input(
      z
        .object({
          status: tripStatusEnum.optional(),
          routeId: z.string().optional(),
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
      });
    }),

  get: operatorCompanyProcedure
    .input(z.object({ id: z.string() }))
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
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
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

  assignBusDriver: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: assignBusDriverSchema }))
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

      const newBus = await ctx.prisma.bus.findFirst({
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
        const bookings = await ctx.prisma.booking.findMany({
          where: { tripId: trip.id, status: "CONFIRMED" },
          include: { seat: true },
        });

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

      return ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.trip.update({
          where: { id: trip.id },
          data: {
            busId,
            totalSeats: newBus.seats.length,
          },
        });

        if (trip.busId !== busId) {
          const bookings = await tx.booking.findMany({
            where: { tripId: trip.id },
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
            }
          }

          await tx.tripSeat.deleteMany({
            where: { tripId: trip.id },
          });

          const newTripSeats = newBus.seats.map((seat) => ({
            tripId: trip.id,
            seatId: seat.id,
            isActive: true,
          }));

          await tx.tripSeat.createMany({
            data: newTripSeats,
          });
        }

        return updated;
      });
    }),

  delay: operatorCompanyProcedure
    .input(z.object({ id: z.string(), data: delayTripSchema }))
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
    .input(z.object({ id: z.string(), data: cancelTripSchema }))
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
    .input(z.object({ id: z.string(), status: tripStatusEnum }))
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
