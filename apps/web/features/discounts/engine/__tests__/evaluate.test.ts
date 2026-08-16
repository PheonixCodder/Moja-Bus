import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateCheckoutDiscounts,
  type EvalCampaign,
  type EvalContext,
} from "../index";

function baseCtx(overrides: Partial<EvalContext> = {}): EvalContext {
  return {
    now: new Date("2026-08-15T12:00:00.000Z"),
    userId: "user_1",
    completedBookingCount: 0,
    companyId: "co_1",
    routeId: "route_1",
    scheduleId: "sch_1",
    tripId: "trip_1",
    seatCount: 2,
    baseFareXOF: 5000,
    preDiscountSubtotalXOF: 10_000,
    convenienceFeeBps: 250,
    ...overrides,
  };
}

function campaign(overrides: Partial<EvalCampaign> = {}): EvalCampaign {
  return {
    id: "camp_1",
    companyId: null,
    status: "ACTIVE",
    fundingType: "PLATFORM",
    platformShareBps: 10_000,
    operatorShareBps: 0,
    benefitType: "PERCENT_OFF",
    percentBps: 1000,
    amountXOF: null,
    freeSeatCount: null,
    applyTarget: "TICKET_ONLY",
    startsAt: null,
    endsAt: null,
    minSubtotalXOF: null,
    minSeatCount: null,
    maxSeatCount: null,
    firstBookingOnly: false,
    newUserOnly: false,
    maxRedemptionsGlobal: null,
    maxRedemptionsPerUser: null,
    maxRedemptionsPerPhone: null,
    maxDiscountPerBookingXOF: null,
    budgetXOF: null,
    budgetConsumedXOF: 0,
    budgetReservedXOF: 0,
    stackGroup: "PROMO",
    priority: 100,
    isAutoApply: true,
    allowCombineWithCredit: true,
    requireOperatorOptIn: false,
    ...overrides,
  };
}

