import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { ConfirmedBookingResult } from "@moja/types";
import {
  assertHoldGroupActive,
  resolveHoldGroup,
} from "../lib/resolve-hold-group";
import { AccountingEngine, FinancialAccountService, Prisma } from "@moja/db";
import { toSafeDisplayNumber } from "@/lib/money";

export class BookingConfirmationService {
  private accountService: FinancialAccountService;

  constructor(private prisma: PrismaClient) {
    this.accountService = new FinancialAccountService(prisma);
  }

  /** Idempotent: safe to call from webhook and verify endpoint. */
  async confirmFromPayment(
    holdGroupId: string,
    userId?: string | null,
  ): Promise<ConfirmedBookingResult> {
    const holdGroup = await resolveHoldGroup(this.prisma, holdGroupId);

    if (holdGroup.status === "CONFIRMED") {
      return {
        holdId: holdGroup.id,
        bookingReferences: holdGroup.bookings.map((b) => b.bookingReference),
        ticketTokens: holdGroup.bookings.map((b) => b.ticketToken),
        totalAmountXOF:
          holdGroup.pricingSnapshot?.chargeAmountXOF ??
          holdGroup.bookings.reduce((sum, b) => sum + b.farePaid, 0),
        status: "CONFIRMED",
      };
    }

    if (!holdGroup.payment || holdGroup.payment.status !== "SUCCESS") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment has not been completed for this hold",
      });
    }

    // Fix #2: Orphan Rescue — if payment was captured but hold expired, rescue funds to wallet.
    // This handles both the case where the cron runs after expiry AND direct webhook calls.
    const holdIsExpired =
      holdGroup.status !== "ACTIVE" ||
      (holdGroup.holdExpiresAt !== null && holdGroup.holdExpiresAt < new Date());

    if (holdIsExpired) {
      await this.rescueOrphanedPayment(holdGroup, userId);
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Your booking session expired, but your payment was captured. The full amount has been credited to your Moja Wallet. You can use it to book again immediately.",
      });
    }

    assertHoldGroupActive(holdGroup);

    const clearingAcct = await this.accountService.getSystemPaystackClearingAccount();
    const operatorAcct = await this.accountService.getOperatorReceivableAccount(holdGroup.companyId);
    const platformCommissionAcct = await this.accountService.getPlatformCommissionRevenueAccount();
    const platformConvenienceAcct = await this.accountService.getPlatformConvenienceFeeRevenueAccount();
    const processorFeeAcct = await this.accountService.getPaymentProcessorFeeAccount();

    let confirmed;
    try {
      confirmed = await this.prisma.$transaction(async (tx) => {
      // Idempotent guard: only one concurrent confirm wins
      const holdClaim = await tx.holdGroup.updateMany({
        where: { id: holdGroup.id, status: "ACTIVE" },
        data: { status: "CONFIRMED" },
      });
      if (holdClaim.count === 0) {
        const existing = await tx.holdGroup.findUnique({
          where: { id: holdGroup.id },
          include: { bookings: true },
        });
        if (existing?.status === "CONFIRMED") {
          return existing.bookings;
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Hold group is no longer active",
        });
      }

      // F-16 defense-in-depth: re-verify no other hold group already holds any of
      // these seats on an overlapping segment. createHold now serializes holds per
      // trip (SELECT ... FOR UPDATE), so this should never trip — but it guarantees
      // no over-sale at confirm time even if a hold somehow slipped through.
      const holdBookings = await tx.booking.findMany({
        where: { holdGroupId: holdGroup.id },
        select: {
          id: true,
          seatId: true,
          boardingStopOrder: true,
          dropoffStopOrder: true,
        },
      });

      const updatedBookings = [];
      for (const booking of holdBookings) {
        const clash = await tx.booking.findFirst({
          where: {
            tripId: holdGroup.tripId,
            seatId: booking.seatId,
            id: { not: booking.id },
            holdGroupId: { not: holdGroup.id },
            OR: [
              { status: "CONFIRMED" },
              { status: "PENDING_PAYMENT", holdExpiresAt: { gt: new Date() } },
            ],
            boardingStopOrder: { lt: booking.dropoffStopOrder },
            dropoffStopOrder: { gt: booking.boardingStopOrder },
          },
        });
        if (clash) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Seat no longer available for this segment",
          });
        }

        const updated = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: "PENDING_PAYMENT",
          },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            issuedAt: new Date(),
            holdExpiresAt: null,
            ...(userId ? { userId } : {}),
          },
        });
        if (updated.count === 0) {
          const current = await tx.booking.findUnique({ where: { id: booking.id } });
          if (current?.status === "CONFIRMED") {
            updatedBookings.push(current);
            continue;
          }
          throw new TRPCError({
            code: "CONFLICT",
            message: "Booking could not be confirmed",
          });
        }
        updatedBookings.push(
          await tx.booking.findUniqueOrThrow({ where: { id: booking.id } }),
        );
      }

      const snapshot = holdGroup.pricingSnapshot;
      if (snapshot && snapshot.operatorNetXOF > 0) {
        // Post the double-entry transaction
        const engine = new AccountingEngine("BOOKING", {
          externalPaymentId: holdGroup.payment!.id,
          description: `Payment for booking hold ${holdGroup.id}`,
          idempotencyKey: `CARD_BOOKING_${holdGroup.id}`,
        });

        const feesXOF = holdGroup.payment?.feesXOF ?? 0;
        let seq = 1;
        
        engine.addDebit({
          accountId: clearingAcct.id,
          amount: snapshot.chargeAmountXOF - feesXOF,
          sequenceNumber: seq++,
          referenceType: "HOLD_GROUP",
          referenceId: holdGroup.id,
          description: "Funds received from Paystack net of fees",
        });

        if (feesXOF > 0) {
          engine.addDebit({
            accountId: processorFeeAcct.id,
            amount: feesXOF,
            sequenceNumber: seq++,
            referenceType: "HOLD_GROUP",
            referenceId: holdGroup.id,
            description: "Paystack processing fees",
          });
        }

        engine.addCredit({
          accountId: operatorAcct.id,
          amount: snapshot.operatorNetXOF,
          sequenceNumber: seq++,
          referenceType: "HOLD_GROUP",
          referenceId: holdGroup.id,
          description: "Operator ticket revenue net of commission (escrowed until departure)",
          reserveOnCredit: true, // Fix #1: funds go into reservedBalance until trip departs
        });

        if (snapshot.commissionXOF > 0) {
          engine.addCredit({
            accountId: platformCommissionAcct.id,
            amount: snapshot.commissionXOF,
            sequenceNumber: seq++,
            referenceType: "HOLD_GROUP",
            referenceId: holdGroup.id,
            description: "Platform commission",
          });
        }

        if (snapshot.convenienceFeeXOF > 0) {
          engine.addCredit({
            accountId: platformConvenienceAcct.id,
            amount: snapshot.convenienceFeeXOF,
            sequenceNumber: seq++,
            referenceType: "HOLD_GROUP",
            referenceId: holdGroup.id,
            description: "Platform convenience fee",
          });
        }

        // We pass `tx` (the Prisma transaction client) so everything commits atomically.
        // Because `accountService` already ensured the accounts exist, locking them here is safe.
        // If a duplicate webhook hits this, `engine.commit` will throw a P2002 error safely aborting this transaction.
        engine.validate();
        await engine.commit(tx as any);
      }

      return updatedBookings;
    }, {
      maxWait: 5000,
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    } catch (error: any) {
      if (error.code === "P2002") {
        const existing = await this.prisma.booking.findMany({
          where: { holdGroupId: holdGroup.id, status: "CONFIRMED" },
        });
        if (existing.length > 0) {
          confirmed = existing;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const totalAmountXOF =
      holdGroup.pricingSnapshot?.chargeAmountXOF ??
      confirmed.reduce((sum, b) => sum + b.farePaid, 0);

    const result: ConfirmedBookingResult = {
      holdId: holdGroup.id,
      bookingReferences: confirmed.map((b) => b.bookingReference),
      ticketTokens: confirmed.map((b) => b.ticketToken),
      totalAmountXOF,
      status: "CONFIRMED",
    };

    void import("./booking-receipt-email").then(({ sendBookingConfirmedEmails }) =>
      sendBookingConfirmedEmails(this.prisma, result, userId).catch((error) => {
        console.error("Failed to send booking receipt email:", error);
      }),
    );

    return result;
  }

  async confirmFromWallet(
    holdGroupId: string,
    userId: string,
  ): Promise<ConfirmedBookingResult> {
    const holdGroup = await resolveHoldGroup(this.prisma, holdGroupId);

    if (holdGroup.status === "CONFIRMED") {
      return {
        holdId: holdGroup.id,
        bookingReferences: holdGroup.bookings.map((b) => b.bookingReference),
        ticketTokens: holdGroup.bookings.map((b) => b.ticketToken),
        totalAmountXOF:
          holdGroup.pricingSnapshot?.subtotalBaseXOF ??
          holdGroup.bookings.reduce((sum, b) => sum + b.farePaid, 0),
        status: "CONFIRMED",
      };
    }

    assertHoldGroupActive(holdGroup);

    const snapshot = holdGroup.pricingSnapshot;
    if (!snapshot) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Pricing snapshot missing for this hold",
      });
    }

    const totalToPay = snapshot.subtotalBaseXOF; // Zero convenience fee
    let confirmed;
    try {
      confirmed = await this.prisma.$transaction(async (tx) => {
      const accountService = new FinancialAccountService(tx as any);
      const walletAcct = await accountService.getUserWallet(userId);
      const operatorAcct = await accountService.getOperatorReceivableAccount(
        holdGroup.companyId,
      );
      const platformCommissionAcct =
        await accountService.getPlatformCommissionRevenueAccount();

      // Lock wallet inside the transaction (TOCTOU fix)
      const lockedWallet = await tx.$queryRaw<
        { available_balance: bigint | number }[]
      >(
        Prisma.sql`SELECT "availableBalance" as available_balance FROM "financial_account" WHERE id = ${walletAcct.id} FOR UPDATE`,
      );
      const available = BigInt(lockedWallet[0]?.available_balance ?? 0);
      if (available < BigInt(totalToPay)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient wallet balance",
        });
      }

      const updatedHold = await tx.holdGroup.updateMany({
        where: { id: holdGroup.id, status: "ACTIVE" },
        data: { status: "CONFIRMED" },
      });

      if (updatedHold.count === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Hold group is no longer active",
        });
      }

      const updatedBookings = [];
      for (const booking of holdGroup.bookings) {
        const claim = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: "PENDING_PAYMENT",
          },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            issuedAt: new Date(),
            holdExpiresAt: null,
            userId,
          },
        });
        if (claim.count === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Booking could not be confirmed",
          });
        }
        updatedBookings.push(
          await tx.booking.findUniqueOrThrow({ where: { id: booking.id } }),
        );
      }

      const engine = new AccountingEngine("BOOKING", {
        description: `Wallet payment for booking hold ${holdGroup.id}`,
        idempotencyKey: `WALLET_PAYMENT_${holdGroup.id}`,
      });

      let seq = 1;

      engine.addDebit({
        accountId: walletAcct.id,
        amount: totalToPay,
        sequenceNumber: seq++,
        referenceType: "HOLD_GROUP",
        referenceId: holdGroup.id,
        description: "Wallet balance checkout",
      });

      engine.addCredit({
        accountId: operatorAcct.id,
        amount: snapshot.operatorNetXOF,
        sequenceNumber: seq++,
        referenceType: "HOLD_GROUP",
        referenceId: holdGroup.id,
        description:
          "Operator ticket revenue net of commission (escrowed until departure)",
        reserveOnCredit: true,
      });

      const platformCommission = totalToPay - snapshot.operatorNetXOF;

      await tx.pricingSnapshot.update({
        where: { holdGroupId: holdGroup.id },
        data: {
          convenienceFeeXOF: 0,
          platformGrossXOF: platformCommission,
        },
      });

      if (platformCommission > 0) {
        engine.addCredit({
          accountId: platformCommissionAcct.id,
          amount: platformCommission,
          sequenceNumber: seq++,
          referenceType: "HOLD_GROUP",
          referenceId: holdGroup.id,
          description: "Platform commission",
        });
      }

      engine.validate();
      await engine.commit(tx as any);

      return updatedBookings;
    }, {
      maxWait: 5000,
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    } catch (error: any) {
      if (error.code === "P2002") {
        const existing = await this.prisma.booking.findMany({
          where: { holdGroupId: holdGroup.id, status: "CONFIRMED" },
        });
        if (existing.length > 0) {
          confirmed = existing;
        } else {
          throw error;
        }
      } else if (error.message && error.message.includes("Insufficient funds")) {
        // C7: Send the Novu alert if the row-level solvency check failed
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        });
        if (user?.email) {
          const novuSecret = process.env["NOVU_SECRET_KEY"];
          if (novuSecret) {
            try {
              const { Novu } = await import("@novu/api");
              const novu = new Novu({ secretKey: novuSecret });
              const walletAcctPreview = await this.accountService.getUserWallet(userId);
              void novu.trigger({
                workflowId: "passenger-wallet-low-balance",
                to: { subscriberId: user.email, email: user.email },
                payload: {
                  email: user.email,
                  passengerName: user.fullName ?? "Passenger",
                  availableBalanceXOF: toSafeDisplayNumber(walletAcctPreview.availableBalance),
                  requiredAmountXOF: Number(totalToPay),
                },
              }).catch(() => {});
            } catch (e) {
              console.error("Failed to trigger passenger-wallet-low-balance via Novu:", e);
            }
          }
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient wallet balance",
        });
      } else {
        throw error;
      }
    }

    const result: ConfirmedBookingResult = {
      holdId: holdGroup.id,
      bookingReferences: confirmed.map((b) => b.bookingReference),
      ticketTokens: confirmed.map((b) => b.ticketToken),
      totalAmountXOF: totalToPay,
      status: "CONFIRMED",
    };

    void import("./booking-receipt-email").then(({ sendBookingConfirmedEmails }) =>
      sendBookingConfirmedEmails(this.prisma, result, userId).catch((error) => {
        console.error("Failed to send booking receipt email:", error);
      }),
    );

    return result;
  }

  /**
   * Fix #2: Orphan Rescue
   * Called when a Paystack payment was captured but the booking hold has expired.
   * Credits the full captured amount to the passenger's wallet so their money is not lost.
   * Marks the hold as EXPIRED to prevent any future double-processing.
   */
  private async rescueOrphanedPayment(
    holdGroup: Awaited<ReturnType<typeof resolveHoldGroup>>,
    userId?: string | null,
  ): Promise<void> {
    const payment = holdGroup.payment!;
    const amountXOF = payment.amountXOF;
    const feesXOF = payment.feesXOF ?? 0;

    // Determine who to refund: passed userId, or the userId on the holdGroup itself
    const targetUserId = userId ?? (holdGroup as any).userId ?? null;

    if (!targetUserId) {
      // Guest booking with no account — log for manual review, do not throw
      console.error(
        `[rescueOrphanedPayment] Cannot auto-rescue: no userId for holdGroup ${holdGroup.id} ` +
        `(payment ${payment.id}, amount ${amountXOF} XOF). Manual intervention required.`
      );
      return;
    }

    // Idempotency: only run if hold is not yet expired or already rescued
    if (holdGroup.status === "EXPIRED") {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const clearingAcct = await this.accountService.getSystemPaystackClearingAccount();
      const passengerWallet = await this.accountService.getUserWallet(targetUserId);

      const engine = new AccountingEngine("ORPHANED_PAYMENT_RESCUE", {
        externalPaymentId: payment.id,
        description: `Rescued expired hold ${holdGroup.id} — full amount credited to passenger wallet`,
        metadata: { holdGroupId: holdGroup.id, originalPaymentId: payment.id },
      });

      let seq = 1;

      // Debit clearing (net of Paystack fees)
      engine.addDebit({
        accountId: clearingAcct.id,
        amount: amountXOF - feesXOF,
        sequenceNumber: seq++,
        referenceType: "HOLD_GROUP",
        referenceId: holdGroup.id,
        description: "Clearing debit for orphaned payment rescue",
      });

      // Debit processor fee account for the Paystack fees already incurred
      if (feesXOF > 0) {
        const processorFeeAcct = await this.accountService.getPaymentProcessorFeeAccount();
        engine.addDebit({
          accountId: processorFeeAcct.id,
          amount: feesXOF,
          sequenceNumber: seq++,
          description: "Paystack fee on orphaned payment",
        });
      }

      // Credit the full captured amount to the passenger wallet
      engine.addCredit({
        accountId: passengerWallet.id,
        amount: amountXOF,
        sequenceNumber: seq++,
        referenceType: "HOLD_GROUP",
        referenceId: holdGroup.id,
        description: "Wallet credit: expired hold rescue",
      });

      engine.validate();
      await engine.commit(tx as any);

      // Mark hold EXPIRED to prevent any future double-processing
      await tx.holdGroup.update({
        where: { id: holdGroup.id },
        data: { status: "EXPIRED" },
      });
    });
  }
}
