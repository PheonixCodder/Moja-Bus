import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  quoteMatchesHoldInput,
  signCheckoutQuote,
  verifyCheckoutQuote,
} from "../checkout-quote";

describe("checkout-quote", () => {
  it("round-trips a signed quote", () => {
    process.env["BETTER_AUTH_SECRET"] = "test-secret-for-quote-signing";
    const quoteId = signCheckoutQuote({
      offerId: "offer-1",
      seatCount: 2,
      paymentMethod: "WALLET",
      code: "SAVE10",
      autoApply: true,
      useCredits: true,
      waiveConvenienceFee: true,
      chargeAmountXOF: 9000,
      postDiscountSubtotalXOF: 9000,
      convenienceFeeXOF: 0,
      ticketDiscountXOF: 1000,
      feeDiscountXOF: 0,
      creditAppliedXOF: 0,
    });
    const payload = verifyCheckoutQuote(quoteId);
    assert.equal(payload.offerId, "offer-1");
    assert.equal(payload.paymentMethod, "WALLET");
    assert.equal(payload.waiveConvenienceFee, true);
    assert.equal(payload.chargeAmountXOF, 9000);
  });

  it("rejects tampered quote", () => {
    process.env["BETTER_AUTH_SECRET"] = "test-secret-for-quote-signing";
    const quoteId = signCheckoutQuote({
      offerId: "offer-1",
      seatCount: 1,
      paymentMethod: "PAYSTACK",
      code: null,
      autoApply: true,
      useCredits: true,
      waiveConvenienceFee: false,
      chargeAmountXOF: 5000,
      postDiscountSubtotalXOF: 4500,
      convenienceFeeXOF: 500,
      ticketDiscountXOF: 0,
      feeDiscountXOF: 0,
      creditAppliedXOF: 0,
    });
    assert.throws(() => verifyCheckoutQuote(quoteId.slice(0, -2) + "xx"));
  });

  it("matches hold inputs", () => {
    const quote = {
      v: 1 as const,
      offerId: "o",
      seatCount: 1,
      paymentMethod: "PAYSTACK" as const,
      code: "ABC",
      autoApply: true,
      useCredits: true,
      waiveConvenienceFee: false,
      chargeAmountXOF: 1,
      postDiscountSubtotalXOF: 1,
      convenienceFeeXOF: 0,
      ticketDiscountXOF: 0,
      feeDiscountXOF: 0,
      creditAppliedXOF: 0,
      exp: Date.now() + 60_000,
    };
    assert.equal(
      quoteMatchesHoldInput(quote, {
        offerId: "o",
        seatCount: 1,
        code: "abc",
        autoApply: true,
        useCredits: true,
      }),
      true,
    );
    assert.equal(
      quoteMatchesHoldInput(quote, {
        offerId: "o",
        seatCount: 2,
      }),
      false,
    );
  });
});
