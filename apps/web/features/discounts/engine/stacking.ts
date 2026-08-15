import type { EvalCampaign, SelectedInstrument } from "./types";

/** Payment-like instruments that may combine with a ticket promo. */
export const CREDIT_STACK_GROUPS = new Set(["CREDIT", "VOUCHER_PAY"]);

export function pickBestCampaign(
  candidates: Array<{ campaign: EvalCampaign; ticketDiscountXOF: number }>,
): { campaign: EvalCampaign; ticketDiscountXOF: number } | null {
  if (candidates.length === 0) return null;
  return candidates.toSorted((a, b) => {
    if (b.ticketDiscountXOF !== a.ticketDiscountXOF) {
      return b.ticketDiscountXOF - a.ticketDiscountXOF;
    }
    if (b.campaign.priority !== a.campaign.priority) {
      return b.campaign.priority - a.campaign.priority;
    }
    const aEnd = a.campaign.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bEnd = b.campaign.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
    return aEnd - bEnd;
  })[0]!;
}

/**
 * FAQ default: at most one ticket promo (coupon or auto).
 * Credits / monetary voucher payment portions are separate instruments.
 */
export function canStackTicketPromos(
  existing: SelectedInstrument[],
  incomingStackGroup: string,
): boolean {
  if (CREDIT_STACK_GROUPS.has(incomingStackGroup)) return true;
  const hasTicketPromo = existing.some(
    (i) =>
      (i.instrumentType === "COUPON_CODE" ||
        i.instrumentType === "AUTO_PROMO") &&
      !CREDIT_STACK_GROUPS.has(i.stackGroup ?? "PROMO"),
  );
  return !hasTicketPromo;
}
