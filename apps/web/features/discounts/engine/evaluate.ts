import {
  buildChargeQuote,
  instrumentFromCampaign,
  selectAutoApplyCampaign,
} from "./auto-apply";
import { computeTicketDiscount } from "./benefits";
import { checkCampaignEligibility } from "./eligibility";
import type {
  EvalCampaign,
  EvalContext,
  EvalCoupon,
  EvalCreditLot,
  EvalVoucher,
  QuoteResult,
  SelectedInstrument,
} from "./types";

export type EvaluateCheckoutDiscountsInput = {
  ctx: EvalContext;
  campaigns: EvalCampaign[];
  code?: string | undefined;
  coupon?: EvalCoupon | null | undefined;
  autoApply?: boolean | undefined;
  monetaryVoucher?: EvalVoucher | null | undefined;
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
        code: "CODE_EXPIRED",
        messageKey: "discounts.errors.codeExpired",
      });
    }
    if (
      input.coupon.assignedUserId &&
      input.coupon.assignedUserId !== input.ctx.userId
    ) {
      return emptyReject(input.ctx, {
        code: "CODE_PERSONAL",
        messageKey: "discounts.errors.codePersonal",
      });
    }
    if (
      input.coupon.maxRedemptions != null &&
      input.coupon.redemptionCount >= input.coupon.maxRedemptions
    ) {
      return emptyReject(input.ctx, {
        code: "CODE_EXHAUSTED",
        messageKey: "discounts.errors.codeExhausted",
      });
    }

    const campaign = input.campaigns.find(
      (c) => c.id === input.coupon!.campaignId,
    );
    if (!campaign) {
      return emptyReject(input.ctx, {
        code: "CAMPAIGN_MISSING",
        messageKey: "discounts.errors.campaignMissing",
      });
    }
    const reason = checkCampaignEligibility(campaign, input.ctx);
    if (reason) {
      return emptyReject(input.ctx, reason);
    }
    const ticketDiscountXOF = computeTicketDiscount(
      campaign,
      input.ctx.preDiscountSubtotalXOF,
      input.ctx.baseFareXOF,
    );
    if (ticketDiscountXOF <= 0) {
      return emptyReject(input.ctx, {
        code: "ZERO_DISCOUNT",
        messageKey: "discounts.errors.zeroDiscount",
      });
    }
    instruments.push(
      instrumentFromCampaign({
        campaign,
        ticketDiscountXOF,
        instrumentType: "COUPON_CODE",
        couponCodeId: input.coupon.id,
      }),
    );
  } else if (autoApply) {
    const { best, rejected } = selectAutoApplyCampaign(
      input.campaigns,
      input.ctx,
    );
    rejectedAlternatives.push(...rejected);
    if (best) {
      autoAppliedCampaignId = best.campaign.id;
      instruments.push(
        instrumentFromCampaign({
          campaign: best.campaign,
          ticketDiscountXOF: best.ticketDiscountXOF,
          instrumentType: "AUTO_PROMO",
        }),
      );
    }
  }

  // Monetary voucher — applies to remaining charge (entire cart by default)
  if (input.monetaryVoucher) {
    const v = input.monetaryVoucher;
    if (v.status !== "ACTIVE" && v.status !== "PARTIALLY_REDEEMED") {
      return emptyReject(input.ctx, {
        code: "VOUCHER_INACTIVE",
        messageKey: "discounts.errors.voucherInactive",
      });
    }
    if (v.expiresAt && v.expiresAt.getTime() < input.ctx.now.getTime()) {
      return emptyReject(input.ctx, {
        code: "VOUCHER_EXPIRED",
        messageKey: "discounts.errors.voucherExpired",
      });
    }
    const available = Math.max(0, v.remainingAmountXOF - v.reservedAmountXOF);
    if (available <= 0) {
      return emptyReject(input.ctx, {
        code: "VOUCHER_EMPTY",
        messageKey: "discounts.errors.voucherEmpty",
      });
    }

    const interim = buildChargeQuote({ ctx: input.ctx, instruments });
    const applyToFees = (v.applyTarget ?? "ENTIRE_CHARGE") === "ENTIRE_CHARGE";
    let feeDiscountXOF = 0;
    let ticketDiscountXOF = 0;
    let remaining = available;

    if (applyToFees) {
      // Prefer covering ticket remainder first, then fees
      const ticketNeed = interim.postDiscountSubtotalXOF;
      ticketDiscountXOF = Math.min(remaining, ticketNeed);
      remaining -= ticketDiscountXOF;
      feeDiscountXOF = Math.min(remaining, interim.convenienceFeeXOF);
    } else {
      ticketDiscountXOF = Math.min(remaining, interim.postDiscountSubtotalXOF);
    }

    instruments.push({
      instrumentType: "MONETARY_VOUCHER",
      voucherId: v.id,
      ticketDiscountXOF,
      feeDiscountXOF,
      creditAppliedXOF: 0,
      fundingType: "PLATFORM",
      platformFundedXOF: ticketDiscountXOF + feeDiscountXOF,
      operatorFundedXOF: 0,
      stackGroup: "VOUCHER_PAY",
    });
  }

  if (input.useCredits !== false && input.creditLots?.length) {
    const interim = buildChargeQuote({ ctx: input.ctx, instruments });
    let need = interim.provisionalChargeXOF;
    if (input.creditAmountXOF != null) {
      need = Math.min(need, input.creditAmountXOF);
    }
    const lots = input.creditLots
      .filter((l) => l.status === "ACTIVE" || l.status === "PARTIALLY_REDEEMED")
      .filter(
        (l) => !l.expiresAt || l.expiresAt.getTime() >= input.ctx.now.getTime(),
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
