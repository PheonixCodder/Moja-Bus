import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateCouponSuffix } from "../bulk-coupon-create";

describe("generateCouponSuffix", () => {
  it("returns fixed length alphanumeric without ambiguous chars", () => {
    const s = generateCouponSuffix(8);
    assert.equal(s.length, 8);
    assert.match(s, /^[A-Z0-9]+$/);
    assert.equal(s.includes("I"), false);
    assert.equal(s.includes("O"), false);
    assert.equal(s.includes("0"), false);
    assert.equal(s.includes("1"), false);
  });

  it("varies across calls", () => {
    const a = new Set(
      Array.from({ length: 20 }, () => generateCouponSuffix(8)),
    );
    assert.ok(a.size > 10);
  });
});
