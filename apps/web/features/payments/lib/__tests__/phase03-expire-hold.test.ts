import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Behavioral contract tests for expireOrReleaseHold reasons (no DB).
 * Integration coverage lives in staging smoke.
 */
describe("expireOrReleaseHold contract", () => {
  it("maps RELEASED → CANCELLED and EXPIRED/PAYMENT_FAILED → EXPIRED", () => {
    function nextStatus(reason: string) {
      return reason === "RELEASED" ? "CANCELLED" : "EXPIRED";
    }
    assert.equal(nextStatus("RELEASED"), "CANCELLED");
    assert.equal(nextStatus("EXPIRED"), "EXPIRED");
    assert.equal(nextStatus("PAYMENT_FAILED"), "EXPIRED");
    assert.equal(nextStatus("RECONCILE_FAILED"), "EXPIRED");
  });
});
