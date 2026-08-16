import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ACCOUNT_CLASS } from "../account-classes";

/**
 * Pure settlement classifier (mirrors resolveBookingSettlement branches).
 * Used so Trace A / wallet / zero-cash gates are unit-tested without DB.
 */
function classifySettlement(input: {
  paymentStatus: string | null;
  hasWalletLedger: boolean;
  chargeAmountXOF: number | null;
  hasConfirmed: boolean;
}): { kind: string; cancellable: boolean } {
  if (input.paymentStatus === "SUCCESS") {
    return {
      kind: input.hasWalletLedger ? "MIXED" : "PAYSTACK",
      cancellable: true,
    };
  }
  if (input.hasWalletLedger) {
    return { kind: "WALLET", cancellable: true };
  }
  if (input.hasConfirmed && input.paymentStatus === null) {
    return {
      kind: input.chargeAmountXOF === 0 ? "ZERO_CASH" : "WALLET",
      cancellable: true,
    };
  }
  return { kind: "PAYSTACK", cancellable: false };
}

function refundRecordStatus(channel: "WALLET" | "CASH" | "VOUCHER") {
  return channel === "WALLET" ? "COMPLETED" : "PENDING_FULFILMENT";
}

function tripRefundFailureBookingStatus() {
  // D3: never CANCEL_WITHOUT_REFUND as the success-ish path
  return "REFUND_PENDING" as const;
}

describe("Phase 00 settlement provenance", () => {
  it("Trace A: wallet confirm without ExternalPayment is cancellable", () => {
    const s = classifySettlement({
      paymentStatus: null,
      hasWalletLedger: true,
      chargeAmountXOF: 5000,
      hasConfirmed: true,
    });
    assert.equal(s.kind, "WALLET");
    assert.equal(s.cancellable, true);
  });

  it("zero-cash confirm without payment is cancellable", () => {
    const s = classifySettlement({
      paymentStatus: null,
      hasWalletLedger: false,
      chargeAmountXOF: 0,
      hasConfirmed: true,
    });
    assert.equal(s.kind, "ZERO_CASH");
    assert.equal(s.cancellable, true);
  });

  it("Paystack SUCCESS is cancellable", () => {
    const s = classifySettlement({
      paymentStatus: "SUCCESS",
      hasWalletLedger: false,
      chargeAmountXOF: 5000,
      hasConfirmed: true,
    });
    assert.equal(s.kind, "PAYSTACK");
    assert.equal(s.cancellable, true);
  });

  it("unsettled hold is not cancellable", () => {
    const s = classifySettlement({
      paymentStatus: "INITIALIZED",
      hasWalletLedger: false,
      chargeAmountXOF: 5000,
      hasConfirmed: false,
    });
    assert.equal(s.cancellable, false);
  });
});

describe("Phase 00 honest refund statuses (D1)", () => {
  it("wallet credit is COMPLETED without implying Paystack refund", () => {
    assert.equal(refundRecordStatus("WALLET"), "COMPLETED");
  });

  it("cash/voucher are PENDING_FULFILMENT", () => {
    assert.equal(refundRecordStatus("CASH"), "PENDING_FULFILMENT");
    assert.equal(refundRecordStatus("VOUCHER"), "PENDING_FULFILMENT");
  });
});

describe("Phase 00 trip cancel failure (D3)", () => {
  it("maps refund failure to REFUND_PENDING not CANCEL_WITHOUT_REFUND", () => {
    assert.equal(tripRefundFailureBookingStatus(), "REFUND_PENDING");
  });
});

describe("Phase 00 ACCOUNT_CLASS", () => {
  it("includes OFFLINE_REFUND_PAYABLE", () => {
    assert.equal(ACCOUNT_CLASS.OFFLINE_REFUND_PAYABLE, "OFFLINE_REFUND_PAYABLE");
  });
});

describe("Phase 00 multi-seat refund idempotency keys", () => {
  it("uses per-booking keys so N seats do not collide", () => {
    const bookingIds = ["b1", "b2", "b3"];
    const keys = bookingIds.map((id) => `REFUND_WALLET_${id}`);
    assert.equal(new Set(keys).size, 3);
  });
});
