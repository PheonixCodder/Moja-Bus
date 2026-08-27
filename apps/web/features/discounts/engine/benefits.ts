import type { EvalCampaign } from "./types";
import { roundXOF } from "./types";

export function computeTicketDiscount(
  campaign: EvalCampaign,
  preDiscountSubtotalXOF: number,
  baseFareXOF: number,
): number {
  let raw = 0;
  switch (campaign.benefitType) {
    case "PERCENT_OFF":
      raw = roundXOF(
        (preDiscountSubtotalXOF * (campaign.percentBps ?? 0)) / 10_000,
      );
      break;
    case "FIXED_AMOUNT_OFF":
      raw = campaign.amountXOF ?? 0;
      break;
    case "FREE_SEAT":
      raw = baseFareXOF * (campaign.freeSeatCount ?? 0);
      break;
    default:
      raw = 0;
  }

  raw = Math.min(raw, preDiscountSubtotalXOF);
  if (campaign.maxDiscountPerBookingXOF != null) {
    raw = Math.min(raw, campaign.maxDiscountPerBookingXOF);
  }

  if (campaign.budgetXOF != null) {
    const remaining =
      campaign.budgetXOF -
      campaign.budgetConsumedXOF -
      campaign.budgetReservedXOF;
    raw = Math.min(raw, Math.max(0, remaining));
  }

  return Math.max(0, raw);
}

/** Fee portion when campaign.applyTarget is ENTIRE_CHARGE (P1-14 / P3-2). */
export function feeDiscountForCampaign(
  campaign: EvalCampaign,
  ticketDiscountXOF: number,
  convenienceFeeXOF: number,
): number {
  if (campaign.applyTarget !== "ENTIRE_CHARGE" || convenienceFeeXOF <= 0) {
    return 0;
  }
  if (campaign.benefitType === "PERCENT_OFF") {
    return Math.min(
      convenienceFeeXOF,
      roundXOF((convenienceFeeXOF * (campaign.percentBps ?? 0)) / 10_000),
    );
  }
  if (campaign.benefitType === "FIXED_AMOUNT_OFF") {
    const remaining = Math.max(
      0,
      (campaign.amountXOF ?? 0) - ticketDiscountXOF,
    );
    return Math.min(convenienceFeeXOF, remaining);
  }
  return 0;
}

export function splitFunding(
  campaign: EvalCampaign,
  ticketDiscountXOF: number,
): { platformFundedXOF: number; operatorFundedXOF: number } {
  if (ticketDiscountXOF <= 0) {
    return { platformFundedXOF: 0, operatorFundedXOF: 0 };
  }
  if (campaign.fundingType === "PLATFORM") {
    return { platformFundedXOF: ticketDiscountXOF, operatorFundedXOF: 0 };
  }
  if (campaign.fundingType === "OPERATOR") {
    return { platformFundedXOF: 0, operatorFundedXOF: ticketDiscountXOF };
  }
  const platformFundedXOF = roundXOF(
    (ticketDiscountXOF * campaign.platformShareBps) / 10_000,
  );
  return {
    platformFundedXOF,
    operatorFundedXOF: ticketDiscountXOF - platformFundedXOF,
  };
}
