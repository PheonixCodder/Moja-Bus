import type { PaymentProvider } from "@moja/schemas/payments";

export type InitializePaymentInput = {
  holdGroupId: string;
  amountXOF: number;
  email: string;
  reference: string;
  metadata?: Record<string, unknown>;
  subaccountCode?: string | null;
};

export type InitializePaymentResult = {
  reference: string;
  accessCode: string;
  authorizationUrl: string;
};

export type VerifyPaymentResult = {
  status: "success" | "failed" | "pending";
  reference: string;
  amountXOF: number;
  channel: string | null;
  feesXOF: number | null;
};

export type RefundInput = {
  reference: string;
  amountXOF: number;
  reason?: string;
};

export type RefundResult = {
  status: "pending" | "processed" | "failed";
  refundId?: string;
};

export type WebhookPayload = {
  event: string;
  data: Record<string, unknown>;
};

export type CreateSubaccountInput = {
  businessName: string;
  settlementBankCode: string;
  accountNumber: string;
};

export type CreateSubaccountResult = {
  subaccountCode: string;
};

export interface PaymentProviderAdapter {
  id: PaymentProvider;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(reference: string): Promise<VerifyPaymentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  createSubaccount(input: CreateSubaccountInput): Promise<CreateSubaccountResult>;
  parseWebhook(rawBody: string, signature: string | null): WebhookPayload;
}

