/**
 * Canonical cash payable after instruments + payment-method fee policy.
 * Use everywhere: search checkout UI, pending pay, wallet confirm gates.
 */
export type CheckoutPayableInput = {
  /** Post ticket-discount subtotal (before credits). */
  postDiscountSubtotalXOF: number;
  convenienceFeeXOF: number;
  ticketDiscountXOF?: number | undefined;
  feeDiscountXOF?: number | undefined;
  creditAppliedXOF: number;
  /** Full charge after credits (includes fee when not waived). */
  chargeAmountXOF: number;
  paymentMethod: "PAYSTACK" | "WALLET" | "ZERO_CASH";
};

export type CheckoutPayable = {
  /** Cash to collect from wallet/Paystack (0 = zero-cash confirm). */
  payableXOF: number;
  paymentMode: "PAYSTACK" | "WALLET" | "ZERO_CASH";
  /** Convenience fee shown for this payment method. */
  displayFeeXOF: number;
};

/**
 * Wallet and zero-cash waive convenience fee. Payable is max(0, post-discount
 * subtotal − credits) when fee waived, else chargeAmountXOF (already nets credits).
 */
export function resolveCheckoutPayable(input: CheckoutPayableInput): CheckoutPayable {
  const credit = Math.max(0, input.creditAppliedXOF);
  const postSub = Math.max(0, input.postDiscountSubtotalXOF);
  const waiveFee =
    input.paymentMethod === "WALLET" || input.paymentMethod === "ZERO_CASH";

  const displayFeeXOF = waiveFee ? 0 : Math.max(0, input.convenienceFeeXOF);
  const payableWithFee = Math.max(0, input.chargeAmountXOF);
  const payableWalletStyle = Math.max(0, postSub - credit);

  let payableXOF = waiveFee ? payableWalletStyle : payableWithFee;
  // Prefer server charge when fee-waived path would overstate (e.g. promo fee discounts)
  if (waiveFee) {
    const chargeMinusFee = Math.max(
      0,
      input.chargeAmountXOF - Math.max(0, input.convenienceFeeXOF),
    );
    payableXOF = Math.min(payableWalletStyle, chargeMinusFee);
  }

  if (payableXOF === 0) {
    return {
      payableXOF: 0,
      paymentMode: "ZERO_CASH",
      displayFeeXOF: 0,
    };
  }

  return {
    payableXOF,
    paymentMode: input.paymentMethod === "PAYSTACK" ? "PAYSTACK" : "WALLET",
    displayFeeXOF,
  };
}

/** Snapshot fields used by wallet / zero-cash confirmation. */
export function walletPayableFromSnapshot(snapshot: {
  chargeAmountXOF: number;
  convenienceFeeXOF: number;
  creditAppliedXOF?: number | null | undefined;
  subtotalBaseXOF?: number | null | undefined;
  postDiscountSubtotalXOF?: number | null | undefined;
}): number {
  const postSub =
    snapshot.postDiscountSubtotalXOF ??
    snapshot.subtotalBaseXOF ??
    Math.max(0, snapshot.chargeAmountXOF - snapshot.convenienceFeeXOF);
  const credit = snapshot.creditAppliedXOF ?? 0;
  const fromInstruments = Math.max(0, postSub - credit);
  const fromChargeMinusFee = Math.max(
    0,
    snapshot.chargeAmountXOF - snapshot.convenienceFeeXOF,
  );
  return Math.min(fromInstruments, fromChargeMinusFee);
}
