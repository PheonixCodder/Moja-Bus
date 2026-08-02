import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { computeAvailabilityStatus } from "../availability";

describe("computeAvailabilityStatus", () => {
  test("SOLD_OUT when remaining is 0", () => {
    assert.equal(computeAvailabilityStatus(0, 1), "SOLD_OUT");
  });

  test("SOLD_OUT when remaining < passengerCount", () => {
    assert.equal(computeAvailabilityStatus(3, 4), "SOLD_OUT");
    assert.equal(computeAvailabilityStatus(2, 3), "SOLD_OUT");
  });

  test("FEW_LEFT when remaining <= 5 and >= passengerCount", () => {
    assert.equal(computeAvailabilityStatus(5, 1), "FEW_LEFT");
    assert.equal(computeAvailabilityStatus(5, 5), "FEW_LEFT");
  });

  test("AVAILABLE when remaining > 5 and >= passengerCount", () => {
    assert.equal(computeAvailabilityStatus(6, 1), "AVAILABLE");
    assert.equal(computeAvailabilityStatus(10, 3), "AVAILABLE");
  });
});
