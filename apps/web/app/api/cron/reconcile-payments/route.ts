import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { PaymentService } from "@/features/payments/payment-service";
import { paystackVerifyTransfer } from "@/features/payments/providers/paystack-client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Verify cron secret if in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env["CRON_SECRET"]}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
          if (payment.paystackReference) {
            const result = await paymentService.handleWebhookEvent({
              event: "charge.success",
              data: {
                reference: payment.paystackReference,
              },
            });
            return result.handled;
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
