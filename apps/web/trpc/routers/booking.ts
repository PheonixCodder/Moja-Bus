import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  confirmBookingSchema,
  createHoldSchema,
  getBookingSchema,
  getSeatAvailabilitySchema,
  getTicketSchema,
  getTicketByTokenSchema,
  getTripDetailsSchema,
  initiatePaymentSchema,
  listMyBookingsSchema,
  releaseHoldSchema,
  verifyPaymentSchema,
} from "@moja/schemas";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";
import { TripDetailsService } from "@/features/booking/services/trip-details-service";
import { SeatAvailabilityService } from "@/features/booking/services/seat-availability-service";
import { BookingHoldService } from "@/features/booking/services/booking-hold-service";
import { BookingReadService } from "@/features/booking/services/booking-read-service";
import { PaymentService } from "@/features/payments/payment-service";

export const bookingRouter = createTRPCRouter({
  getTripDetails: publicProcedure
    .input(getTripDetailsSchema)
    .query(async ({ ctx, input }) => {
      const service = new TripDetailsService(ctx.prisma);
      return service.getTripDetails(input.offerId);
    }),

  getSeatAvailability: publicProcedure
    .input(getSeatAvailabilitySchema)
    .query(async ({ ctx, input }) => {
      const service = new SeatAvailabilityService(ctx.prisma);
      return service.getSeatAvailability(input.offerId);
    }),

  createHold: publicProcedure
    .input(createHoldSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new BookingHoldService(ctx.prisma);
      const result = await service.createHold({
        offerId: input.offerId,
        passengers: input.passengers,
        userId: ctx.user?.id ?? null,
      });

      // Trigger passenger-hold-created
      const firstPassenger = input.passengers[0];
      let email: string | null = null;
      let passengerName = "Passenger";
      let phone: string | null = null;

      if (ctx.user) {
        email = ctx.user.email;
        passengerName = ctx.user.name ?? "Passenger";
        phone = ctx.user.phone ?? null;
      } else if (firstPassenger?.passenger) {
        passengerName = firstPassenger.passenger.passengerName;
        phone = firstPassenger.passenger.passengerPhone ?? null;
        if (phone) {
          email = `${phone.replace(/\s+/g, "")}@guest.mojaride.ci`;
        }
      }

      if (email) {
        const novuSecret = process.env["NOVU_SECRET_KEY"];
        if (novuSecret) {
          try {
            const details = await ctx.prisma.trip.findFirst({
              where: { bookings: { some: { holdGroupId: result.holdId } } },
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
            });

            if (details) {
              const originCity = details.schedule.route.originTerminal.cityRelation?.name ?? "Unknown";
              const destCity = details.schedule.route.destTerminal.cityRelation?.name ?? "Unknown";
              const { Novu } = await import("@novu/api");
              const novu = new Novu({ secretKey: novuSecret });
              await novu.trigger({
                workflowId: "passenger-hold-created",
                to: {
                  subscriberId: email,
                  email: email,
                },
                payload: {
                  email,
                  passengerName,
                  originCity,
                  destinationCity: destCity,
                  departureTime: details.departureDate.toLocaleString("en-US", { timeZone: "UTC" }),
                  holdId: result.holdId,
                  expiresAt: result.holdExpiresAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                  totalAmountXOF: result.totalAmountXOF,
                  phone: phone ?? undefined,
                },
              }).catch(() => {});
            }
          } catch (err) {
            console.error("Failed to trigger passenger-hold-created via Novu:", err);
          }
        }
      }

      return result;
    }),

  initiatePayment: publicProcedure
    .input(initiatePaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PaymentService(ctx.prisma);
      return service.initiateForHold(
        input.holdId,
        input.payerEmail ?? ctx.user?.email ?? null,
      );
    }),

  verifyPayment: publicProcedure
    .input(verifyPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const paymentService = new PaymentService(ctx.prisma);
      return paymentService.verifyAndConfirm(
        input.reference,
        ctx.user?.id ?? null,
      );
    }),

  confirmBooking: publicProcedure
    .input(confirmBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const paymentService = new PaymentService(ctx.prisma);
      await paymentService.assertHoldPaid(input.holdId);
      const service = new BookingHoldService(ctx.prisma);
      return service.confirmBooking(input.holdId, ctx.user?.id ?? null);
    }),

  releaseHold: publicProcedure
    .input(releaseHoldSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new BookingHoldService(ctx.prisma);
      return service.releaseHold(input.holdId);
    }),

  listMyBookings: protectedProcedure
    .input(listMyBookingsSchema)
    .query(async ({ ctx, input }) => {
      const service = new BookingReadService(ctx.prisma);
      return service.listMyBookings(
        ctx.user.id,
        input.filter,
        input.limit,
        input.offset,
      );
    }),

  getBooking: protectedProcedure
    .input(getBookingSchema)
    .query(async ({ ctx, input }) => {
      const service = new BookingReadService(ctx.prisma);
      return service.getBooking(ctx.user.id, input.bookingReference);
    }),

  getTicket: protectedProcedure
    .input(getTicketSchema)
    .query(async ({ ctx, input }) => {
      const service = new BookingReadService(ctx.prisma);
      if (input.bookingReference) {
        return service.getTicket(ctx.user.id, {
          bookingReference: input.bookingReference,
        });
      }
      return service.getTicket(ctx.user.id, {
        ticketToken: input.ticketToken!,
      });
    }),

  getTicketByToken: publicProcedure
    .input(getTicketByTokenSchema)
    .query(async ({ ctx, input }) => {
      const service = new BookingReadService(ctx.prisma);
      return service.getTicketByToken(input.ticketToken);
    }),

  checkoutWithWallet: protectedProcedure
    .input(
      z.object({
        holdId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { BookingConfirmationService } = await import(
        "@/features/payments/services/booking-confirmation-service"
      );
      const confirmationService = new BookingConfirmationService(ctx.prisma);
      return confirmationService.confirmFromWallet(input.holdId, ctx.user.id);
    }),

  shareTicket: protectedProcedure
    .input(
      z.object({
        bookingReference: z.string(),
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        recipientPhone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findFirst({
        where: { bookingReference: input.bookingReference, userId: ctx.user.id },
        include: {
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

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found or not owned by you.",
        });
      }

      const originCity = booking.trip.schedule.route.originTerminal.cityRelation?.name ?? "Unknown";
      const destCity = booking.trip.schedule.route.destTerminal.cityRelation?.name ?? "Unknown";

      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret) {
        try {
          const { Novu } = await import("@novu/api");
          const novu = new Novu({ secretKey: novuSecret });
          await novu.trigger({
            workflowId: "passenger-ticket-shared",
            to: {
              subscriberId: input.recipientEmail,
              email: input.recipientEmail,
            },
            payload: {
              email: input.recipientEmail,
              passengerName: input.recipientName,
              senderName: ctx.user.name ?? "A friend",
              originCity,
              destinationCity: destCity,
              departureTime: booking.trip.departureDate.toLocaleString("en-US", { timeZone: "UTC" }),
              ticketToken: booking.ticketToken,
              phone: input.recipientPhone || undefined,
            },
          });
        } catch (err) {
          console.error("Failed to trigger passenger-ticket-shared via Novu:", err);
        }
      }

      return { success: true };
    }),
});
