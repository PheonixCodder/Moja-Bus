import type { PaymentProvider } from "@moja/schemas/payments";

export type PaymentInitiateResult = {
  paymentIds: string[];
  status: "PAID" | "PENDING" | "FAILED";
  redirectUrl?: string;
};

export interface PaymentProviderAdapter {
  id: PaymentProvider;
  initiate(input: {
    bookingId: string;
    amountXOF: number;
    reference: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentInitiateResult>;
}
