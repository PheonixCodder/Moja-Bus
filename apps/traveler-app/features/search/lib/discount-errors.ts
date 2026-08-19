type TFn = (key: any) => string;

/**
 * Maps every server-emitted discountRejection.messageKey to an i18n key in the
 * booking namespace. Falls back to the generic applyFailed string.
 *
 * Keep in sync with the discount engine's rejection codes in:
 *   apps/web/features/discounts/engine/eligibility.ts
 */
const REJECTION_KEY_MAP: Record<string, string> = {
  "discounts.errors.invalidCode":     "booking:errInvalidCode",
  "discounts.errors.codeExpired":     "booking:errCodeExpired",
  "discounts.errors.codePersonal":    "booking:errCodePersonal",
  "discounts.errors.codeExhausted":   "booking:errCodeExhausted",
  "discounts.errors.campaignMissing": "booking:errCampaignMissing",
  "discounts.errors.zeroDiscount":    "booking:errZeroDiscount",
  "discounts.errors.inactive":        "booking:errInactive",
  "discounts.errors.wrongOperator":   "booking:errWrongOperator",
  "discounts.errors.noOptIn":         "booking:errNoOptIn",
  "discounts.errors.routeScope":      "booking:errRouteScope",
  "discounts.errors.scheduleScope":   "booking:errScheduleScope",
  "discounts.errors.tripScope":       "booking:errTripScope",
  "discounts.errors.budget":          "booking:errBudget",
};

export function resolveDiscountRejectionMessage(
  messageKey: string | undefined | null,
  t: TFn,
): string {
  if (!messageKey) return t("booking:applyFailed");
  const mapped = REJECTION_KEY_MAP[messageKey];
  return mapped ? t(mapped) : t("booking:applyFailed");
}
