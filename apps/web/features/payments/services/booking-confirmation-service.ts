import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { ConfirmedBookingResult } from "@moja/types";
import {
  assertHoldGroupActive,
  resolveHoldGroup,
} from "../lib/resolve-hold-group";
import { AccountingEngine, FinancialAccountService } from "@moja/db";

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

    assertHoldGroupActive(holdGroup);

    const confirmed = await this.prisma.$transaction(async (tx) => {
      const updatedBookings = [];
      for (const booking of holdGroup.bookings) {
        updatedBookings.push(
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              issuedAt: new Date(),
              holdExpiresAt: null,
              ...(userId ? { userId } : {}),
            },
          }),
        );
      }

      await tx.holdGroup.update({
        where: { id: holdGroup.id },
        data: { status: "CONFIRMED" },
      });

      const snapshot = holdGroup.pricingSnapshot;
      if (snapshot && snapshot.operatorNetXOF > 0) {
        const existingLedger = await tx.financialTransaction.findFirst({
          where: {
            externalPaymentId: holdGroup.payment!.id,
            type: "BOOKING"
          },
        });

        if (!existingLedger) {
          // New Financial Core Write (Double-Entry Ledger)
          // Provision/fetch accounts
          const clearingAcct = await this.accountService.getSystemPaystackClearingAccount();
          const operatorAcct = await this.accountService.getOperatorReceivableAccount(holdGroup.companyId);
          const platformAcct = await this.accountService.getPlatformRevenueAccount();

          // Post the double-entry transaction
          const engine = new AccountingEngine("BOOKING", {
            externalPaymentId: holdGroup.payment!.id,
            description: `Payment for booking hold ${holdGroup.id}`,
          });

          let seq = 1;
          
          engine.addDebit({
            accountId: clearingAcct.id,
            amount: snapshot.chargeAmountXOF,
            sequenceNumber: seq++,
            referenceType: "HOLD_GROUP",
            referenceId: holdGroup.id,
            description: "Funds received from Paystack",
          });

          engine.addCredit({
            accountId: operatorAcct.id,
            amount: snapshot.operatorNetXOF,
            sequenceNumber: seq++,
            referenceType: "HOLD_GROUP",
            referenceId: holdGroup.id,
            description: "Operator ticket revenue net of commission",
          });

          if (snapshot.platformGrossXOF > 0) {
            engine.addCredit({
              accountId: platformAcct.id,
              amount: snapshot.platformGrossXOF,
              sequenceNumber: seq++,
              referenceType: "HOLD_GROUP",
              referenceId: holdGroup.id,
              description: "Platform commission and convenience fees",
            });
          }

          // We pass `tx` (the Prisma transaction client) so everything commits atomically.
          // Because `accountService` already ensured the accounts exist, locking them here is safe.
          engine.validate();
          await engine.commit(tx as any);
        }
      }

      return updatedBookings;
    });

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

    const walletAcct = await this.accountService.getUserWallet(userId);
    const totalToPay = snapshot.subtotalBaseXOF; // Zero convenience fee

    if (walletAcct.availableBalance < totalToPay) {
      // Trigger passenger-wallet-low-balance
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
            await novu.trigger({
              workflowId: "passenger-wallet-low-balance",
              to: {
                subscriberId: user.email,
                email: user.email,
              },
              payload: {
                email: user.email,
                passengerName: user.fullName ?? "Passenger",
                availableBalanceXOF: Number(walletAcct.availableBalance),
                requiredAmountXOF: Number(totalToPay),
              },
            }).catch(() => {});
          } catch (err) {
            console.error("Failed to trigger passenger-wallet-low-balance via Novu:", err);
          }
        }
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient wallet balance",
      });
    }

    const confirmed = await this.prisma.$transaction(async (tx) => {
      const updatedBookings = [];
      for (const booking of holdGroup.bookings) {
        updatedBookings.push(
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              issuedAt: new Date(),
              holdExpiresAt: null,
              userId,
            },
          }),
        );
      }

      await tx.holdGroup.update({
        where: { id: holdGroup.id },
        data: { status: "CONFIRMED" },
      });

      const operatorAcct = await this.accountService.getOperatorReceivableAccount(holdGroup.companyId);
      const platformAcct = await this.accountService.getPlatformRevenueAccount();

      const engine = new AccountingEngine("BOOKING", {
        description: `Wallet payment for booking hold ${holdGroup.id}`,
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
        description: "Operator ticket revenue net of commission",
      });

      const platformCommission = totalToPay - snapshot.operatorNetXOF;
      if (platformCommission > 0) {
        engine.addCredit({
          accountId: platformAcct.id,
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
    });

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
}
