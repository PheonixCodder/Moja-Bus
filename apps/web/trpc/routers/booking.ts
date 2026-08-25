import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { ConfirmedBookingResult } from "@moja/types";
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
import { getAppOrigin } from "@/lib/app-origin";
import { TripDetailsService } from "@/features/booking/services/trip-details-service";
import { SeatAvailabilityService } from "@/features/booking/services/seat-availability-service";
import { BookingHoldService } from "@/features/booking/services/booking-hold-service";
import { BookingReadService } from "@/features/booking/services/booking-read-service";
import { PaymentService } from "@/features/payments/payment-service";
import { buildBookingSuccessUrl } from "@/features/payments/lib/booking-success-url";
import { getNovuClient } from "@/lib/novu";

function withSuccessUrl(
  confirmed: ConfirmedBookingResult,
  holdGroup: { offerId: string; seatCount: number },
  locale?: "en" | "fr",
): ConfirmedBookingResult & { successUrl: string } {
  return {
    ...confirmed,
    successUrl: buildBookingSuccessUrl(
      holdGroup.offerId,
      confirmed,
      holdGroup.seatCount,
      locale,
    ),
  };
}

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
        // Phase 32 (F-PS-14) — the passenger-hold-created notice now
        // enqueues INSIDE the service transaction; this router no longer
        // fires a post-commit best-effort copy (the old try/catch-swallow
        // could permanently lose the notice on a crash after commit).
        ...(ctx.user.email
          ? {
              notify: {
                email: ctx.user.email,
                subscriberId: ctx.user.id,
                passengerName: ctx.user.name ?? "Passenger",
                phone: ctx.user.phoneNumber ?? null,
              },
            }
          : {}),
      });

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
      // F-PS-01: ownership enforced inside the service before any Paystack call.
      const confirmed = await paymentService.verifyAndConfirmForUser(
        input.reference,
        ctx.user.id,
      );
      const holdGroup = await ctx.prisma.holdGroup.findUnique({
        where: { id: confirmed.holdId },
        select: { offerId: true, seatCount: true },
      });
      return holdGroup
        ? withSuccessUrl(confirmed, holdGroup, input.locale)
        : confirmed;
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
      const confirmed = await service.confirmBooking(input.holdId, ctx.user.id);
      return withSuccessUrl(confirmed, holdGroup, input.locale);
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
        locale: z.enum(["en", "fr"]).optional(),
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
      const confirmed = await confirmationService.confirmFromWallet(
        input.holdId,
        ctx.user.id,
      );
      return withSuccessUrl(confirmed, holdGroup, input.locale);
    }),

  refreezeHoldDiscounts: protectedProcedure
    .input(
      z.object({
        holdId: z.string(),
        code: z.string().optional(),
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
        locale: z.enum(["en", "fr"]).default("fr"),
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
              // P2-3 👻: absolute locale-prefixed link built from the canonical
              // app origin — the old hardcoded mojaride.com link 404'd.
              ticketUrl: `${getAppOrigin()}/${input.locale}/tickets/${booking.ticketToken}`,
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
