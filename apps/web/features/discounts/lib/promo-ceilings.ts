/** FAQ / Terms: max active promotional vouchers per traveler. */
export const MAX_PROMOTIONAL_VOUCHERS_PER_USER = 3;

/** Sources that count toward the promotional voucher ceiling. */
export const PROMOTIONAL_VOUCHER_SOURCES = [
  "MARKETING_GRANT",
  "GOODWILL",
  "ADMIN_MANUAL",
  "REFERRAL_REWARD",
] as const;

export type PromotionalVoucherSource =
  (typeof PROMOTIONAL_VOUCHER_SOURCES)[number];

export function isPromotionalVoucherSource(
  source: string,
): source is PromotionalVoucherSource {
  return (PROMOTIONAL_VOUCHER_SOURCES as readonly string[]).includes(source);
}
