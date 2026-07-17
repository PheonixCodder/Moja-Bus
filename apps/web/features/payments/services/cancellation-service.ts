import type { PrismaClient } from "@moja/db";
import { AccountingEngine, FinancialAccountService } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { resolveHoldGroup } from "../lib/resolve-hold-group";

export type CancelBookingInput = {
  bookingReference: string;
  userId: string;
  userRole: "PASSENGER" | "OPERATOR" | "ADMIN";
  userCompanyId?: string | undefined;
  channel: "CASH" | "VOUCHER" | "WALLET";
  reason?: string | undefined;
};

export class CancellationService {
  constructor(private prisma: PrismaClient) {}

  async cancelBooking(input: CancelBookingInput) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference: input.bookingReference },
      include: {
        user: { select: { email: true, fullName: true } },
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
    let proportionalBase = booking.farePaid;
    let proportionalOperatorNet = booking.farePaid;

    if (snapshot) {
      const cancelledSoFar = await this.prisma.booking.count({
        where: { holdGroupId: holdGroup.id, status: "CANCELLED" },
      });
      const isLastSeat = (cancelledSoFar + 1) === snapshot.seatCount;
      const standardBase = Math.round(snapshot.subtotalBaseXOF / snapshot.seatCount);
      const standardNet = Math.round(snapshot.operatorNetXOF / snapshot.seatCount);

      proportionalBase = isLastSeat
        ? snapshot.subtotalBaseXOF - (cancelledSoFar * standardBase)
        : standardBase;
      
      proportionalOperatorNet = isLastSeat
        ? snapshot.operatorNetXOF - (cancelledSoFar * standardNet)
        : standardNet;
    }

    // Refund only the base ticket price, not the convenience fee
    const refundAmountXOF = Math.max(0, proportionalBase);

    let paystackRefundId: string | undefined;
    let paystackRefundStatus: "COMPLETED" | "PROCESSING" | "FAILED" = "COMPLETED";

    // paystack refund calls are removed; all automated refunds go to wallet.

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

      if (refundAmountXOF > 0) {
        // Financial Core Write
        const accountService = new FinancialAccountService(tx as any);
        const opAcct = await accountService.getOperatorReceivableAccount(booking.companyId);

        if (input.channel === "WALLET") {
          if (!booking.userId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot refund to wallet for a guest booking. The passenger must register and claim their booking first.",
            });
          }
          const platformCommissionAcct = await accountService.getPlatformCommissionRevenueAccount();
          const passengerWalletAcct = await accountService.getUserWallet(booking.userId);
          const commissionAmount = refundAmountXOF - proportionalOperatorNet;

          const engine = new AccountingEngine("REFUND", {
            externalPaymentId: payment.id,
            description: `Wallet refund for cancelled booking ${booking.bookingReference}`,
            metadata: { refundId: refund.id, proportionalBase },
          });

          if (proportionalOperatorNet > 0) {
            engine.addDebit({
              accountId: opAcct.id,
              amount: proportionalOperatorNet,
              sequenceNumber: 1,
              referenceType: "BOOKING_ID",
              referenceId: booking.id,
              description: "Operator refund deduction",
              releaseFromReserve: booking.clearedAt === null,
            });
          }

          if (commissionAmount > 0) {
            engine.addDebit({
              accountId: platformCommissionAcct.id,
              amount: commissionAmount,
              sequenceNumber: 2,
              referenceType: "BOOKING_ID",
              referenceId: booking.id,
              description: "Platform commission refund contribution",
            });
          }

          engine.addCredit({
            accountId: passengerWalletAcct.id,
            amount: refundAmountXOF,
            sequenceNumber: 3,
            referenceType: "BOOKING_ID",
            referenceId: booking.id,
            description: "Wallet credit for cancelled ticket",
          });

          engine.validate();
          await engine.commit(tx as any);
        } else if (proportionalOperatorNet > 0) {
          // CASH or VOUCHER
          const commissionAmount = refundAmountXOF - proportionalOperatorNet;
          const engine = new AccountingEngine("REFUND", {
            externalPaymentId: payment.id,
            description: `Offline/Voucher reimbursement for booking ${booking.bookingReference}`,
            metadata: { refundId: refund.id, proportionalBase },
          });

          if (commissionAmount > 0) {
            const platformCommissionAcct = await accountService.getPlatformCommissionRevenueAccount();
            engine.addDebit({
              accountId: platformCommissionAcct.id,
              amount: commissionAmount,
              sequenceNumber: 1,
              referenceType: "BOOKING_ID",
              referenceId: booking.id,
              description: "Platform commission reversal",
            });
            engine.addCredit({
              accountId: opAcct.id,
              amount: commissionAmount,
              sequenceNumber: 2,
              referenceType: "BOOKING_ID",
              referenceId: booking.id,
              description: "Reimbursement for cash refund (net of lost revenue)",
            });
          }

          engine.validate();
          await engine.commit(tx as any);
        }
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

    const email = booking.user?.email ?? (booking.passengerPhone ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci` : null);
    if (email) {
      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret) {
        const { Novu } = await import("@novu/api");
        const novu = new Novu({ secretKey: novuSecret });
        void novu.trigger({
          workflowId: "passenger-booking-refunded",
          to: {
            subscriberId: email,
            email: email,
          },
          payload: {
            email,
            passengerName: booking.user?.fullName ?? booking.passengerName,
            bookingReference: booking.bookingReference,
            refundAmountXOF: result.amountXOF,
            channel: result.channel as any,
            reason: result.reason ?? "Passenger cancellation before departure",
          },
        }).catch((err) => console.error("Failed to trigger passenger-booking-refunded via Novu:", err));
      }
    }

    return {
      success: true as const,
      refundId: result.id,
      amountXOF: result.amountXOF,
      channel: result.channel,
      status: result.status,
    };
  }
}
