import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Pure remainder math for multi-seat cancel (last seat absorbs dust).
 * Mirrors CancellationService proportional allocation.
 */
function proportionalSeatAmounts(input: {
  seatCount: number;
  cancelledSoFar: number;
  subtotalBaseXOF: number;
  operatorNetXOF: number;
}): { base: number; operatorNet: number } {
  const { seatCount, cancelledSoFar, subtotalBaseXOF, operatorNetXOF } = input;
  const isLastSeat = cancelledSoFar + 1 === seatCount;
  const standardBase = Math.round(subtotalBaseXOF / seatCount);
  const standardNet = Math.round(operatorNetXOF / seatCount);
  return {
    base: isLastSeat
      ? subtotalBaseXOF - cancelledSoFar * standardBase
      : standardBase,
    operatorNet: isLastSeat
      ? operatorNetXOF - cancelledSoFar * standardNet
      : standardNet,
  };
}

describe("cancel channel clawback remainder math", () => {
  it("allocates equal seats then dust on last", () => {
    const seatCount = 3;
    const subtotalBaseXOF = 10001;
    const operatorNetXOF = 9001;
    let cancelled = 0;
    let baseSum = 0;
    let netSum = 0;
    for (let i = 0; i < seatCount; i++) {
      const { base, operatorNet } = proportionalSeatAmounts({
        seatCount,
        cancelledSoFar: cancelled,
        subtotalBaseXOF,
        operatorNetXOF,
      });
      baseSum += base;
      netSum += operatorNet;
      cancelled += 1;
    }
    assert.equal(baseSum, subtotalBaseXOF);
    assert.equal(netSum, operatorNetXOF);
  });

  it("cash clawback amount equals operator net share", () => {
    const { operatorNet } = proportionalSeatAmounts({
      seatCount: 2,
      cancelledSoFar: 0,
      subtotalBaseXOF: 10000,
      operatorNetXOF: 9000,
    });
    assert.equal(operatorNet, 4500);
  });
});
