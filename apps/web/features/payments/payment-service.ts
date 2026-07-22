import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import type { PaymentProvider } from "@moja/schemas/payments";
import { getOptionalEnv } from "@moja/config";
import {
  assertHoldGroupActive,
  resolveHoldGroup,
} from "./lib/resolve-hold-group";
import {
  buildPaystackReference,
  isPaystackConfigured,
  paystackInitialize,
  paystackPublicKey,
  paystackVerify,
} from "./providers/paystack-client";
import { BookingConfirmationService } from "./services/booking-confirmation-service";
import { AccountingEngine, FinancialAccountService } from "@moja/db";
import { toSafeDisplayNumber } from "@/lib/money";
import { getNovuClient } from "@/lib/novu";

export type InitiatePaymentResult = {
  holdGroupId: string;
  paymentId: string;
  provider: PaymentProvider;
  status: "PENDING" | "SUCCESS";
  amountXOF: number;
  convenienceFeeXOF: number;
  subtotalBaseXOF: number;
  paystack?: {
    publicKey: string;
    reference: string;
    accessCode: string;
    authorizationUrl: string;
    email: string;
  };
};

export class PaymentService {
  constructor(
    private prisma: PrismaClient,
    private confirmationService = new BookingConfirmationService(prisma),
  ) {}