describe("evaluateCheckoutDiscounts", () => {
  it("auto-applies best percent campaign", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx(),
      campaigns: [
        campaign({ id: "low", percentBps: 500, priority: 10 }),
        campaign({ id: "high", percentBps: 1500, priority: 1 }),
      ],
      autoApply: true,
    });
    assert.equal(result.ok, true);
    assert.equal(result.ticketDiscountXOF, 1500);
    assert.equal(result.autoAppliedCampaignId, "high");
    assert.equal(result.postDiscountSubtotalXOF, 8500);
    assert.equal(result.convenienceFeeXOF, 213); // round(8500 * 250 / 10000)
  });

  it("lets user code override auto-apply", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx(),
      campaigns: [
        campaign({ id: "auto", percentBps: 2000, isAutoApply: true }),
        campaign({
          id: "coded",
          percentBps: 1000,
          isAutoApply: false,
        }),
      ],
      code: "SAVE10",
      coupon: {
        id: "cp_1",
        campaignId: "coded",
        code: "SAVE10",
        isActive: true,
        maxRedemptions: null,
        redemptionCount: 0,
        expiresAt: null,
        assignedUserId: null,
      },
      autoApply: true,
    });
    assert.equal(result.ok, true);
    assert.equal(result.ticketDiscountXOF, 1000);
    assert.equal(result.instruments[0]?.instrumentType, "COUPON_CODE");
  });

  it("rejects first-booking campaign for returning users", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({ completedBookingCount: 2 }),
      campaigns: [campaign({ firstBookingOnly: true, isAutoApply: false })],
      code: "NEW10",
      coupon: {
        id: "cp_1",
        campaignId: "camp_1",
        code: "NEW10",
        isActive: true,
        maxRedemptions: null,
        redemptionCount: 0,
        expiresAt: null,
        assignedUserId: null,
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.rejection?.code, "FIRST_BOOKING_ONLY");
  });

  it("applies fixed operator discount and hybrid funding split", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx(),
      campaigns: [
        campaign({
          id: "hyb",
          benefitType: "FIXED_AMOUNT_OFF",
          percentBps: null,
          amountXOF: 2000,
          fundingType: "HYBRID",
          platformShareBps: 5000,
          operatorShareBps: 5000,
          isAutoApply: true,
        }),
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.ticketDiscountXOF, 2000);
    assert.equal(result.platformFundedXOF, 1000);
    assert.equal(result.operatorFundedXOF, 1000);
  });

  it("applies monetary voucher to remaining charge without platform expense", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx(),
      campaigns: [campaign({ percentBps: 1000 })],
      monetaryVoucher: {
        id: "v_1",
        remainingAmountXOF: 5000,
        reservedAmountXOF: 0,
        status: "ACTIVE",
        expiresAt: null,
        applyTarget: "ENTIRE_CHARGE",
      },
    });
    assert.equal(result.ok, true);
    assert.ok(result.chargeAmountXOF < result.preDiscountSubtotalXOF);
    assert.ok(
      result.instruments.some((i) => i.instrumentType === "MONETARY_VOUCHER"),
    );
    assert.equal(result.platformFundedXOF, 1000); // campaign only
    assert.ok((result.voucherAppliedXOF ?? 0) > 0);
    const voucher = result.instruments.find(
      (i) => i.instrumentType === "MONETARY_VOUCHER",
    );
    assert.equal(voucher?.platformFundedXOF, 0);
    assert.ok((voucher?.voucherAppliedXOF ?? 0) > 0);
  });

  it("applies promo credits after discounts", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx(),
      campaigns: [],
      useCredits: true,
      creditLots: [
        {
          id: "cl_1",
          remainingXOF: 3000,
          reservedXOF: 0,
          expiresAt: null,
          status: "ACTIVE",
        },
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.creditAppliedXOF, 3000);
    assert.equal(result.chargeAmountXOF, result.provisionalChargeXOF - 3000);
  });

  it("respects trip scope", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({ tripId: "trip_other" }),
      campaigns: [
        campaign({ tripIds: ["trip_1"], isAutoApply: true }),
      ],
    });
    assert.equal(result.ticketDiscountXOF, 0);
    assert.equal(result.autoAppliedCampaignId, null);
  });

  it("respects schedule scope", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({ scheduleId: "sch_other" }),
      campaigns: [
        campaign({ scheduleIds: ["sch_1"], isAutoApply: true }),
      ],
    });
    assert.equal(result.ticketDiscountXOF, 0);
    assert.equal(result.autoAppliedCampaignId, null);
  });

  it("rejects when phone redemption cap is reached", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({ phone: "+22507000000" }),
      campaigns: [
        campaign({
          maxRedemptionsPerPhone: 1,
          redemptionCountForPhone: 1,
          isAutoApply: true,
        }),
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.ticketDiscountXOF, 0);
    assert.equal(result.autoAppliedCampaignId, null);
  });

  it("soft-fails invalid voucher and keeps coupon", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx(),
      campaigns: [
        campaign({
          id: "coded",
          percentBps: 1000,
          isAutoApply: false,
        }),
      ],
      code: "SAVE10",
      coupon: {
        id: "cp_1",
        campaignId: "coded",
        code: "SAVE10",
        isActive: true,
        maxRedemptions: null,
        redemptionCount: 0,
        expiresAt: null,
        assignedUserId: null,
      },
      monetaryVoucher: {
        id: "v_bad",
        remainingAmountXOF: 0,
        reservedAmountXOF: 0,
        status: "ACTIVE",
        expiresAt: null,
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.ticketDiscountXOF, 1000);
    assert.equal(result.voucherRejection?.code, "VOUCHER_EMPTY");
    assert.equal(
      result.instruments.some((i) => i.instrumentType === "MONETARY_VOUCHER"),
      false,
    );
  });

  it("rejects schedule-scoped voucher on wrong schedule without wiping quote", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({ scheduleId: "sch_other" }),
      campaigns: [campaign({ percentBps: 1000 })],
      monetaryVoucher: {
        id: "v1",
        remainingAmountXOF: 5000,
        reservedAmountXOF: 0,
        status: "ACTIVE",
        expiresAt: null,
        scheduleId: "sch_1",
        companyId: "co_1",
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.ticketDiscountXOF, 1000);
    assert.equal(result.voucherRejection?.code, "VOUCHER_SCHEDULE_MISMATCH");
  });

  it("applies schedule-scoped voucher on matching schedule", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({ scheduleId: "sch_1" }),
      campaigns: [],
      monetaryVoucher: {
        id: "v1",
        remainingAmountXOF: 5000,
        reservedAmountXOF: 0,
        status: "ACTIVE",
        expiresAt: null,
        scheduleId: "sch_1",
        companyId: "co_1",
      },
    });
    assert.equal(result.ok, true);
    assert.ok(
      result.instruments.some((i) => i.instrumentType === "MONETARY_VOUCHER"),
    );
  });
});
