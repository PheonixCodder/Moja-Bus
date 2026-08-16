import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveCheckoutPayable,
  walletPayableFromSnapshot,
} from "../checkout-payable";

describe("resolveCheckoutPayable", () => {
  it("waives fee on wallet and nets credits to zero cash", () => {
    const result = resolveCheckoutPayable({
      postDiscountSubtotalXOF: 1000,
      convenienceFeeXOF: 100,
      creditAppliedXOF: 1000,
      chargeAmountXOF: 100,
      paymentMethod: "WALLET",
    });
    assert.equal(result.payableXOF, 0);
    assert.equal(result.paymentMode, "ZERO_CASH");
    assert.equal(result.displayFeeXOF, 0);
  });

  it("requires cash remainder after partial credits on wallet", () => {
    const result = resolveCheckoutPayable({
      postDiscountSubtotalXOF: 1000,
      convenienceFeeXOF: 100,
      creditAppliedXOF: 400,
      chargeAmountXOF: 700,
      paymentMethod: "WALLET",
    });
    assert.equal(result.payableXOF, 600);
    assert.equal(result.paymentMode, "WALLET");
  });

  it("keeps fee on paystack path", () => {
    const result = resolveCheckoutPayable({
      postDiscountSubtotalXOF: 1000,
      convenienceFeeXOF: 100,
      creditAppliedXOF: 0,
      chargeAmountXOF: 1100,
      paymentMethod: "PAYSTACK",
    });
    assert.equal(result.payableXOF, 1100);
    assert.equal(result.displayFeeXOF, 100);
  });
});

describe("walletPayableFromSnapshot", () => {
  it("returns zero when credits cover post-discount subtotal", () => {
    assert.equal(
      walletPayableFromSnapshot({
        chargeAmountXOF: 100,
        convenienceFeeXOF: 100,
        creditAppliedXOF: 1000,
        postDiscountSubtotalXOF: 1000,
      }),
      0,
    );
  });
});
