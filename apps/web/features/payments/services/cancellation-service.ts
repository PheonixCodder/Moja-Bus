import type { PrismaClient } from "@moja/db";
import { AccountingEngine, FinancialAccountService, Prisma } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { enqueueBookingRefunded } from "@/features/notifications/outbox/commercial";
import {
  isCreatableRefundChannel,
  refundStatusForCancellationChannel,
  computeRefundQuote,
  type CreatableRefundChannel,
} from "../lib/cancellation-policy";
import { resolveHoldGroup } from "../lib/resolve-hold-group";
import {
  assertSettlementCancellable,
  resolveBookingSettlement,
} from "../lib/settlement-provenance";

import type { CancellationRefundChannel } from "../lib/cancellation-policy";

export type CancelBookingInput = {
  bookingReference: string;
  userId: string;
  userRole: "PASSENGER" | "OPERATOR" | "ADMIN";
  userCompanyId?: string | undefined;
  channel: CancellationRefundChannel;
  reason?: string | undefined;
  /**
   * P1-6: emit the passenger-booking-refunded outbox message (default true).
   * The operator trip-cancel path passes false — it already sends
   * passenger-trip-cancelled with the refund amount included.
   */
  notifyRefunded?: boolean;
};

export class CancellationService {
  constructor(private prisma: PrismaClient) {}

  async cancelBooking(input: CancelBookingInput, tx?: any) {
    // F-PS-02: PAYSTACK refunds are disabled — money never flows back out
    // through Paystack. Wallet credit or manual settlement only.
    if (!isCreatableRefundChannel(input.channel)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Paystack refunds are disabled — refunds are issued as Moja wallet credit or manual settlement",
      });
    }
    const channel: CreatableRefundChannel = input.channel;

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

    // F-PS-02 sibling: fully promo-covered confirms collected no money.
    // Cancelling releases the seat without minting a refund obligation.
    const zeroCashSettlement = settlement.kind === "ZERO_CASH";

    const platformCommissionBps =
      (
        await this.prisma.platformSettings.findUnique({
          where: { id: "default" },
        })
      )?.defaultCommissionBps ?? 500;

    const requestIdempotencyKey = `CANCEL_${booking.id}_${channel}`;

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

      if (lockedBooking?.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking is no longer confirmed",
        });
      }

      const existingRefund = await txClient.refund.findUnique({
        where: { requestIdempotencyKey },
      });
      if (existingRefund) {
        return {
          refund: existingRefund,
        };
      }

      // Zero-cash settlements mint no refund row, notice, or ledger legs —
      // there is no money to return. paymentStatus stays untouched since no
      // cash ever moved; the fare-sum invariant below presumes cash, so it
      // does not run on this path either.
      if (zeroCashSettlement) {
        await txClient.booking.update({
          where: { id: lockedBooking.id },
          data: { status: "CANCELLED" },
        });

        const remainingConfirmed = await txClient.booking.count({
          where: { holdGroupId: holdGroup.id, status: "CONFIRMED" },
        });
        if (remainingConfirmed === 0) {
          await txClient.holdGroup.update({
            where: { id: holdGroup.id },
            data: { status: "CANCELLED" },
          });
        }

        return { refund: null };
      }

      const snapshot = holdGroup.pricingSnapshot as {
        seatCount: number;
        subtotalBaseXOF: number;
        operatorNetXOF: number;
      } | null;

      const cancelledSoFar = snapshot
        ? await txClient.booking.count({
            where: { holdGroupId: holdGroup.id, status: "CANCELLED" },
          })
        : 0;

      // P2-12 — quote math lives in cancellation-policy; the dialog preview
      // uses the exact same function, so displayed amounts can never drift.
      const { refundAmountXOF, operatorNetXOF: proportionalOperatorNet } =
        computeRefundQuote({
          farePaid: lockedBooking.farePaid,
          pricingSnapshot: snapshot,
          cancelledSoFar,
          platformCommissionBps,
        });

      const refundStatus = refundStatusForCancellationChannel(channel);

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
          channel,
          status: refundStatus,
          paystackRefundId: null,
          requestIdempotencyKey,
          reason: input.reason ?? "Passenger cancellation before departure",
        },
      });

      // P1-6: durable passenger notice, committed atomically with the refund.
      // Guests are skipped — their bookings carry no account to deliver to.
      if (
        input.notifyRefunded !== false &&
        lockedBooking.userId &&
        booking.user?.email
      ) {
        await enqueueBookingRefunded(txClient as any, {
          refundId: refund.id,
          email: booking.user.email,
          subscriberId: lockedBooking.userId,
          ...(booking.user.fullName
            ? { firstName: booking.user.fullName.split(" ")[0] }
            : {}),
          data: {
            passengerName: booking.user.fullName ?? booking.passengerName,
            bookingReference: lockedBooking.bookingReference,
            refundAmountXOF,
            channel,
            reason: input.reason ?? "Passenger cancellation before departure",
          },
        });
      }



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

        if (channel === "WALLET") {
          if (!lockedBooking.userId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot refund to wallet without a passenger account",
            });
          }
          const platformCommissionAcct =
            await accountService.getPlatformCommissionRevenueAccount();
          const passengerWalletAcct = await accountService.getUserWallet(
            lockedBooking.userId,
          );

          const engine = new AccountingEngine("REFUND", {
            ...(settlement.externalPaymentId
              ? { externalPaymentId: settlement.externalPaymentId }
              : {}),
            description: `Wallet refund for cancelled booking ${lockedBooking.bookingReference}`,
            idempotencyKey: `REFUND_WALLET_${lockedBooking.id}`,
            metadata: {
              refundId: refund.id,
              proportionalBase: refundAmountXOF,
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
          const reimbursementPayable =
            await accountService.getOfflineRefundPayableAccount();
          const engine = new AccountingEngine("REFUND", {
            ...(settlement.externalPaymentId
              ? { externalPaymentId: settlement.externalPaymentId }
              : {}),
            description: `Offline reimbursement for booking ${lockedBooking.bookingReference}`,
            idempotencyKey: `REFUND_OFFLINE_${lockedBooking.id}`,
            metadata: {
              refundId: refund.id,
              proportionalBase: refundAmountXOF,
              proportionalOperatorNet,
              channel,
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
              accountId: reimbursementPayable.id,
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

      return { refund };
    };

    let result: { refund: any };
    try {
      result = tx ? await run(tx) : await this.prisma.$transaction(run);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Insufficient funds")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Insufficient operator balance to process this refund — please contact support",
        });
      }
      throw err;
    }

    if (result.refund?.status === "PENDING_FULFILMENT") {
      await this.prisma.activityLog.create({
        data: {
          companyId: booking.companyId,
          userId: input.userId,
          action: "OFFLINE_REFUND_PENDING",
          description: `Offline cash refund of ${result.refund.amountXOF} XOF pending manual fulfillment by operator`,
          metadata: {
            refundId: result.refund.id,
            bookingReference: booking.bookingReference,
            refundAmountXOF: result.refund.amountXOF,
            channel: result.refund.channel as string,
            reason:
              result.refund.reason ?? "Passenger cancellation before departure",
          },
        },
      });
    }

    return {
      success: true as const,
      // Zero-cash settlements mint no Refund row — the seat release IS the
      // outcome; nothing was collected so nothing is refunded.
      refundId: result.refund?.id ?? null,
      amountXOF: result.refund?.amountXOF ?? 0,
      channel: (result.refund?.channel as string | undefined) ?? channel,
      status: result.refund?.status ?? "NO_REFUND_DUE",
    };
  }
}
