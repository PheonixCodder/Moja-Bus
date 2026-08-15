import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adminCreateCampaignSchema,
  checkoutDiscountInputSchema,
  couponCodeValueSchema,
  createCouponSchema,
  upsertCampaignBaseSchema,
} from "../discounts";

describe("discounts schemas", () => {
  it("normalizes coupon codes to uppercase", () => {
    assert.equal(couponCodeValueSchema.parse("summer-10"), "SUMMER-10");
  });

  it("rejects hybrid shares that do not sum to 10000", () => {
    assert.throws(() =>
      upsertCampaignBaseSchema.parse({
        name: "Hybrid",
        fundingType: "HYBRID",
        platformShareBps: 3000,
        operatorShareBps: 3000,
        benefitType: "PERCENT_OFF",
        percentBps: 1000,
      }),
    );
  });

  it("requires percentBps for PERCENT_OFF", () => {
    assert.throws(() =>
      upsertCampaignBaseSchema.parse({
        name: "Pct",
        fundingType: "PLATFORM",
        benefitType: "PERCENT_OFF",
      }),
    );
  });

  it("accepts a valid platform percent campaign", () => {
    const parsed = adminCreateCampaignSchema.parse({
      name: "Welcome 10%",
      fundingType: "PLATFORM",
      benefitType: "PERCENT_OFF",
      percentBps: 1000,
      firstBookingOnly: true,
      maxRedemptionsPerUser: 1,
    });
    assert.equal(parsed.name, "Welcome 10%");
    assert.equal(parsed.percentBps, 1000);
  });

  it("parses checkout discount input", () => {
    const parsed = checkoutDiscountInputSchema.parse({
      code: "abc-1",
      autoApply: true,
      useCredits: true,
    });
    assert.equal(parsed.code, "ABC-1");
  });

  it("parses create coupon", () => {
    const parsed = createCouponSchema.parse({
      campaignId: "camp_1",
      code: "utb-summer",
    });
    assert.equal(parsed.code, "UTB-SUMMER");
  });
});
