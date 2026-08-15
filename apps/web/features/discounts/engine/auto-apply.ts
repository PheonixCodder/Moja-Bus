import { computeTicketDiscount, splitFunding } from "./benefits";
import { checkCampaignEligibility } from "./eligibility";
import { pickBestCampaign } from "./stacking";
import type {
  EvalCampaign,
  EvalContext,
  QuoteResult,
  RejectionReason,
  SelectedInstrument,
} from "./types";
import { roundXOF } from "./types";

export function selectAutoApplyCampaign(
  campaigns: EvalCampaign[],
  ctx: EvalContext,
): {
  best: { campaign: EvalCampaign; ticketDiscountXOF: number } | null;
  rejected: Array<{ campaignId: string; reason: RejectionReason }>;
} {
  const rejected: Array<{ campaignId: string; reason: RejectionReason }> = [];
  const eligible: Array<{ campaign: EvalCampaign; ticketDiscountXOF: number }> =
    [];

  for (const campaign of campaigns) {
    if (!campaign.isAutoApply) continue;
    const reason = checkCampaignEligibility(campaign, ctx);
    if (reason) {
      rejected.push({ campaignId: campaign.id, reason });
      continue;
    }
    const ticketDiscountXOF = computeTicketDiscount(
      campaign,
      ctx.preDiscountSubtotalXOF,
      ctx.baseFareXOF,
    );
    if (ticketDiscountXOF <= 0) {
      rejected.push({
        campaignId: campaign.id,
        reason: {
          code: "ZERO_DISCOUNT",
          messageKey: "discounts.errors.zeroDiscount",
        },
      });
      continue;
    }
    eligible.push({ campaign, ticketDiscountXOF });
  }

  return { best: pickBestCampaign(eligible), rejected };
}

export function instrumentFromCampaign(input: {
  campaign: EvalCampaign;
  ticketDiscountXOF: number;
  instrumentType: "COUPON_CODE" | "AUTO_PROMO";
  couponCodeId?: string;
}): SelectedInstrument {
  const funding = splitFunding(input.campaign, input.ticketDiscountXOF);
  return {
    instrumentType: input.instrumentType,
    campaignId: input.campaign.id,
    couponCodeId: input.couponCodeId,
    ticketDiscountXOF: input.ticketDiscountXOF,
    feeDiscountXOF: 0,
    creditAppliedXOF: 0,
    fundingType: input.campaign.fundingType,
    platformFundedXOF: funding.platformFundedXOF,
    operatorFundedXOF: funding.operatorFundedXOF,
    stackGroup: input.campaign.stackGroup,
    priority: input.campaign.priority,
  };
}

export function buildChargeQuote(input: {
  ctx: EvalContext;
  instruments: SelectedInstrument[];
}): Omit<QuoteResult, "ok" | "rejection" | "rejectedAlternatives" | "autoAppliedCampaignId"> {
  const ticketDiscountXOF = input.instruments.reduce(
    (sum, i) => sum + i.ticketDiscountXOF,
    0,
  );
  const postDiscountSubtotalXOF = Math.max(
    0,
    input.ctx.preDiscountSubtotalXOF - ticketDiscountXOF,
  );
  const convenienceFeeXOF = input.ctx.waiveConvenienceFee
    ? 0
    : roundXOF(
        (postDiscountSubtotalXOF * input.ctx.convenienceFeeBps) / 10_000,
      );

  let feeDiscountXOF = input.instruments.reduce(
    (sum, i) => sum + i.feeDiscountXOF,
    0,
  );
  feeDiscountXOF = Math.min(feeDiscountXOF, convenienceFeeXOF);

  const provisionalChargeXOF =
    postDiscountSubtotalXOF + convenienceFeeXOF - feeDiscountXOF;

  let creditAppliedXOF = input.instruments.reduce(
    (sum, i) => sum + i.creditAppliedXOF,
    0,
  );
  creditAppliedXOF = Math.min(creditAppliedXOF, provisionalChargeXOF);

  return {
    instruments: input.instruments,
    ticketDiscountXOF,
    feeDiscountXOF,
    creditAppliedXOF,
    preDiscountSubtotalXOF: input.ctx.preDiscountSubtotalXOF,
    postDiscountSubtotalXOF,
    convenienceFeeXOF,
    provisionalChargeXOF,
    chargeAmountXOF: provisionalChargeXOF - creditAppliedXOF,
    platformFundedXOF: input.instruments.reduce(
      (s, i) => s + i.platformFundedXOF,
      0,
    ),
    operatorFundedXOF: input.instruments.reduce(
      (s, i) => s + i.operatorFundedXOF,
      0,
    ),
  };
}
