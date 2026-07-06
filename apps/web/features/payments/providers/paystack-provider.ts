import { getRequiredEnv } from "@moja/config";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProviderAdapter,
  RefundInput,
  RefundResult,
  VerifyPaymentResult,
  WebhookPayload,
} from "../types";
import {
  paystackInitialize,
  paystackVerify,
  verifyPaystackSignature,
} from "./paystack-client";

export class PaystackProvider implements PaymentProviderAdapter {
  id = "PAYSTACK" as const;

  async initialize(
    input: InitializePaymentInput,
  ): Promise<InitializePaymentResult> {
    return paystackInitialize({
      email: input.email,
      amountXOF: input.amountXOF,
      reference: input.reference,
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.subaccountCode ? { subaccountCode: input.subaccountCode } : {}),
    });
  }

  async verify(reference: string): Promise<VerifyPaymentResult> {
    return paystackVerify(reference);
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const secret = getRequiredEnv("PAYSTACK_SECRET_KEY");

    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: input.reference,
        amount: input.amountXOF * 100,
        merchant_note: input.reason,
      }),
    });

    const json = (await res.json()) as {
      status?: boolean;
      data?: { id: number; status: string };
      message?: string;
    };

    if (!res.ok || !json.status || !json.data) {
      throw new Error(json.message ?? "Paystack refund failed");
    }

    return {
      status: json.data.status === "processed" ? "processed" : "pending",
      refundId: String(json.data.id),
    };
  }

  parseWebhook(rawBody: string, signature: string | null): WebhookPayload {
    if (!verifyPaystackSignature(rawBody, signature)) {
      throw new Error("Invalid Paystack webhook signature");
    }
    return JSON.parse(rawBody) as WebhookPayload;
  }
}
