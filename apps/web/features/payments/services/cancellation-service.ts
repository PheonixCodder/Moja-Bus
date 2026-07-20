import type { PrismaClient } from "@moja/db";
import { AccountingEngine, FinancialAccountService, Prisma } from "@moja/db";
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
          },
        },
      },
    });

    if (!booking) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
    }

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

    // F-24: when a pricing snapshot is missing we still need the platform
    // default commission rate so commission can be clawed back on cancellation.
    const platformCommissionBps =
      (await this.prisma.platformSettings.findUnique({ where: { id: "default" } }))
        ?.defaultCommissionBps ?? 500;

    const run = async (tx: any) => {
        // Serialize remainder math across concurrent seat cancels in the same hold
        await tx.$queryRaw(
        Prisma.sql`SELECT id FROM "hold_group" WHERE id = ${holdGroup.id} FOR UPDATE`,
      );

      const lockedBooking = await tx.booking.findUnique({
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

      const snapshot = holdGroup.pricingSnapshot;
      let proportionalBase = lockedBooking.farePaid;
      let proportionalOperatorNet = lockedBooking.farePaid;

      if (snapshot) {
        const cancelledSoFar = await tx.booking.count({
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
        // F-24: no pricing snapshot — derive the platform commission from the
        // default rate so it is still clawed back instead of being skipped.
        // proportionalOperatorNet is reduced by the commission, keeping the
        // ledger balanced (debits = proportionalBase = refundAmountXOF).
        const commission = Math.round((proportionalBase * platformCommissionBps) / 10_000);
        proportionalOperatorNet = Math.max(0, proportionalBase - commission);
      }

      const refundAmountXOF = Math.max(0, proportionalBase);
      const paystackRefundStatus = "COMPLETED" as const;

      await tx.booking.update({
        where: { id: lockedBooking.id },
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
          paystackRefundId: null,
          reason: input.reason ?? "Passenger cancellation before departure",
        },
      });

      if (refundAmountXOF > 0 || proportionalOperatorNet > 0) {
        const accountService = new FinancialAccountService(tx as any);
        const opAcct = await accountService.getOperatorReceivableAccount(
          lockedBooking.companyId,
        );
        const releaseFromReserve = lockedBooking.clearedAt === null;
        const commissionAmount = Math.max(0, refundAmountXOF - proportionalOperatorNet);

        if (input.channel === "WALLET") {
          if (!lockedBooking.userId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Cannot refund to wallet for a guest booking. The passenger must register and claim their booking first.",
            });
          }
          const platformCommissionAcct =
            await accountService.getPlatformCommissionRevenueAccount();
          const passengerWalletAcct = await accountService.getUserWallet(
            lockedBooking.userId,
          );

          const engine = new AccountingEngine("REFUND", {
            externalPaymentId: payment.id,
            description: `Wallet refund for cancelled booking ${lockedBooking.bookingReference}`,
            idempotencyKey: `REFUND_WALLET_${lockedBooking.id}`,
            metadata: { refundId: refund.id, proportionalBase, proportionalOperatorNet },
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
          await engine.commit(tx as any);
        } else {
          // CASH / VOUCHER: always claw back operator net into offline reimbursement payable
          const offlinePayable = await accountService.getOfflineRefundPayableAccount();
          const engine = new AccountingEngine("REFUND", {
            externalPaymentId: payment.id,
            description: `Offline/Voucher reimbursement for booking ${lockedBooking.bookingReference}`,
            idempotencyKey: `REFUND_OFFLINE_${lockedBooking.id}`,
            metadata: {
              refundId: refund.id,
              proportionalBase,
              proportionalOperatorNet,
              channel: input.channel,
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

      // M8 / M18: invariant guard. The hold_group `FOR UPDATE` lock taken at the
      // top of `run` serializes concurrent seat cancels, so the proportional
      // remainder math is exact. Still, assert that the sum of all issued
      // refunds plus the fare still on confirmed seats equals the original
      // charge — if it ever drifts (remainder mis-assigned), alert ops rather
      // than silently under/over-refunding.
      // The invariant only makes sense when a pricing snapshot exists (the
      // proportional remainder math keys off it). When `snapshot` is null the
      // service falls back to `lockedBooking.farePaid`, so there is no shared
      // base to reconcile against — skip the check rather than dereferencing null.
      if (snapshot) {
        const [issuedRefunds, remainingBookings] = await Promise.all([
          tx.refund.findMany({
            where: { holdGroupId: holdGroup.id },
            select: { amountXOF: true },
          }),
          tx.booking.findMany({
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
          await tx.activityLog.create({
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
          message: "Insufficient operator balance to process this refund — please contact support",
        });
      }
      throw err;
    }

    const email =
      booking.user?.email ??
      (booking.passengerPhone
        ? `${booking.passengerPhone.replace(/\s+/g, "")}@guest.mojaride.ci`
        : null);
    if (email) {
      const novuSecret = process.env["NOVU_SECRET_KEY"];
      if (novuSecret) {
        const { Novu } = await import("@novu/api");
        const novu = new Novu({ secretKey: novuSecret });
        void novu
          .trigger({
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
          })
          .catch((err) =>
            console.error("Failed to trigger passenger-booking-refunded via Novu:", err),
          );
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