  async initiateForHold(
    holdId: string,
    payerEmail?: string | null,
  ): Promise<InitiatePaymentResult> {
    const holdGroup = await resolveHoldGroup(this.prisma, holdId);
    assertHoldGroupActive(holdGroup);

    const snapshot = holdGroup.pricingSnapshot;
    if (!snapshot) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Pricing snapshot missing for this hold",
      });
    }

    if (!isPaystackConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Paystack is not configured. Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.",
      });
    }

    return this.initiatePaystack(holdGroup, snapshot, payerEmail);
  }

  private async initiatePaystack(
    holdGroup: Awaited<ReturnType<typeof resolveHoldGroup>>,
    snapshot: NonNullable<
      Awaited<ReturnType<typeof resolveHoldGroup>>["pricingSnapshot"]
    >,
    payerEmail?: string | null,
  ): Promise<InitiatePaymentResult> {
    const email =
      payerEmail?.trim() ||
      holdGroup.bookings[0]?.passengerPhone.replace(/\s+/g, "") + "@guest.mojaride.ci";

    const payment = await this.prisma.externalPayment.findUnique({
      where: { holdGroupId: holdGroup.id },
      include: { attempts: { orderBy: { attemptNumber: "desc" }, take: 1 } },
    });

    let paymentRecord = payment;
    let attemptNumber = 1;

    if (paymentRecord) {
      if (paymentRecord.status === "SUCCESS") {
        return {
          holdGroupId: holdGroup.id,
          paymentId: paymentRecord.id,
          provider: "PAYSTACK",
          status: "SUCCESS",
          amountXOF: snapshot.chargeAmountXOF,
          convenienceFeeXOF: snapshot.convenienceFeeXOF,
          subtotalBaseXOF: snapshot.subtotalBaseXOF,
        };
      }
      attemptNumber = (paymentRecord.attempts[0]?.attemptNumber ?? 0) + 1;
    } else {
      paymentRecord = await this.prisma.externalPayment.create({
        data: {
          holdGroupId: holdGroup.id,
          provider: "PAYSTACK",
          amountXOF: snapshot.chargeAmountXOF,
          status: "INITIALIZED",
        },
        include: { attempts: true },
      });
    }

    const reference = buildPaystackReference(holdGroup.id, attemptNumber);
    const callbackUrl =
      getOptionalEnv("NEXT_PUBLIC_APP_URL") != null
        ? `${getOptionalEnv("NEXT_PUBLIC_APP_URL")}/api/payments/verify?holdGroupId=${holdGroup.id}`
        : undefined;

    const initialized = await paystackInitialize({
      email,
      amountXOF: snapshot.chargeAmountXOF,
      reference,
      metadata: {
        holdGroupId: holdGroup.id,
        offerId: holdGroup.offerId,
      },
      ...(callbackUrl ? { callbackUrl } : {}),
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.create({
        data: {
          paymentId: paymentRecord!.id,
          attemptNumber,
          paystackReference: reference,
          status: "PENDING",
          metadata: { accessCode: initialized.accessCode },
        },
      });

      await tx.externalPayment.update({
        where: { id: paymentRecord!.id },
        data: {
          status: "PENDING",
          paystackReference: reference,
          metadata: {
            authorizationUrl: initialized.authorizationUrl,
            accessCode: initialized.accessCode,
          },
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: paymentRecord!.id,
          eventType: "INITIALIZED",
          payload: { reference, amountXOF: snapshot.chargeAmountXOF },
        },
      });
    });

    return {
      holdGroupId: holdGroup.id,
      paymentId: paymentRecord.id,
      provider: "PAYSTACK",
      status: "PENDING",
      amountXOF: snapshot.chargeAmountXOF,
      convenienceFeeXOF: snapshot.convenienceFeeXOF,
      subtotalBaseXOF: snapshot.subtotalBaseXOF,
      paystack: {
        publicKey: paystackPublicKey(),
        reference,
        accessCode: initialized.accessCode,
        authorizationUrl: initialized.authorizationUrl,
        email,
      },
    };
  }

  async verifyAndConfirm(
    reference: string,
    userId?: string | null,
  ): Promise<import("@moja/types").ConfirmedBookingResult> {
    const payment = await this.prisma.externalPayment.findFirst({
      where: { paystackReference: reference },
      include: { holdGroup: true },
    });

    if (!payment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment reference not found",
      });
    }

    if (payment.status === "SUCCESS") {
      if (!payment.holdGroupId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Missing hold group ID" });
      }
      return this.confirmationService.confirmFromPayment(
        payment.holdGroupId,
        userId,
      );
    }

    const verified = await paystackVerify(reference);

    if (verified.status !== "success") {
      await this.prisma.externalPayment.update({
        where: { id: payment.id },
        data: { status: verified.status === "failed" ? "FAILED" : "PENDING" },
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment verification failed or is still pending",
      });
    }

    if (verified.amountXOF !== payment.amountXOF) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment amount mismatch",
      });
    }

    if (!payment.holdGroupId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Missing hold group ID" });
    }

    await this.markPaymentSuccess(payment.id, verified);
    return this.confirmationService.confirmFromPayment(
      payment.holdGroupId,
      userId,
    );
  }

  async verifyTopUp(reference: string): Promise<{ success: boolean }> {
    const payment = await this.prisma.externalPayment.findFirst({
      where: { paystackReference: reference },
    });

    if (!payment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment reference not found",
      });
    }

    if (payment.status === "SUCCESS") {
      return { success: true };
    }

    const verified = await paystackVerify(reference);
    if (verified.status === "success") {
      await this.markPaymentSuccess(payment.id, verified);
      if ((payment.metadata as any)?.isTopUp) {
        await this.processTopUp(payment);
      }
      return { success: true };
    }

    return { success: false };
  }

  async handleWebhookEvent(payload: {
    event: string;
    data: {
      reference?: string;
      id?: number;
      status?: string;
      amount?: number;
      channel?: string;
      fees?: number;
    };
  }) {
    const reference = payload.data.reference;
    if (!reference) return { handled: false };

    const idempotencyKey = `${payload.event}:${reference}:${payload.data.id ?? ""}`;

    const existing = await this.prisma.webhookEvent.findUnique({
      where: { idempotencyKey },
    });
    if (existing?.processedAt) {
      return { handled: true, duplicate: true };
    }

    await this.prisma.webhookEvent.upsert({
      where: { idempotencyKey },
      create: {
        provider: "PAYSTACK",
        eventType: payload.event,
        idempotencyKey,
        reference,
        payload: payload as object,
      },
      update: {},
    });

    if (
      payload.event === "transfer.success" ||
      payload.event === "transfer.failed" ||
      payload.event === "transfer.reversed"
    ) {
      await this.handleTransferWebhook(payload);
      await this.prisma.webhookEvent.update({
        where: { idempotencyKey },
        data: { processedAt: new Date() },
      });
      return { handled: true };
    }

    if (payload.event !== "charge.success") {
      await this.prisma.webhookEvent.update({
        where: { idempotencyKey },
        data: { processedAt: new Date() },
      });
      return { handled: true };
    }

    const payment = await this.prisma.externalPayment.findFirst({
      where: { paystackReference: reference },
    });

    if (!payment) {
      await this.prisma.webhookEvent.update({
        where: { idempotencyKey },
        data: {
          processedAt: new Date(),
          error: "Payment not found for reference",
        },
      });
      return { handled: false };
    }

    if (payment.status !== "SUCCESS") {
      const verified = await paystackVerify(reference);
      if (verified.status === "success") {
        await this.markPaymentSuccess(payment.id, verified);
        if (payment.holdGroupId) {
          await this.confirmationService.confirmFromPayment(payment.holdGroupId);
        } else if ((payment.metadata as any)?.isTopUp) {
          await this.processTopUp(payment);
        }
      }
    } else {
      if (payment.holdGroupId) {
        await this.confirmationService.confirmFromPayment(payment.holdGroupId);
      } else if ((payment.metadata as any)?.isTopUp) {
        // already processed if success, but we can make processTopUp idempotent
        await this.processTopUp(payment);
      }
    }

    await this.prisma.webhookEvent.update({
      where: { idempotencyKey },
      data: { processedAt: new Date() },
    });

    return { handled: true };
  }

  private async handleTransferWebhook(payload: any) {
    const reference = payload.data.reference; // This is the TxID of the original FinancialTransaction
    if (!reference) return;

    const tx = await this.prisma.financialTransaction.findUnique({
      where: { id: reference },
      include: { entries: true },
    });

    if (!tx) return;

    if (payload.event === "transfer.success") {
      if (tx.status !== "SETTLED") {
        await this.prisma.financialTransaction.update({
          where: { id: tx.id },
          data: { status: "SETTLED" },
        });
      }
    } else if (payload.event === "transfer.failed" || payload.event === "transfer.reversed") {
      if (tx.status !== "FAILED" && tx.status !== "REVERSED") {
        // Reverse the ledger entries
        await this.prisma.$transaction(async (prismaTx) => {
          try {
          const engine = new AccountingEngine("PAYOUT_REVERSAL", {
            ...(tx.externalPaymentId ? { externalPaymentId: tx.externalPaymentId } : {}),
            description: `Reversal for failed transfer ${reference}`,
            metadata: { originalTxId: reference, reason: payload.data.reason, paystackRef: payload.data.transfer_code ?? payload.data.id?.toString() },
          });

          // Original: DEBIT Operator Liability, CREDIT System Asset
          // Reversal: CREDIT Operator Liability, DEBIT System Asset
          for (const entry of tx.entries) {
            if (entry.side === "DEBIT") {
              engine.addCredit({
                accountId: entry.accountId,
                amount: toSafeDisplayNumber(entry.amount),
                sequenceNumber: entry.sequenceNumber,
              });
            } else {
              engine.addDebit({
                accountId: entry.accountId,
                amount: toSafeDisplayNumber(entry.amount),
                sequenceNumber: entry.sequenceNumber,
              });
            }
          }

          await engine.commit(prismaTx as any);

          // Fix #4: Also reverse the PAYMENT_PROCESSOR_FEE transaction for this transfer.
          // The fee was recorded in a separate $transaction in requestWithdrawal, keyed by
          // the same externalPaymentId (the Paystack transfer code). Without this, the
          // processor fee account accumulates phantom debits on every failed payout.
          if (tx.externalPaymentId) {
            const feeTx = await prismaTx.financialTransaction.findFirst({
              where: {
                type: "PAYMENT_PROCESSOR_FEE",
                externalPaymentId: tx.externalPaymentId,
                status: { notIn: ["FAILED", "REVERSED"] },
              },
              include: { entries: true },
            });

            if (feeTx && feeTx.entries.length > 0) {
              const feeReverseEngine = new AccountingEngine("PAYOUT_FEE_REVERSAL", {
                ...(tx.externalPaymentId ? { externalPaymentId: tx.externalPaymentId } : {}),
                description: `Fee reversal for failed transfer ${reference}`,
                metadata: { originalFeeTxId: feeTx.id, originalPayoutTxId: reference },
              });

              for (const entry of feeTx.entries) {
                if (entry.side === "DEBIT") {
                  feeReverseEngine.addCredit({
                    accountId: entry.accountId,
                    amount: toSafeDisplayNumber(entry.amount),
                    sequenceNumber: entry.sequenceNumber,
                  });
                } else {
                  feeReverseEngine.addDebit({
                    accountId: entry.accountId,
                    amount: toSafeDisplayNumber(entry.amount),
                    sequenceNumber: entry.sequenceNumber,
                  });
                }
              }

              await feeReverseEngine.commit(prismaTx as any);

              await prismaTx.financialTransaction.update({
                where: { id: feeTx.id },
                data: { status: "REVERSED" },
              });
            }
          }

          await prismaTx.financialTransaction.update({
            where: { id: tx.id },
            data: { status: "FAILED" },
          });
          } catch (err: any) {
            // The (externalPaymentId, type) unique constraint on FinancialTransaction makes a
            // payout reversal exactly-once. A concurrent transfer.failed webhook, or the reconcile
            // cron's synthetic event, that won the race has already reversed the payout; treat the
            // collision as idempotent instead of surfacing a 500.
            if (err?.code === "P2002") return;
            throw err;
          }
        });
      }
    }

    // Trigger Novu payout settlement/failure notifications
    const meta = tx.metadata as any;
    if (meta && meta.requestedBy && meta.bankAccountId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: meta.requestedBy },
          select: { email: true, fullName: true, phone: true },
        });
        const bankAccount = await this.prisma.bankAccount.findUnique({
          where: { id: meta.bankAccountId },
          include: { company: true },
        });

        if (user?.email && bankAccount) {
          const novu = getNovuClient();
          if (novu) {
            const amountXOF = tx.entries[0] ? toSafeDisplayNumber(tx.entries[0].amount) : 0;
            const phone = user.phone?.replace(/\s+/g, "");

            if (payload.event === "transfer.success") {
              await novu.trigger({
                workflowId: "operator-withdrawal-settled",
                to: {
                  subscriberId: user.email,
                  email: user.email,
                },
                payload: {
                  email: user.email,
                  ownerName: user.fullName ?? "Operator Owner",
                  companyName: bankAccount.company.name,
                  amountXOF,
                  bankName: bankAccount.bankName,
                  accountNumberLast4: bankAccount.accountNumberLast4,
                  transactionId: tx.id,
                  settledAt: new Date().toLocaleString("en-CI"),
                  ...(phone ? { phone } : {}),
                },
                transactionId: `withdrawal-settled-${tx.id}`,
              });
            } else if (payload.event === "transfer.failed" || payload.event === "transfer.reversed") {
              await novu.trigger({
                workflowId: "operator-withdrawal-failed",
                to: {
                  subscriberId: user.email,
                  email: user.email,
                },
                payload: {
                  email: user.email,
                  ownerName: user.fullName ?? "Operator Owner",
                  companyName: bankAccount.company.name,
                  amountXOF,
                  bankName: bankAccount.bankName,
                  accountNumberLast4: bankAccount.accountNumberLast4,
                  transactionId: tx.id,
                  reason: payload.data.reason || "Bank transaction rejected by destination network",
                  ...(phone ? { phone } : {}),
                },
                transactionId: `withdrawal-failed-${tx.id}`,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to trigger operator-withdrawal notification via Novu:", error);
      }
    }
  }

  private async processTopUp(payment: any) {
    const meta = payment.metadata as any;
    if (!meta || !meta.accountId) return;
    
    // Make sure we haven't already posted this top up. We check if there's a transaction.
    const existingTx = await this.prisma.financialTransaction.findFirst({
      where: { externalPaymentId: payment.id, type: "TOP_UP" },
    });

    if (existingTx) return;

    const accountService = new FinancialAccountService(this.prisma);
    const clearingAcct = await accountService.getSystemPaystackClearingAccount();
    const processorFeeAcct = await accountService.getPaymentProcessorFeeAccount();

    let posted = false;
    await this.prisma.$transaction(async (tx) => {
      const engine = new AccountingEngine("TOP_UP", {
        externalPaymentId: payment.id,
        description: `Wallet top up via Paystack`,
      });

      const feesXOF = payment.feesXOF ?? 0;
      let seq = 1;

      engine.addDebit({
        accountId: clearingAcct.id,
        amount: payment.amountXOF - feesXOF,
        sequenceNumber: seq++,
        referenceType: "PAYMENT_ID",
        referenceId: payment.id,
        description: "Funds received from Paystack net of fees",
      });

      if (feesXOF > 0) {
        engine.addDebit({
          accountId: processorFeeAcct.id,
          amount: feesXOF,
          sequenceNumber: seq++,
          referenceType: "PAYMENT_ID",
          referenceId: payment.id,
          description: "Paystack processing fees",
        });
      }

      engine.addCredit({
        accountId: meta.accountId,
        amount: payment.amountXOF,
        sequenceNumber: seq++,
        referenceType: "PAYMENT_ID",
        referenceId: payment.id,
        description: "Wallet top up",
      });

      engine.validate();
      try {
        await engine.commit(tx as any);
        posted = true;
      } catch (err: any) {
        // The (externalPaymentId, type) unique constraint on FinancialTransaction makes a
        // TOP_UP exactly-once. A concurrent/duplicate delivery that won the race has already
        // credited the wallet; treat the collision as idempotent success (not a 500).
        if (err?.code === "P2002") return;
        throw err;
      }
    });

    // Duplicate delivery: the wallet was already credited by a concurrent call.
    if (!posted) return;

    if (meta.userId) {
      const novu = getNovuClient();
      if (novu) {
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: meta.userId },
            select: { email: true, fullName: true },
          });
          if (user?.email) {
            await novu.trigger({
              workflowId: "passenger-wallet-topup",
              to: {
                subscriberId: user.email,
                email: user.email,
              },
              payload: {
                email: user.email,
                passengerName: user.fullName ?? "Traveler",
                amountXOF: payment.amountXOF,
                transactionId: payment.id,
                paymentMethod: payment.channel || "Paystack",
              },
              transactionId: `wallet-topup-${payment.id}`,
            });
          }
        } catch (error) {
          console.error("Failed to trigger passenger-wallet-topup via Novu:", error);
        }
      }
    }
  }

  private async markPaymentSuccess(
    paymentId: string,
    verified: Awaited<ReturnType<typeof paystackVerify>>,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const existingPayment = await tx.externalPayment.findUnique({
        where: { id: paymentId },
        select: { metadata: true }
      });
      const existingMeta = (existingPayment?.metadata as object) || {};

      await tx.externalPayment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESS",
          channel: verified.channel,
          feesXOF: verified.feesXOF,
          confirmedAt: verified.paidAt ? new Date(verified.paidAt) : new Date(),
          metadata: { ...existingMeta, verifyRaw: verified.raw as object },
        },
      });

      await tx.paymentAttempt.updateMany({
        where: { paystackReference: verified.reference },
        data: { status: "SUCCESS", channel: verified.channel },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId,
          eventType: "VERIFIED_SUCCESS",
          payload: {
            reference: verified.reference,
            amountXOF: verified.amountXOF,
            channel: verified.channel,
          },
        },
      });
    });
  }

  async assertHoldPaid(holdId: string) {
    const holdGroup = await resolveHoldGroup(this.prisma, holdId);
    if (!holdGroup.payment || holdGroup.payment.status !== "SUCCESS") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment has not been completed for this hold",
      });
    }
  }

  async getPricingPreview(input: {
    baseFareXOF: number;
    seatCount: number;
    distanceKm: number | null;
  }) {
    const { loadPlatformSettings, resolvePricing } = await import(
      "./lib/pricing-resolver"
    );
    const { settings, tiers } = await loadPlatformSettings(this.prisma);
    return resolvePricing({
      baseFareXOF: input.baseFareXOF,
      seatCount: input.seatCount,
      distanceKm: input.distanceKm,
      settings,
      tiers,
    });
  }
}
