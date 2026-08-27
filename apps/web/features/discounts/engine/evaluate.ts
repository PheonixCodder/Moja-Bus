import {
  buildChargeQuote,
  instrumentFromCampaign,
  selectAutoApplyCampaign,
} from "./auto-apply";
import { computeTicketDiscount, splitFunding } from "./benefits";
import { checkCampaignEligibility } from "./eligibility";
import type {
  EvalCampaign,
  EvalContext,
  EvalCoupon,
  EvalCreditLot,
  QuoteResult,
  SelectedInstrument,
} from "./types";

export type EvaluateCheckoutDiscountsInput = {
  ctx: EvalContext;
  campaigns: EvalCampaign[];
  code?: string | undefined;
  coupon?: EvalCoupon | null | undefined;
  autoApply?: boolean | undefined;
  creditLots?: EvalCreditLot[] | undefined;
  useCredits?: boolean | undefined;
  creditAmountXOF?: number | undefined;
};

/**
 * Pure discount evaluation — no DB writes.
 * User-entered valid code overrides auto-apply (plan lock).
 */
export function evaluateCheckoutDiscounts(
  input: EvaluateCheckoutDiscountsInput,
): QuoteResult {
  const autoApply = input.autoApply ?? true;
  const instruments: SelectedInstrument[] = [];
  let autoAppliedCampaignId: string | null = null;
  const rejectedAlternatives: QuoteResult["rejectedAlternatives"] = [];

  if (input.code) {
    if (!input.coupon || !input.coupon.isActive) {
      return emptyReject(input.ctx, {
        code: "INVALID_CODE",
        messageKey: "discounts.errors.invalidCode",
      });
    }
    if (
      input.coupon.expiresAt &&
      input.coupon.expiresAt.getTime() < input.ctx.now.getTime()
    ) {
      return emptyReject(input.ctx, {
        code: "COUPON_EXPIRED",
        messageKey: "discounts.errors.couponExpired",
      });
    }
    if (
      input.coupon.maxRedemptions != null &&
      input.coupon.redemptionCount >= input.coupon.maxRedemptions
    ) {
      return emptyReject(input.ctx, {
        code: "COUPON_DEPLETED",
        messageKey: "discounts.errors.couponDepleted",
      });
    }
    if (
      input.coupon.assignedUserId &&
      input.coupon.assignedUserId !== input.ctx.userId
    ) {
      return emptyReject(input.ctx, {
        code: "COUPON_WRONG_USER",
        messageKey: "discounts.errors.couponWrongUser",
      });
    }

    const campaign = input.campaigns.find(
      (c) => c.id === input.coupon!.campaignId,
    );
    if (!campaign) {
      return emptyReject(input.ctx, {
        code: "CAMPAIGN_NOT_FOUND",
        messageKey: "discounts.errors.campaignNotFound",
      });
    }

    const elig = checkCampaignEligibility(campaign, input.ctx);
    if (elig) {
      return emptyReject(input.ctx, elig);
    }

    const ticketDiscountXOF = computeTicketDiscount(
      campaign,
      input.ctx.preDiscountSubtotalXOF,
      input.ctx.baseFareXOF,
    );
    const split = splitFunding(campaign, ticketDiscountXOF);

    instruments.push({
      instrumentType: "COUPON_CODE",
      campaignId: campaign.id,
      couponCodeId: input.coupon.id,
      ticketDiscountXOF,
      feeDiscountXOF: 0,
      creditAppliedXOF: 0,
      fundingType: campaign.fundingType,
      platformFundedXOF: split.platformFundedXOF,
      operatorFundedXOF: split.operatorFundedXOF,
      stackGroup: "PROMO_PRIMARY",
      priority: 0,
      label: input.coupon.code,
    });
  } else if (autoApply) {
    const selected = selectAutoApplyCampaign(input.campaigns, input.ctx);
    if (selected.best) {
      autoAppliedCampaignId = selected.best.campaign.id;
      const inst = instrumentFromCampaign({
        campaign: selected.best.campaign,
        ticketDiscountXOF: selected.best.ticketDiscountXOF,
        instrumentType: "AUTO_PROMO",
      });
      instruments.push(inst);

      for (const rej of selected.rejected) {
        rejectedAlternatives.push({
          campaignId: rej.campaignId,
          reason: rej.reason,
        });
      }
    }
  }

  if (input.useCredits !== false && input.creditLots?.length) {
    const ticketPromoBlocksCredit = instruments.some((inst) => {
      if (
        inst.instrumentType !== "COUPON_CODE" &&
        inst.instrumentType !== "AUTO_PROMO"
      ) {
        return false;
      }
      const camp = input.campaigns.find((c) => c.id === inst.campaignId);
      return camp != null && camp.allowCombineWithCredit === false;
    });

    if (!ticketPromoBlocksCredit) {
      const interim = buildChargeQuote({ ctx: input.ctx, instruments });
      let need = interim.provisionalChargeXOF;
      if (input.creditAmountXOF != null) {
        need = Math.min(need, input.creditAmountXOF);
      }
      const lots = input.creditLots
        .filter(
          (l) => l.status === "ACTIVE" || l.status === "PARTIALLY_REDEEMED",
        )
        .filter(
          (l) =>
            !l.expiresAt || l.expiresAt.getTime() >= input.ctx.now.getTime(),
        )
        .toSorted((a, b) => {
          const ae = a.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
          const be = b.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
          return ae - be;
        });

      for (const lot of lots) {
        if (need <= 0) break;
        const available = Math.max(0, lot.remainingXOF - lot.reservedXOF);
        const use = Math.min(available, need);
        if (use <= 0) continue;
        instruments.push({
          instrumentType: "CREDIT_LOT",
          creditLotId: lot.id,
          ticketDiscountXOF: 0,
          feeDiscountXOF: 0,
          creditAppliedXOF: use,
          platformFundedXOF: 0,
          operatorFundedXOF: 0,
          stackGroup: "CREDIT",
        });
        need -= use;
      }
    }
  }

  const quote = buildChargeQuote({ ctx: input.ctx, instruments });
  return {
    ok: true,
    ...quote,
    autoAppliedCampaignId,
    rejectedAlternatives,
  };
}

function emptyReject(
  ctx: EvalContext,
  rejection: QuoteResult["rejection"],
): QuoteResult {
  const quote = buildChargeQuote({ ctx, instruments: [] });
  return {
    ok: false,
    rejection,
    ...quote,
    autoAppliedCampaignId: null,
    rejectedAlternatives: [],
  };
}

export * from "./types";
export * from "./eligibility";
export * from "./benefits";
export * from "./stacking";
export * from "./auto-apply";
