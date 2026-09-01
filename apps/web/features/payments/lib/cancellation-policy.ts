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
 * P2-12 & Wave 1 Security Fix: Single source of truth for refund math.
 * Consumed by BOTH the cancellation service (execution) and the passenger
 * refund-quote preview, preventing promo-to-cash laundering.
 */
export interface RefundQuoteInput {
  farePaid: number;
  pricingSnapshot: {
    seatCount: number;
    subtotalBaseXOF: number;
    operatorNetXOF: number;
    chargeAmountXOF?: number | null;
    creditAppliedXOF?: number | null;
    ticketDiscountXOF?: number | null;
    commissionXOF?: number | null;
    convenienceFeeXOF?: number | null;
    postDiscountSubtotalXOF?: number | null;
    platformPromoFundedXOF?: number | null;
    operatorPromoFundedXOF?: number | null;
  } | null;
  /** Seats already cancelled in the same hold group BEFORE this one. */
  cancelledSoFar: number;
  platformCommissionBps: number;
}

export interface RefundQuoteResult {
  /** Cash refund amount to Moja Wallet or offline cash reimbursement (excludes non-refundable convenience fee). */
  refundAmountXOF: number;
  /** Cash portion paid by the passenger to be returned to Moja Wallet. */
  cashRefundXOF: number;
  /** Promo credits portion to be restored to user's credit balance. */
  creditRestoreXOF: number;
  /** Operator net revenue to claw back from escrow/receivable. */
  operatorNetXOF: number;
  /** Platform commission revenue to claw back. */
  commissionXOF: number;
}

export function computeRefundQuote(input: RefundQuoteInput): RefundQuoteResult {
  const { farePaid, pricingSnapshot, cancelledSoFar } = input;

  if (!pricingSnapshot || pricingSnapshot.seatCount <= 0) {
    const commission = Math.round(
      (farePaid * input.platformCommissionBps) / 10_000,
    );
    const net = Math.max(0, farePaid - commission);
    return {
      refundAmountXOF: Math.max(0, farePaid),
      cashRefundXOF: Math.max(0, farePaid),
      creditRestoreXOF: 0,
      operatorNetXOF: net,
      commissionXOF: Math.max(0, farePaid - net),
    };
  }

  const seatCount = pricingSnapshot.seatCount;
  const isLastSeat = cancelledSoFar + 1 === seatCount;

  // Calculate total cash pool collected for the ticket portion across the hold group (convenience fee is non-refundable).
  const postDiscountSubtotal =
    pricingSnapshot.postDiscountSubtotalXOF ??
    Math.max(
      0,
      pricingSnapshot.subtotalBaseXOF -
        (pricingSnapshot.ticketDiscountXOF ?? 0),
    );
  const totalCreditPool = Math.max(0, pricingSnapshot.creditAppliedXOF ?? 0);
  const totalCashPool = Math.max(
    0,
    postDiscountSubtotal - totalCreditPool,
  );

  // Proportional allocation per seat with dust absorption on the last seat.
  const standardCash = Math.round(totalCashPool / seatCount);
  const cashRefundXOF = isLastSeat
    ? Math.max(0, totalCashPool - cancelledSoFar * standardCash)
    : standardCash;

  const standardCredit = Math.round(totalCreditPool / seatCount);
  const creditRestoreXOF = isLastSeat
    ? Math.max(0, totalCreditPool - cancelledSoFar * standardCredit)
    : standardCredit;

  const standardNet = Math.round(pricingSnapshot.operatorNetXOF / seatCount);
  const operatorNetXOF = isLastSeat
    ? Math.max(
        0,
        pricingSnapshot.operatorNetXOF - cancelledSoFar * standardNet,
      )
    : standardNet;

  const totalCommissionPool =
    pricingSnapshot.commissionXOF ??
    Math.max(0, pricingSnapshot.subtotalBaseXOF - pricingSnapshot.operatorNetXOF);
  const standardCommission = Math.round(totalCommissionPool / seatCount);
  const commissionXOF = isLastSeat
    ? Math.max(
        0,
        totalCommissionPool - cancelledSoFar * standardCommission,
      )
    : standardCommission;

  return {
    refundAmountXOF: cashRefundXOF,
    cashRefundXOF,
    creditRestoreXOF,
    operatorNetXOF,
    commissionXOF,
  };
}

