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
import { getNovuClient } from "@/lib/novu";

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

  createHold: protectedProcedure
    .input(createHoldSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new BookingHoldService(ctx.prisma);
      const result = await service.createHold({
        offerId: input.offerId,
        passengers: input.passengers,
        userId: ctx.user.id,
      });

      // Trigger passenger-hold-created
      const email = ctx.user.email;
      const passengerName = ctx.user.name ?? "Passenger";
      const phone = ctx.user.phoneNumber ?? null;

      if (email) {
        const novu = getNovuClient();
        if (novu) {
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
                  departureTime: details.departureDate.toLocaleString("en-US", { timeZone: "Africa/Abidjan" }),
                  holdId: result.holdId,
                  expiresAt: result.holdExpiresAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Abidjan" }),
                  totalAmountXOF: result.totalAmountXOF,
                  phone: phone ?? undefined,
                },
                transactionId: `passenger-hold-created-${result.holdId}`,
              }).catch(() => {});
            }
          } catch (err) {
            console.error("Failed to trigger passenger-hold-created via Novu:", err);
          }
        }
      }

      return result;
    }),

  initiatePayment: protectedProcedure
    .input(initiatePaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const { resolveHoldGroup } = await import(
        "@/features/payments/lib/resolve-hold-group"
      );
      const { assertHoldOwnedByUser } = await import(
        "@/features/booking/lib/assert-hold-ownership"
      );
      const holdGroup = await resolveHoldGroup(ctx.prisma, input.holdId);
      assertHoldOwnedByUser(holdGroup, ctx.user.id);

      const service = new PaymentService(ctx.prisma);
      return service.initiateForHold(
        input.holdId,
        input.payerEmail ?? ctx.user.email ?? null,
      );
    }),

  verifyPayment: protectedProcedure
    .input(verifyPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const paymentService = new PaymentService(ctx.prisma);
      return paymentService.verifyAndConfirm(
        input.reference,
        ctx.user.id,
      );
    }),

  confirmBooking: protectedProcedure
    .input(confirmBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const { resolveHoldGroup } = await import(
        "@/features/payments/lib/resolve-hold-group"
      );
      const { assertHoldOwnedByUser } = await import(
        "@/features/booking/lib/assert-hold-ownership"
      );
      const holdGroup = await resolveHoldGroup(ctx.prisma, input.holdId);
      assertHoldOwnedByUser(holdGroup, ctx.user.id);

      const paymentService = new PaymentService(ctx.prisma);
      await paymentService.assertHoldPaid(input.holdId);
      const service = new BookingHoldService(ctx.prisma);
      return service.confirmBooking(input.holdId, ctx.user.id);
    }),

  releaseHold: protectedProcedure
    .input(releaseHoldSchema)
    .mutation(async ({ ctx, input }) => {
      const { resolveHoldGroup } = await import(
        "@/features/payments/lib/resolve-hold-group"
      );
      const { assertHoldOwnedByUser } = await import(
        "@/features/booking/lib/assert-hold-ownership"
      );
      const holdGroup = await resolveHoldGroup(ctx.prisma, input.holdId);
      assertHoldOwnedByUser(holdGroup, ctx.user.id);

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
      const { resolveHoldGroup } = await import(
        "@/features/payments/lib/resolve-hold-group"
      );
      const { assertHoldOwnedByUser } = await import(
        "@/features/booking/lib/assert-hold-ownership"
      );
      const holdGroup = await resolveHoldGroup(ctx.prisma, input.holdId);
      assertHoldOwnedByUser(holdGroup, ctx.user.id);

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

      const novu = getNovuClient();
      if (novu) {
        try {
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
            transactionId: `passenger-ticket-shared-${booking.id}-${input.recipientEmail}`,
          }).catch(() => {});
        } catch (err) {
          console.error("Failed to trigger passenger-ticket-shared via Novu:", err);
        }
      }

      return { success: true };
    }),
});
