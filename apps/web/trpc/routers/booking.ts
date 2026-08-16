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
import { enqueueHoldCreated } from "@/features/notifications/outbox/commercial";
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
        quoteId: input.quoteId,
        discount: input.discount,
        ...(input.deviceHash !== undefined
          ? { deviceHash: input.deviceHash }
          : {}),
      });

      // Durable outbox: passenger-hold-created (optional Phase 07 cover)
      const email = ctx.user.email;
      const passengerName = ctx.user.name ?? "Passenger";
      const phone = ctx.user.phoneNumber ?? null;

      if (email) {
        try {
          const details = await ctx.prisma.trip.findFirst({
            where: { bookings: { some: { holdGroupId: result.holdId } } },
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
          });

          if (details) {
            const originCity =
              details.schedule?.route.originTerminal.cityRelation?.name ??
              "Unknown";
            const destCity =
              details.schedule?.route.destTerminal.cityRelation?.name ??
              "Unknown";
            const originMunicipality =
              details.schedule?.route.originTerminal.municipality?.name ?? null;
            const destMunicipality =
              details.schedule?.route.destTerminal.municipality?.name ?? null;
            await enqueueHoldCreated(ctx.prisma, {
              holdId: result.holdId,
              email,
              subscriberId: ctx.user.id,
              firstName: passengerName.split(" ")[0],
              data: {
                email,
                passengerName,
                originCity,
                destinationCity: destCity,
                originMunicipality,
                destinationMunicipality: destMunicipality,
                departureTime: details.departureDate.toLocaleString("en-US", {
                  timeZone: "Africa/Abidjan",
                }),
                holdId: result.holdId,
                expiresAt: result.holdExpiresAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Africa/Abidjan",
                }),
                totalAmountXOF: result.totalAmountXOF,
                phone: phone ?? undefined,
              },
            });
          }
        } catch (err) {
          console.error("Failed to enqueue passenger-hold-created:", err);
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
      const {
        checkoutSessionCookieValue,
        signCheckoutSession,
      } = await import("@/features/payments/lib/signed-access-tokens");
      const holdGroup = await resolveHoldGroup(ctx.prisma, input.holdId);
      assertHoldOwnedByUser(holdGroup, ctx.user.id);

      const service = new PaymentService(ctx.prisma);
      const result = await service.initiateForHold(
        input.holdId,
        input.payerEmail ?? ctx.user.email ?? null,
        input.locale ? { locale: input.locale } : {},
      );

      // P1-20: bind verify callback to this user + hold via HttpOnly cookie.
      const sessionToken = signCheckoutSession({
        holdGroupId: result.holdGroupId,
        userId: ctx.user.id,
        ...(input.locale ? { locale: input.locale } : {}),
      });
      ctx.resHeaders?.append(
        "Set-Cookie",
        checkoutSessionCookieValue(sessionToken),
      );

      return result;
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
      const { resolveTicketAccessToken } = await import(
        "@/features/payments/lib/signed-access-tokens"
      );
      const resolved = resolveTicketAccessToken(input.ticketToken);
      if (!resolved) {
        const { TRPCError } = await import("@trpc/server");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }
      const service = new BookingReadService(ctx.prisma);
      return service.getTicketByToken(resolved.ticketToken);
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

  refreezeHoldDiscounts: protectedProcedure
    .input(
      z.object({
        holdId: z.string(),
        code: z.string().optional(),
        monetaryVoucherId: z.string().optional(),
        autoApply: z.boolean().optional(),
        useCredits: z.boolean().optional(),
        creditAmountXOF: z.number().int().min(0).optional(),
        waiveConvenienceFee: z.boolean().optional(),
        deviceHash: z.string().optional(),
      }),
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

      const { refreezeHoldDiscounts } = await import(
        "@/features/discounts/services/quote-service"
      );
      const quote = await refreezeHoldDiscounts(ctx.prisma, {
        holdGroupId: input.holdId,
        userId: ctx.user.id,
        code: input.code,
        monetaryVoucherId: input.monetaryVoucherId,
        autoApply: input.autoApply,
        useCredits: input.useCredits,
        creditAmountXOF: input.creditAmountXOF,
        waiveConvenienceFee: input.waiveConvenienceFee,
        deviceHash: input.deviceHash,
      });
      return {
        chargeAmountXOF: quote.chargeAmountXOF,
        creditAppliedXOF: quote.creditAppliedXOF,
        ticketDiscountXOF: quote.ticketDiscountXOF,
        convenienceFeeXOF: quote.convenienceFeeXOF,
        postDiscountSubtotalXOF: quote.postDiscountSubtotalXOF,
        preDiscountSubtotalXOF: quote.preDiscountSubtotalXOF,
        ok: quote.ok,
      };
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
          originTripStop: {
            include: {
              terminal: { include: { cityRelation: true, municipality: true } },
            },
          },
          destinationTripStop: {
            include: {
              terminal: { include: { cityRelation: true, municipality: true } },
            },
          },
          trip: {
            select: { departureDate: true },
          },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found or not owned by you.",
        });
      }

      const originCity = booking.originTripStop?.terminal.cityRelation?.name ?? "Unknown";
      const destCity = booking.destinationTripStop?.terminal.cityRelation?.name ?? "Unknown";
      const originMunicipality = booking.originTripStop?.terminal.municipality?.name ?? null;
      const destMunicipality = booking.destinationTripStop?.terminal.municipality?.name ?? null;

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
              originMunicipality,
              destinationMunicipality: destMunicipality,
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
