import type { PaymentProvider } from "@moja/schemas/payments";

export type InitializePaymentInput = {
  holdGroupId: string;
  amountXOF: number;
  email: string;
  reference: string;
  metadata?: Record<string, unknown>;
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

export type CreateTransferRecipientInput = {
  businessName: string;
  bankCode: string;
  accountNumber: string;
};

export type CreateTransferRecipientResult = {
  recipientCode: string;
};

export type InitiateTransferInput = {
  amountXOF: number;
  recipientCode: string;
  reason: string;
  reference?: string;
};

export type InitiateTransferResult = {
  transferCode: string;
  status: string;
  fee: number;
};

export interface PaymentProviderAdapter {
  id: PaymentProvider;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(reference: string): Promise<VerifyPaymentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  createTransferRecipient(input: CreateTransferRecipientInput): Promise<CreateTransferRecipientResult>;
  initiateTransfer(input: InitiateTransferInput): Promise<InitiateTransferResult>;
  parseWebhook(rawBody: string, signature: string | null): WebhookPayload;
}

