import {
  buildChargeQuote,
  instrumentFromCampaign,
  selectAutoApplyCampaign,
} from "./auto-apply";
import { computeTicketDiscount, feeDiscountForCampaign, splitFunding } from "./benefits";
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

  // ENTIRE_CHARGE: fee discount before voucher/credits so payable is correct.
  {
    const interim = buildChargeQuote({ ctx: input.ctx, instruments });
    for (const inst of instruments) {
      if (
        (inst.instrumentType !== "COUPON_CODE" &&
          inst.instrumentType !== "AUTO_PROMO") ||
        !inst.campaignId
      ) {
        continue;
      }
      const camp = input.campaigns.find((c) => c.id === inst.campaignId);
      if (!camp) continue;
      const feePart = feeDiscountForCampaign(
        camp,
        inst.ticketDiscountXOF,
        interim.convenienceFeeXOF,
      );
      if (feePart > 0) {
        inst.feeDiscountXOF = feePart;
        const funding = splitFunding(camp, feePart);
        inst.platformFundedXOF += funding.platformFundedXOF;
        inst.operatorFundedXOF += funding.operatorFundedXOF;
      }
    }
  }

  // Monetary voucher — payment instrument (liability burn), not platform expense.
  // Soft-fail: invalid voucher does not wipe coupon/auto already selected.
  let voucherRejection: QuoteResult["voucherRejection"];
  if (input.monetaryVoucher) {
    const v = input.monetaryVoucher;
    let reason: QuoteResult["rejection"] | null = null;
    if (v.status !== "ACTIVE" && v.status !== "PARTIALLY_REDEEMED") {
      reason = {
        code: "VOUCHER_INACTIVE",
        messageKey: "discounts.errors.voucherInactive",
      };
    } else if (v.expiresAt && v.expiresAt.getTime() < input.ctx.now.getTime()) {
      reason = {
        code: "VOUCHER_EXPIRED",
        messageKey: "discounts.errors.voucherExpired",
      };
    } else if (
      v.scheduleId &&
      (input.ctx.scheduleId == null || v.scheduleId !== input.ctx.scheduleId)
    ) {
      reason = {
        code: "VOUCHER_SCHEDULE_MISMATCH",
        messageKey: "discounts.errors.voucherScheduleMismatch",
      };
    } else if (
      v.companyId &&
      v.companyId !== input.ctx.companyId
    ) {
      reason = {
        code: "VOUCHER_COMPANY_MISMATCH",
        messageKey: "discounts.errors.voucherCompanyMismatch",
      };
    } else {
      const available = Math.max(0, v.remainingAmountXOF - v.reservedAmountXOF);
      if (available <= 0) {
        reason = {
          code: "VOUCHER_EMPTY",
          messageKey: "discounts.errors.voucherEmpty",
        };
      } else {
        const interim = buildChargeQuote({ ctx: input.ctx, instruments });
        const applyToFees = (v.applyTarget ?? "ENTIRE_CHARGE") === "ENTIRE_CHARGE";
        let applyXOF = 0;
        if (applyToFees) {
          applyXOF = Math.min(available, interim.provisionalChargeXOF);
        } else {
          applyXOF = Math.min(available, interim.postDiscountSubtotalXOF);
        }
        if (applyXOF > 0) {
          instruments.push({
            instrumentType: "MONETARY_VOUCHER",
            voucherId: v.id,
            ticketDiscountXOF: 0,
            feeDiscountXOF: 0,
            creditAppliedXOF: 0,
            voucherAppliedXOF: applyXOF,
            platformFundedXOF: 0,
            operatorFundedXOF: 0,
            stackGroup: "VOUCHER_PAY",
          });
        }
      }
    }
    if (reason) {
      voucherRejection = reason;
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
      let need = Math.max(
        0,
        interim.provisionalChargeXOF - (interim.voucherAppliedXOF ?? 0),
      );
      if (input.creditAmountXOF != null) {
        need = Math.min(need, input.creditAmountXOF);
      }
      const lots = input.creditLots
        .filter((l) => l.status === "ACTIVE" || l.status === "PARTIALLY_REDEEMED")
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
    ...(voucherRejection ? { voucherRejection } : {}),
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
