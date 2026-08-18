/**
 * Extract snapshot payment-instrument total for promo credits.
 */
export function splitPromoPaymentInstruments(snapshot: {
  creditAppliedXOF?: number | null;
}): { creditAppliedXOF: number } {
  return {
    creditAppliedXOF: Math.max(0, snapshot.creditAppliedXOF ?? 0),
  };
}
