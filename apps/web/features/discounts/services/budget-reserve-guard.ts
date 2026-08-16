/**
 * Pure predicate mirroring freeze SQL (P1-19 / P2-7).
 * Concurrent freezes must only succeed while reserved+consumed+amount <= budget.
 */
export function canReserveCampaignBudget(input: {
  budgetXOF: number | null;
  budgetConsumedXOF: number;
  budgetReservedXOF: number;
  amountXOF: number;
}): boolean {
  if (input.amountXOF <= 0) return true;
  if (input.budgetXOF == null) return true;
  return (
    input.budgetConsumedXOF + input.budgetReservedXOF + input.amountXOF <=
    input.budgetXOF
  );
}

export function canIncrementCouponRedemption(input: {
  maxRedemptions: number | null;
  redemptionCount: number;
}): boolean {
  if (input.maxRedemptions == null) return true;
  return input.redemptionCount < input.maxRedemptions;
}
