import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { PaymentService } from "@/features/payments/payment-service";
import {
  paystackVerifyTransfer,
  paystackVerify,
} from "@/features/payments/providers/paystack-client";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  const paymentService = new PaymentService(prisma);

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  try {
    let reconciledCount = 0;

    // 1. Operator Payouts Reconciler (Parallelized)
    const pendingWithdrawals = await prisma.financialTransaction.findMany({
      where: {
        type: "OPERATOR_PAYOUT",
        status: { in: ["CREATED", "POSTED"] },
        createdAt: { lt: fiveMinutesAgo },
      },
    });

    if (pendingWithdrawals.length > 0) {
      const withdrawalResults = await Promise.allSettled(
        pendingWithdrawals.map(async (tx) => {
          const result = await paystackVerifyTransfer(tx.id);
          if (result.status !== "pending") {
            const eventMap = {
              success: "transfer.success",
              failed: "transfer.failed",
              reversed: "transfer.reversed",
            } as const;

            const payloadData: any = {
              reference: tx.id,
            };
            if (result.transferCode) {
              payloadData.transfer_code = result.transferCode;
            }
            if (result.id != null) {
              payloadData.id = result.id;
            }
            payloadData.reason = result.reason || "Reconciled via Cron";

            const payload = {
              event: eventMap[result.status as keyof typeof eventMap],
              data: payloadData,
            };

            await paymentService.handleWebhookEvent(payload as any);
            return true;
          }
          return false;
        })
      );

      reconciledCount += withdrawalResults.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
    }

    // 2. Passenger Charge / Wallet Top-up Reconciler (Parallelized)
    const pendingCharges = await prisma.externalPayment.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: fiveMinutesAgo },
      },
    });

    if (pendingCharges.length > 0) {
      const chargeResults = await Promise.allSettled(
        pendingCharges.map(async (payment) => {
          if (!payment.paystackReference) return false;

          const verified = await paystackVerify(payment.paystackReference);
          // Audit trail: record every reference we verified and its status
          // so a reconciliation run is fully reconstructable.
          console.error(
            `[reconcile-payments] verified ${payment.paystackReference}: ${verified.status}`,
          );
          if (verified.status === "success") {
            const result = await paymentService.handleWebhookEvent({
              event: "charge.success",
              data: {
                reference: payment.paystackReference,
                status: "success",
                amount: verified.amountXOF * 100,
              },
            });
            return result.handled;
          }
          if (verified.status === "failed") {
            // M16: a definitively failed charge must not leave a dangling hold.
            // Mark the payment failed and expire the associated hold so the
            // seats are released (the passenger can re-book). We do NOT confirm
            // the booking, and we never invent a `charge.success` event.
            await prisma.$transaction(async (tx) => {
              await tx.externalPayment.update({
                where: { id: payment.id },
                data: { status: "FAILED" },
              });
              if (payment.holdGroupId) {
                await tx.booking.updateMany({
                  where: {
                    holdGroupId: payment.holdGroupId,
                    status: "PENDING_PAYMENT",
                  },
                  data: { status: "EXPIRED", holdExpiresAt: new Date() },
                });
              }
            });
            return true;
          }
          return false;
        })
      );

      reconciledCount += chargeResults.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
    }

    return NextResponse.json({ success: true, reconciledCount });
  } catch (error) {
    console.error("Reconciliation cron execution failed:", error);
    return NextResponse.json({ error: "Reconciliation failed" }, { status: 500 });
  }
}
