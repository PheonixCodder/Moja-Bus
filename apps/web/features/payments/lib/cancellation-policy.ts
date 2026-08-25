export type CancellationRefundChannel = "CASH" | "WALLET" | "PAYSTACK";

/**
 * F-PS-02 (ratified): PAYSTACK is not a creatable refund channel — platform
 * money never flows back out through Paystack. Refunds are instant Moja
 * wallet credit (WALLET) or manual settlement booked as an offline
 * obligation (CASH). The enum value remains only for historical rows.
 */
export type CreatableRefundChannel = Exclude<
  CancellationRefundChannel,
  "PAYSTACK"
>;

export function isCreatableRefundChannel(
  channel: CancellationRefundChannel,
): channel is CreatableRefundChannel {
  return channel !== "PAYSTACK";
}

export function refundStatusForCancellationChannel(
  channel: CreatableRefundChannel,
) {
  return channel === "CASH" ? "PENDING_FULFILMENT" : "COMPLETED";
}

export function canPassengerSelfCancelWithChannel(
  channel: CancellationRefundChannel,
) {
  // Passenger self-cancel credits their own Moja wallet. Manual settlement
  // (CASH) is operator-initiated; PAYSTACK is dead per F-PS-02.
  return channel === "WALLET";
}

export function shouldOpenPaystackForPendingPay(input: {
  paymentMethod: "PAYSTACK" | "WALLET";
  chargeAmountXOF: number;
}) {
  return input.paymentMethod === "PAYSTACK" && input.chargeAmountXOF > 0;
}

/**
 * P2-12 — single source of truth for refund math. Consumed by BOTH the
 * cancellation service (execution) and the passenger refund-quote preview,
 * so the dialog can never drift from what the service actually pays.
 */
export interface RefundQuoteInput {
  farePaid: number;
  pricingSnapshot: {
    seatCount: number;
    subtotalBaseXOF: number;
    operatorNetXOF: number;
  } | null;
  /** Seats already cancelled in the same hold group BEFORE this one. */
  cancelledSoFar: number;
  platformCommissionBps: number;
}

export function computeRefundQuote(input: RefundQuoteInput): {
  refundAmountXOF: number;
  operatorNetXOF: number;
  commissionXOF: number;
} {
  const { farePaid, pricingSnapshot, cancelledSoFar } = input;

  let proportionalBase = farePaid;
  let proportionalOperatorNet = farePaid;

  if (pricingSnapshot) {
    const isLastSeat = cancelledSoFar + 1 === pricingSnapshot.seatCount;
    const standardBase = Math.round(
      pricingSnapshot.subtotalBaseXOF / pricingSnapshot.seatCount,
    );
    const standardNet = Math.round(
      pricingSnapshot.operatorNetXOF / pricingSnapshot.seatCount,
    );

    proportionalBase = isLastSeat
      ? pricingSnapshot.subtotalBaseXOF - cancelledSoFar * standardBase
      : standardBase;

    proportionalOperatorNet = isLastSeat
      ? pricingSnapshot.operatorNetXOF - cancelledSoFar * standardNet
      : standardNet;
  } else {
    const commission = Math.round(
      (proportionalBase * input.platformCommissionBps) / 10_000,
    );
    proportionalOperatorNet = Math.max(0, proportionalBase - commission);
  }

  // D2 policy: ticket subtotal share only — convenience fee is never refunded.
  const refundAmountXOF = Math.max(0, proportionalBase);
  const net = Math.max(0, proportionalOperatorNet);

  return {
    refundAmountXOF,
    operatorNetXOF: net,
    commissionXOF: Math.max(0, refundAmountXOF - net),
  };
}
