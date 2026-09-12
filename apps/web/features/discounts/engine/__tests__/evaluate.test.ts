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

  it("caps promo credits to ticket subtotal and waives convenience fee on 100% credit coverage (Abidjan -> Bouake scenario)", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({
        baseFareXOF: 1000,
        preDiscountSubtotalXOF: 1000,
        seatCount: 1,
        convenienceFeeBps: 250, // 25 XOF
      }),
      campaigns: [],
      useCredits: true,
      creditLots: [
        {
          id: "cl_5000",
          remainingXOF: 5000,
          reservedXOF: 0,
          expiresAt: null,
          status: "ACTIVE",
        },
      ],
    });
    assert.equal(result.ok, true);
    // Ticket subtotal is 1000. Credit applied must be exactly 1000, NEVER 1025.
    assert.equal(result.creditAppliedXOF, 1000);
    // Fee must be waived because ticket is 100% covered by credits
    assert.equal(result.convenienceFeeXOF, 0);
    // Charge amount must be exactly 0 (Zero-Cash booking)
    assert.equal(result.chargeAmountXOF, 0);
  });

  it("caps promo credit usage when paymentMethod is PAYSTACK to preserve at least 100 XOF cash payable", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({
        baseFareXOF: 1000,
        preDiscountSubtotalXOF: 1000,
        seatCount: 1,
        convenienceFeeBps: 250, // 25 XOF
        paymentMethod: "PAYSTACK",
      }),
      campaigns: [],
      useCredits: true,
      creditLots: [
        {
          id: "cl_950",
          remainingXOF: 950,
          reservedXOF: 0,
          expiresAt: null,
          status: "ACTIVE",
        },
      ],
    });
    assert.equal(result.ok, true);
    // Ticket subtotal: 1000. Under PAYSTACK, maxUsableCredit is capped to postDiscountSubtotal - 100 = 900 XOF.
    // This ensures at least 100 XOF ticket fare (+ 25 XOF fee = 125 XOF total) remains for Paystack processing.
    assert.equal(result.creditAppliedXOF, 900);
    assert.equal(result.chargeAmountXOF, 125);
  });

  it("respects trip scope", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({ tripId: "trip_other" }),
      campaigns: [campaign({ tripIds: ["trip_1"], isAutoApply: true })],
    });
    assert.equal(result.ticketDiscountXOF, 0);
    assert.equal(result.autoAppliedCampaignId, null);
  });

  it("respects schedule scope", () => {
    const result = evaluateCheckoutDiscounts({
      ctx: baseCtx({ scheduleId: "sch_other" }),
      campaigns: [campaign({ scheduleIds: ["sch_1"], isAutoApply: true })],
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
});

