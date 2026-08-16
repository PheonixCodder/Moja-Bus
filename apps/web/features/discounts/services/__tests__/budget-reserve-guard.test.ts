import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canIncrementCouponRedemption,
  canReserveCampaignBudget,
} from "../budget-reserve-guard";

describe("canReserveCampaignBudget", () => {
  it("allows when budget is null", () => {
    assert.equal(
      canReserveCampaignBudget({
        budgetXOF: null,
        budgetConsumedXOF: 0,
        budgetReservedXOF: 9_999_999,
        amountXOF: 500,
      }),
      true,
    );
  });

  it("rejects when last unit of budget would be exceeded (concurrent race)", () => {
    // Two freezes of 500 against remaining 500: only first may succeed.
    const base = {
      budgetXOF: 1000,
      budgetConsumedXOF: 500,
      budgetReservedXOF: 0,
      amountXOF: 500,
    };
    assert.equal(canReserveCampaignBudget(base), true);
    assert.equal(
      canReserveCampaignBudget({
        ...base,
        budgetReservedXOF: 500,
      }),
      false,
    );
  });
});

describe("canIncrementCouponRedemption", () => {
  it("allows until max exclusive", () => {
    assert.equal(
      canIncrementCouponRedemption({ maxRedemptions: 1, redemptionCount: 0 }),
      true,
    );
    assert.equal(
      canIncrementCouponRedemption({ maxRedemptions: 1, redemptionCount: 1 }),
      false,
    );
  });
});
