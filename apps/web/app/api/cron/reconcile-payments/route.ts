import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { PaymentService } from "@/features/payments/payment-service";
import { expireOrReleaseHold } from "@/features/payments/services/expire-or-release-hold";
import {
  paystackVerifyTransfer,
  paystackVerify,
} from "@/features/payments/providers/paystack-client";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";

const MAX_PARALLEL = 5;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map(fn));
    results.push(...settled);
  }
  return results;
}

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  const paymentService = new PaymentService(prisma);

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  try {
    let reconciledCount = 0;

    const pendingWithdrawals = await prisma.financialTransaction.findMany({
      where: {
        type: "OPERATOR_PAYOUT",
        status: { in: ["CREATED", "POSTED"] },
        createdAt: { lt: fiveMinutesAgo },
      },
      take: 40,
    });

    if (pendingWithdrawals.length > 0) {
      const withdrawalResults = await mapPool(
        pendingWithdrawals,
        MAX_PARALLEL,
        async (tx) => {
          const result = await paystackVerifyTransfer(tx.id);
          if (result.status !== "pending") {
            const eventMap = {
              success: "transfer.success",
              failed: "transfer.failed",
              reversed: "transfer.reversed",
            } as const;

            const payloadData: Record<string, unknown> = {
              reference: tx.id,
            };
            if (result.transferCode) {
              payloadData["transfer_code"] = result.transferCode;
            }
            if (result.id != null) {
              payloadData["id"] = result.id;
            }
            payloadData["reason"] = result.reason || "Reconciled via Cron";

            await paymentService.handleWebhookEvent({
              event: eventMap[result.status as keyof typeof eventMap],
              data: payloadData as {
                reference?: string;
                id?: number;
                status?: string;
              },
            });
            return true;
          }
          return false;
        },
      );

      reconciledCount += withdrawalResults.filter(
        (r) => r.status === "fulfilled" && r.value,
      ).length;
    }

    const pendingCharges = await prisma.externalPayment.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: fiveMinutesAgo },
      },
      take: 40,
    });

    if (pendingCharges.length > 0) {
      const chargeResults = await mapPool(
        pendingCharges,
        MAX_PARALLEL,
        async (payment) => {
          if (!payment.paystackReference) return false;

          const verified = await paystackVerify(payment.paystackReference);
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
            await prisma.externalPayment.update({
              where: { id: payment.id },
              data: { status: "FAILED" },
            });
            await prisma.paymentEvent.create({
              data: {
                paymentId: payment.id,
                eventType: "RECONCILE_FAILED",
                payload: {
                  reference: payment.paystackReference,
                  purpose: payment.purpose,
                  holdGroupId: payment.holdGroupId,
                },
              },
            });
            if (payment.holdGroupId) {
              await expireOrReleaseHold(prisma, {
                holdGroupId: payment.holdGroupId,
                reason: "RECONCILE_FAILED",
                force: true,
              });
            }
            return true;
          }
          return false;
        },
      );

      reconciledCount += chargeResults.filter(
        (r) => r.status === "fulfilled" && r.value,
      ).length;
    }

    return NextResponse.json({ success: true, reconciledCount });
  } catch (error) {
    console.error("Reconciliation cron execution failed:", error);
    return NextResponse.json(
      { error: "Reconciliation failed" },
      { status: 500 },
    );
  }
}
