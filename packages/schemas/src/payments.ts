export type PaymentProvider =
  | "WAVE"
  | "ORANGE_MONEY"
  | "MOOV"
  | "MTN_MOMO"
  | "CARD"
  | "CINETPAY";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface PaymentIntent {
  paymentId: string;
  bookingId: string;
  provider: PaymentProvider;
  amount: number;
  currency: "XOF";
  status: PaymentStatus;
}
