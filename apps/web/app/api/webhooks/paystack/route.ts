import { getPrismaClient } from "@moja/db";
import { PaymentService } from "@/features/payments/payment-service";
import { verifyPaystackSignature } from "@/features/payments/providers/paystack-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return Response.json({ message: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    event: string;
    data: {
      reference?: string;
      id?: number;
      status?: string;
      amount?: number;
      channel?: string;
      fees?: number;
    };
  };

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const paymentService = new PaymentService(prisma);

  try {
    await paymentService.handleWebhookEvent(payload);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return Response.json({ message: "Webhook processing failed" }, { status: 500 });
  }
}
