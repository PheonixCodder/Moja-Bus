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
      return service.createHold({
        offerId: input.offerId,
        passengers: input.passengers,
        userId: ctx.user?.id ?? null,
      });
    }),

  initiatePayment: publicProcedure
    .input(initiatePaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PaymentService(ctx.prisma);
      return service.initiateForHold(
        input.holdId,
        input.provider,
        input.payerEmail ?? ctx.user?.email ?? null,
      );
    }),

  verifyPayment: publicProcedure
    .input(verifyPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const paymentService = new PaymentService(ctx.prisma);
      const result = await paymentService.verifyAndConfirm(
        input.reference,
        ctx.user?.id ?? null,
      );
      const holdService = new BookingHoldService(ctx.prisma);
      return holdService.confirmBooking(
        result.holdGroupId,
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
});
