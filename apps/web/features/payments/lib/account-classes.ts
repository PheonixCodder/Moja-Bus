/**
 * Ledger accountClass string constants.
 * FinancialAccount.accountClass is data-driven (String), not a Prisma enum.
 */
export const ACCOUNT_CLASS = {
  PASSENGER_WALLET: "PASSENGER_WALLET",
  OPERATOR_RECEIVABLE: "OPERATOR_RECEIVABLE",
  PAYSTACK_CLEARING: "PAYSTACK_CLEARING",
  PLATFORM_FEES: "PLATFORM_FEES",
  PROMO_CREDITS: "PROMO_CREDITS",
  PROMO_LIABILITY_PLATFORM: "PROMO_LIABILITY_PLATFORM",
  PROMO_EXPENSE_PLATFORM: "PROMO_EXPENSE_PLATFORM",
  PROMO_CONTRA_OPERATOR: "PROMO_CONTRA_OPERATOR",
  VOUCHER_LIABILITY: "VOUCHER_LIABILITY",
  /** Liability: cash/voucher passenger reimbursement owed offline (not card return). */
  OFFLINE_REFUND_PAYABLE: "OFFLINE_REFUND_PAYABLE",
} as const;

export type AccountClass = (typeof ACCOUNT_CLASS)[keyof typeof ACCOUNT_CLASS];
