export type CancellationRefundChannel = "CASH" | "WALLET" | "PAYSTACK";

export function refundStatusForCancellationChannel(
  channel: CancellationRefundChannel,
) {
  return channel === "CASH" ? "PENDING_FULFILMENT" : "COMPLETED";
}

export function canPassengerSelfCancelWithChannel(
  channel: CancellationRefundChannel,
) {
  return channel === "WALLET" || channel === "PAYSTACK";
}

export function shouldOpenPaystackForPendingPay(input: {
  paymentMethod: "PAYSTACK" | "WALLET";
  chargeAmountXOF: number;
}) {
  return input.paymentMethod === "PAYSTACK" && input.chargeAmountXOF > 0;
}
