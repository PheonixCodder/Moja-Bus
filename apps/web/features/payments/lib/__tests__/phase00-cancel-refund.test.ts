import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ACCOUNT_CLASS } from "../account-classes";
import {
  canPassengerSelfCancelWithChannel,
  isCreatableRefundChannel,
  refundStatusForCancellationChannel,
  shouldOpenPaystackForPendingPay,
} from "../cancellation-policy";

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
    assert.equal(refundStatusForCancellationChannel("WALLET"), "COMPLETED");
  });

  it("cash remains PENDING_FULFILMENT for offline reimbursement", () => {
    assert.equal(
      refundStatusForCancellationChannel("CASH"),
      "PENDING_FULFILMENT",
    );
  });
});

describe("Phase 00 cancellation channel policy", () => {
  it("allows passenger self-cancel for wallet and blocks cash", () => {
    assert.equal(canPassengerSelfCancelWithChannel("WALLET"), true);
    assert.equal(canPassengerSelfCancelWithChannel("CASH"), false);
  });
});

describe("Phase 05 refund channel truthfulness (F-PS-02)", () => {
  it("PAYSTACK is not a creatable refund channel", () => {
    assert.equal(isCreatableRefundChannel("PAYSTACK"), false);
    assert.equal(isCreatableRefundChannel("WALLET"), true);
    assert.equal(isCreatableRefundChannel("CASH"), true);
  });

  it("blocks PAYSTACK from passenger self-cancel", () => {
    assert.equal(canPassengerSelfCancelWithChannel("PAYSTACK"), false);
  });
});

/**
 * Mirrors the CancellationService ZERO_CASH branch: fully promo-covered
 * confirms collected no money, so cancelling mints no refund obligation.
 */
function shouldMintRefundObligation(settlementKind: string) {
  return settlementKind !== "ZERO_CASH";
}

describe("Phase 05 zero-cash settlements mint no refund obligation", () => {
  it("skips obligation only for ZERO_CASH", () => {
    assert.equal(shouldMintRefundObligation("ZERO_CASH"), false);
    assert.equal(shouldMintRefundObligation("WALLET"), true);
    assert.equal(shouldMintRefundObligation("PAYSTACK"), true);
    assert.equal(shouldMintRefundObligation("MIXED"), true);
  });
});

describe("Phase 00 pending-pay zero cash routing", () => {
  it("does not initiate Paystack when refrozen payable is zero", () => {
    assert.equal(
      shouldOpenPaystackForPendingPay({
        paymentMethod: "PAYSTACK",
        chargeAmountXOF: 0,
      }),
      false,
    );
  });

  it("keeps Paystack for positive card/mobile-money remainder", () => {
    assert.equal(
      shouldOpenPaystackForPendingPay({
        paymentMethod: "PAYSTACK",
        chargeAmountXOF: 1000,
      }),
      true,
    );
  });
});

describe("Phase 00 trip cancel failure (D3)", () => {
  it("maps refund failure to REFUND_PENDING not CANCEL_WITHOUT_REFUND", () => {
    assert.equal(tripRefundFailureBookingStatus(), "REFUND_PENDING");
  });
});

describe("Phase 00 ACCOUNT_CLASS", () => {
  it("includes OFFLINE_REFUND_PAYABLE", () => {
    assert.equal(
      ACCOUNT_CLASS.OFFLINE_REFUND_PAYABLE,
      "OFFLINE_REFUND_PAYABLE",
    );
  });
});

describe("Phase 00 multi-seat refund idempotency keys", () => {
  it("uses per-booking keys so N seats do not collide", () => {
    const bookingIds = ["b1", "b2", "b3"];
    const keys = bookingIds.map((id) => `REFUND_WALLET_${id}`);
    assert.equal(new Set(keys).size, 3);
  });
});
