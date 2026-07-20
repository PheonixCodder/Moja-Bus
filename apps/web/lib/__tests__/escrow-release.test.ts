import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeEscrowReleaseNet } from "../escrow-release";

describe("computeEscrowReleaseNet", () => {
  it("fails closed when snapshot is missing", () => {
    assert.equal(
      computeEscrowReleaseNet({
        seatCountReleasing: 2,
        cancelledCount: 0,
        snapshot: null,
      }),
      null,
    );
  });

  it("uses standard net for partial release", () => {
    const net = computeEscrowReleaseNet({
      seatCountReleasing: 2,
      cancelledCount: 0,
      snapshot: { operatorNetXOF: 1000, seatCount: 4 },
    });
    assert.equal(net, 500);
  });

  it("uses remainder for last seats", () => {
    const net = computeEscrowReleaseNet({
      seatCountReleasing: 1,
      cancelledCount: 3,
      snapshot: { operatorNetXOF: 1000, seatCount: 4 },
    });
    // standard = 250; remainder = 1000 - 3*250 = 250
    assert.equal(net, 250);
  });
});
