/**
 * Split snapshot payment-instrument totals into lot credits vs voucher burn.
 * Freeze stores creditAppliedXOF as lots + voucher for payable math; breakdown
 * (discountBreakdownJson) keeps the split when present.
 */
export function splitPromoPaymentInstruments(snapshot: {
  creditAppliedXOF?: number | null;
  discountBreakdownJson?: unknown;
}): { creditAppliedXOF: number; voucherAppliedXOF: number } {
  const breakdown = snapshot.discountBreakdownJson as
    | {
        creditAppliedXOF?: number;
        voucherAppliedXOF?: number;
      }
    | null
    | undefined;

  if (
    breakdown &&
    typeof breakdown.voucherAppliedXOF === "number" &&
    typeof breakdown.creditAppliedXOF === "number"
  ) {
    return {
      creditAppliedXOF: Math.max(0, breakdown.creditAppliedXOF),
      voucherAppliedXOF: Math.max(0, breakdown.voucherAppliedXOF),
    };
  }

  return {
    creditAppliedXOF: Math.max(0, snapshot.creditAppliedXOF ?? 0),
    voucherAppliedXOF: 0,
  };
}
