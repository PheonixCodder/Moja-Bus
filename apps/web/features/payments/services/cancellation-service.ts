import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { resolveHoldGroup } from "../lib/resolve-hold-group";

export type CancelBookingInput = {
  bookingReference: string;
  userId: string;
  userRole: "PASSENGER" | "OPERATOR" | "ADMIN";
  userCompanyId?: string | undefined;
  channel: "CASH" | "VOUCHER" | "PAYSTACK";
  reason?: string | undefined;
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

    if (!booking) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
    }

    // Validate permission: owner passenger, operator staff of the owning company, or admin
    const isOwner = booking.userId === input.userId;
    const isCompanyStaff = input.userCompanyId && booking.companyId === input.userCompanyId;
    const isAdmin = input.userRole === "ADMIN";

    if (!isOwner && !isCompanyStaff && !isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to cancel this booking",
      });
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
    const proportionalOperatorNet = snapshot
      ? Math.round(snapshot.operatorNetXOF / snapshot.seatCount)
      : booking.farePaid;

    // Refund only the base ticket price, not the convenience fee
    const refundAmountXOF = Math.max(0, proportionalBase);

    let paystackRefundId: string | undefined;
    let paystackRefundStatus: "COMPLETED" | "PROCESSING" | "FAILED" = "COMPLETED";

    if (input.channel === "PAYSTACK") {
      if (payment.provider === "MOCK") {
        paystackRefundId = `mock_ref_${Date.now()}`;
      } else {
        const { PaystackProvider } = await import("../providers/paystack-provider");
        const provider = new PaystackProvider();
        try {
          const refundResult = await provider.refund({
            reference: payment.paystackReference!,
            amountXOF: refundAmountXOF,
            reason: input.reason ?? "Customer refund",
          });
          paystackRefundId = refundResult.refundId;
          paystackRefundStatus = refundResult.status === "processed" ? "COMPLETED" : "PROCESSING";
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Paystack refund initiation failed: ${err.message}`,
          });
        }
      }
    }

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
          status: paystackRefundStatus,
          paystackRefundId: paystackRefundId ?? null,
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
