import type { PrismaClient } from "@moja/db";
import { AccountingEngine, FinancialAccountService, Prisma } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { resolveHoldGroup } from "../lib/resolve-hold-group";
import {
  assertSettlementCancellable,
  resolveBookingSettlement,
} from "../lib/settlement-provenance";

export type CancelBookingInput = {
  bookingReference: string;
  userId: string;
  userRole: "PASSENGER" | "OPERATOR" | "ADMIN";
  userCompanyId?: string | undefined;
  channel: "CASH" | "WALLET" | "VOUCHER";
  reason?: string | undefined;
};

export class CancellationService {
  constructor(private prisma: PrismaClient) {}

  async cancelBooking(input: CancelBookingInput, tx?: any) {
    const db = tx || this.prisma;
    const booking = await db.booking.findUnique({
      where: { bookingReference: input.bookingReference },
      include: {
        user: { select: { email: true, fullName: true } },
        trip: {
          select: {
            departureDate: true,
            status: true,
            scheduleId: true,
            companyId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
    }

    if (booking.checkedInAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot cancel a booking after check-in",
      });
    }

    if (input.channel === "VOUCHER" && !booking.userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Voucher refunds require a passenger account — use cash instead",
      });
    }

    if (input.channel === "VOUCHER" && !booking.trip.scheduleId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "This trip has no schedule — cannot issue a schedule voucher. Use wallet or cash.",
      });
    }

    if (input.channel === "WALLET" && !booking.userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Cannot refund to wallet for a guest booking. Use cash instead, or have the passenger claim their booking first.",
      });
    }

    const isOwner = booking.userId === input.userId;
    const isCompanyStaff =
      input.userCompanyId && booking.companyId === input.userCompanyId;
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

    // Trip-cancel path sets trip CANCELLED first, then refunds seats after departure.
    if (
      booking.trip.departureDate <= new Date() &&
      booking.trip.status !== "CANCELLED"
    ) {
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

    const holdGroup = await resolveHoldGroup(db, booking.holdGroupId);
    const settlement = await resolveBookingSettlement(db, holdGroup);
    assertSettlementCancellable(settlement);

    const platformCommissionBps =
      (await this.prisma.platformSettings.findUnique({ where: { id: "default" } }))
        ?.defaultCommissionBps ?? 500;

    const requestIdempotencyKey = `CANCEL_${booking.id}_${input.channel}`;

    const run = async (txClient: any) => {
      await txClient.$queryRaw(
        Prisma.sql`SELECT id FROM "hold_group" WHERE id = ${holdGroup.id} FOR UPDATE`,
      );

      const lockedBooking = await txClient.booking.findUnique({
        where: { id: booking.id },
        select: {
          id: true,
          status: true,
          farePaid: true,
          clearedAt: true,
          userId: true,
          companyId: true,
          bookingReference: true,
          holdGroupId: true,
        },
      });

      if (!lockedBooking || lockedBooking.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking is no longer confirmed",
        });
      }

      const existingRefund = await txClient.refund.findUnique({
        where: { requestIdempotencyKey },
      });
      if (existingRefund) {
        return existingRefund;
      }

      const snapshot = holdGroup.pricingSnapshot;
      let proportionalBase = lockedBooking.farePaid;
      let proportionalOperatorNet = lockedBooking.farePaid;

      if (snapshot) {
        const cancelledSoFar = await txClient.booking.count({
          where: { holdGroupId: holdGroup.id, status: "CANCELLED" },
        });
        const isLastSeat = cancelledSoFar + 1 === snapshot.seatCount;
        const standardBase = Math.round(snapshot.subtotalBaseXOF / snapshot.seatCount);
        const standardNet = Math.round(snapshot.operatorNetXOF / snapshot.seatCount);

        proportionalBase = isLastSeat
          ? snapshot.subtotalBaseXOF - cancelledSoFar * standardBase
          : standardBase;

        proportionalOperatorNet = isLastSeat
          ? snapshot.operatorNetXOF - cancelledSoFar * standardNet
          : standardNet;
      } else {
        const commission = Math.round(
          (proportionalBase * platformCommissionBps) / 10_000,
        );
        proportionalOperatorNet = Math.max(0, proportionalBase - commission);
      }

      // D2: ticket subtotal share only — convenience fee is never refunded.
      const refundAmountXOF = Math.max(0, proportionalBase);

      // D1: WALLET → COMPLETED; CASH/VOUCHER → PENDING_FULFILMENT (not a card return).
      const refundStatus =
        input.channel === "WALLET"
          ? ("COMPLETED" as const)
          : ("PENDING_FULFILMENT" as const);

      await txClient.booking.update({
        where: { id: lockedBooking.id },
        data: {
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
        },
      });

      const refund = await txClient.refund.create({
        data: {
          holdGroupId: holdGroup.id,
          bookingId: lockedBooking.id,
          ...(settlement.externalPaymentId
            ? { paymentId: settlement.externalPaymentId }
            : {}),
          amountXOF: refundAmountXOF,
          channel: input.channel,
          status: refundStatus,
          paystackRefundId: null,
          requestIdempotencyKey,
          reason: input.reason ?? "Passenger cancellation before departure",
        },
      });

      if (refundAmountXOF > 0 || proportionalOperatorNet > 0) {
        const accountService = new FinancialAccountService(txClient as any);
        const opAcct = await accountService.getOperatorReceivableAccount(
          lockedBooking.companyId,
        );
        const releaseFromReserve = lockedBooking.clearedAt === null;
        const commissionAmount = Math.max(
          0,
          refundAmountXOF - proportionalOperatorNet,
        );

        if (input.channel === "WALLET") {
          const platformCommissionAcct =
            await accountService.getPlatformCommissionRevenueAccount();
          const passengerWalletAcct = await accountService.getUserWallet(
            lockedBooking.userId!,
          );

          const engine = new AccountingEngine("REFUND", {
            ...(settlement.externalPaymentId
              ? { externalPaymentId: settlement.externalPaymentId }
              : {}),
            description: `Wallet refund for cancelled booking ${lockedBooking.bookingReference}`,
            idempotencyKey: `REFUND_WALLET_${lockedBooking.id}`,
            metadata: {
              refundId: refund.id,
              proportionalBase,
              proportionalOperatorNet,
              settlementKind: settlement.kind,
            },
          });

          let seq = 1;
          if (proportionalOperatorNet > 0) {
            engine.addDebit({
              accountId: opAcct.id,
              amount: proportionalOperatorNet,
              sequenceNumber: seq++,
              referenceType: "BOOKING_ID",
              referenceId: lockedBooking.id,
              description: "Operator refund deduction",
              releaseFromReserve,
            });
          }

          if (commissionAmount > 0) {
            engine.addDebit({
              accountId: platformCommissionAcct.id,
              amount: commissionAmount,
              sequenceNumber: seq++,
              referenceType: "BOOKING_ID",
              referenceId: lockedBooking.id,
              description: "Platform commission refund contribution",
            });
          }

          if (refundAmountXOF > 0) {
            engine.addCredit({
              accountId: passengerWalletAcct.id,
              amount: refundAmountXOF,
              sequenceNumber: seq++,
              referenceType: "BOOKING_ID",
              referenceId: lockedBooking.id,
              description: "Wallet credit for cancelled ticket",
            });
          }

          engine.validate();
          await engine.commit(txClient as any);
        } else {
          const offlinePayable =
            await accountService.getOfflineRefundPayableAccount();
          const engine = new AccountingEngine("REFUND", {
            ...(settlement.externalPaymentId
              ? { externalPaymentId: settlement.externalPaymentId }
              : {}),
            description: `Offline/Voucher reimbursement for booking ${lockedBooking.bookingReference}`,
            idempotencyKey: `REFUND_OFFLINE_${lockedBooking.id}`,
            metadata: {
              refundId: refund.id,
              proportionalBase,
              proportionalOperatorNet,
              channel: input.channel,
              settlementKind: settlement.kind,
            },
          });

          let seq = 1;
          if (proportionalOperatorNet > 0) {
            engine.addDebit({
              accountId: opAcct.id,
              amount: proportionalOperatorNet,
              sequenceNumber: seq++,
              referenceType: "BOOKING_ID",
              referenceId: lockedBooking.id,
              description: "Operator net clawback for offline refund",
              releaseFromReserve,
            });
          }

          if (commissionAmount > 0) {
            const platformCommissionAcct =
              await accountService.getPlatformCommissionRevenueAccount();
            engine.addDebit({
              accountId: platformCommissionAcct.id,
              amount: commissionAmount,
              sequenceNumber: seq++,
              referenceType: "BOOKING_ID",
              referenceId: lockedBooking.id,
              description: "Platform commission reversal for offline refund",
            });
          }

          if (refundAmountXOF > 0) {
            engine.addCredit({
              accountId: offlinePayable.id,
              amount: refundAmountXOF,
              sequenceNumber: seq++,
              referenceType: "BOOKING_ID",
              referenceId: lockedBooking.id,
              description: "Offline passenger reimbursement payable",
            });
          }

          engine.validate();
          await engine.commit(txClient as any);
        }
      }

      const remainingConfirmed = await txClient.booking.count({
        where: {
          holdGroupId: holdGroup.id,
          status: "CONFIRMED",
        },
      });

      if (remainingConfirmed === 0) {
        await txClient.holdGroup.update({
          where: { id: holdGroup.id },
          data: { status: "CANCELLED" },
        });
      }

      if (snapshot) {
        const [issuedRefunds, remainingBookings] = await Promise.all([
          txClient.refund.findMany({
            where: { holdGroupId: holdGroup.id },
            select: { amountXOF: true },
          }),
          txClient.booking.findMany({
            where: { holdGroupId: holdGroup.id, status: "CONFIRMED" },
            select: { farePaid: true },
          }),
        ]);
        const refundedSum = issuedRefunds.reduce(
          (s: number, r: { amountXOF: number }) => s + r.amountXOF,
          0,
        );
        const remainingSum = remainingBookings.reduce(
          (s: number, b: { farePaid: number }) => s + b.farePaid,
          0,
        );
        if (refundedSum + remainingSum !== snapshot.subtotalBaseXOF) {
          console.error(
            `[REFUND-INVARIANT] holdGroup ${holdGroup.id}: refunded=${refundedSum} remaining=${remainingSum} charge=${snapshot.subtotalBaseXOF}`,
          );
          await txClient.activityLog.create({
            data: {
              companyId: lockedBooking.companyId,
              userId: input.userId,
              action: "REFUND_INVARIANT_VIOLATION",
              description: `Refund sum + remaining confirmed fare (${refundedSum + remainingSum}) does not equal charge (${snapshot.subtotalBaseXOF}) for hold group ${holdGroup.id}`,
              metadata: {
                holdGroupId: holdGroup.id,
                refundedSum,
                remainingSum,
                charge: snapshot.subtotalBaseXOF,
              },
            },
          });
        }
      }

      return refund;
    };

    let result;
    try {
      result = tx ? await run(tx) : await this.prisma.$transaction(run);
    } catch (err: any) {
      if (err.message && err.message.includes("Insufficient funds")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Insufficient operator balance to process this refund — please contact support",
        });
      }
      throw err;
    }

    // P2-18 / P2-2: durable outbox — only when we have a real email.
    const email = booking.user?.email ?? null;
    if (email) {
      const { enqueueBookingRefunded } = await import(
        "@/features/notifications/outbox/commercial"
      );
      await enqueueBookingRefunded(this.prisma, {
        refundId: result.id,
        email,
        subscriberId: booking.userId ?? email,
        firstName: (booking.user?.fullName ?? booking.passengerName).split(
          " ",
        )[0],
        data: {
          email,
          passengerName: booking.user?.fullName ?? booking.passengerName,
          bookingReference: booking.bookingReference,
          refundAmountXOF: result.amountXOF,
          channel: result.channel as string,
          reason: result.reason ?? "Passenger cancellation before departure",
        },
      });
    }

    let voucherId: string | null = null;
    if (input.channel === "VOUCHER" && booking.userId && result.amountXOF > 0) {
      const { issueCancellationVoucher } = await import(
        "@/features/discounts/services/voucher-service"
      );
      const issued = await issueCancellationVoucher(this.prisma, {
        userId: booking.userId,
        amountXOF: result.amountXOF,
        sourceBookingId: booking.id,
        sourceHoldGroupId: booking.holdGroupId ?? undefined,
        scheduleId: booking.trip.scheduleId!,
        companyId: booking.trip.companyId,
      });
      voucherId = issued?.voucherId ?? null;
    }

    return {
      success: true as const,
      refundId: result.id,
      amountXOF: result.amountXOF,
      channel: result.channel,
      status: result.status,
      voucherId,
    };
  }
}
