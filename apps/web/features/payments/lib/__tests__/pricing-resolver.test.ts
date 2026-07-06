import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildPricingBreakdown,
  resolveCommissionBps,
  toPaystackAmountXOF,
} from "../pricing-resolver";

describe("pricing-resolver", () => {
  it("applies global commission when distance is missing", () => {
    const bps = resolveCommissionBps(null, [], 500);
    assert.equal(bps, 500);
  });

  it("selects matching distance tier", () => {
    const bps = resolveCommissionBps(150, [
      {
        id: "1",
        label: "Short",
        minDistanceKm: 0,
        maxDistanceKm: 100,
        commissionBps: 400,
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        label: "Medium",
        minDistanceKm: 100,
        maxDistanceKm: 250,
        commissionBps: 500,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], 600);
    assert.equal(bps, 500);
  });

  it("builds checkout pricing with convenience fee", () => {
    const pricing = buildPricingBreakdown({
      baseFareXOF: 10_000,
      seatCount: 2,
      distanceKm: 120,
      commissionBps: 500,
      convenienceFeeBps: 250,
    });

    assert.equal(pricing.subtotalBaseXOF, 20_000);
    assert.equal(pricing.convenienceFeeXOF, 500);
    assert.equal(pricing.chargeAmountXOF, 20_500);
    assert.equal(pricing.commissionXOF, 1_000);
    assert.equal(pricing.operatorNetXOF, 19_000);
    assert.equal(pricing.platformGrossXOF, 1_500);
  });

  it("converts XOF to Paystack minor units", () => {
    assert.equal(toPaystackAmountXOF(20_500), 2_050_000);
  });
});
