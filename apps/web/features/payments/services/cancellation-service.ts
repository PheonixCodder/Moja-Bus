import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { resolveHoldGroup } from "../lib/resolve-hold-group";

export type CancelBookingInput = {
  bookingReference: string;
  userId: string;
  channel: "CASH" | "VOUCHER";
  reason?: string;
};

export class CancellationService {
  constructor(private prisma: PrismaClient) {}

  async cancelBooking(input: CancelBookingInput) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference: input.bookingReference },
      include: {
        trip: {
          select: {
            departureDate: true,
            status: true,
          },
        },
      },
    });

    if (!booking || booking.userId !== input.userId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
    }

    if (booking.status !== "CONFIRMED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only confirmed bookings can be cancelled",
      });
    }

    if (booking.trip.departureDate <= new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot cancel after departure",
      });
    }

    if (!booking.holdGroupId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Booking is missing checkout group",
      });
    }

    const holdGroup = await resolveHoldGroup(this.prisma, booking.holdGroupId);
    const payment = holdGroup.payment;

    if (!payment || payment.status !== "SUCCESS") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No successful payment found for this booking",
      });
    }

    const snapshot = holdGroup.pricingSnapshot;
    const proportionalBase = snapshot
      ? Math.round(snapshot.subtotalBaseXOF / snapshot.seatCount)
      : booking.farePaid;
    const proportionalCharge = snapshot
      ? Math.round(snapshot.chargeAmountXOF / snapshot.seatCount)
      : booking.farePaid;
    const proportionalOperatorNet = snapshot
      ? Math.round(snapshot.operatorNetXOF / snapshot.seatCount)
      : booking.farePaid;

    const refundAmountXOF = Math.max(0, proportionalCharge);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
        },
      });

      const refund = await tx.refund.create({
        data: {
          holdGroupId: holdGroup.id,
          paymentId: payment.id,
          amountXOF: refundAmountXOF,
          channel: input.channel,
          status: "COMPLETED",
          reason: input.reason ?? "Passenger cancellation before departure",
        },
      });

      if (proportionalOperatorNet > 0) {
        await tx.operatorLedgerEntry.create({
          data: {
            companyId: booking.companyId,
            holdGroupId: holdGroup.id,
            paymentId: payment.id,
            entryType: "DEBIT",
            sourceType: "REFUND",
            amountXOF: proportionalOperatorNet,
            description: `Refund debit for cancelled booking ${booking.bookingReference}`,
            metadata: { refundId: refund.id, proportionalBase },
          },
        });
      }

      const remainingConfirmed = await tx.booking.count({
        where: {
          holdGroupId: holdGroup.id,
          status: "CONFIRMED",
        },
      });

      if (remainingConfirmed === 0) {
        await tx.holdGroup.update({
          where: { id: holdGroup.id },
          data: { status: "CANCELLED" },
        });
      }

      return refund;
    });

    return {
      success: true as const,
      refundId: result.id,
      amountXOF: result.amountXOF,
      channel: result.channel,
      status: result.status,
    };
  }
}
