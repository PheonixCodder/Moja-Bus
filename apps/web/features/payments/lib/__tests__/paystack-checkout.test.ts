import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getHoldCountdown,
  isHoldActive,
} from "@/features/booking/lib/hold-countdown";
import {
  buildPaystackNewTransactionConfig,
  PaystackPaymentCancelledError,
  shouldPreferRedirectCheckout,
  shouldUseRedirectFallback,
} from "@/features/payments/lib/paystack-checkout";

describe("paystack-checkout helpers", () => {
  it("builds newTransaction config with access_code", () => {
    const config = buildPaystackNewTransactionConfig(
      {
        publicKey: "pk_test_123",
        accessCode: "access_code_123",
        reference: "ref_123",
        authorizationUrl: "https://checkout.paystack.com/abc",
      },
      {
        onSuccess: () => {},
        onCancel: () => {},
      },
    );

    assert.equal(config.key, "pk_test_123");
    assert.equal(config.access_code, "access_code_123");
  });

  it("does not redirect when payment was cancelled", () => {
    assert.equal(
      shouldUseRedirectFallback(new PaystackPaymentCancelledError()),
      false,
    );
  });

  it("redirects for blocked iframe style errors", () => {
    assert.equal(
      shouldUseRedirectFallback(
        new Error("checkout.paystack.com refused to connect"),
      ),
      true,
    );
  });

  it("only prefers redirect when explicitly configured", () => {
    const originalMode = process.env.NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE;

    delete process.env.NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE;
    assert.equal(shouldPreferRedirectCheckout(), false);

    process.env.NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE = "redirect";
    assert.equal(shouldPreferRedirectCheckout(), true);

    if (originalMode === undefined) {
      delete process.env.NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE;
    } else {
      process.env.NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE = originalMode;
    }
  });
});

describe("hold countdown", () => {
  it("marks expired holds", () => {
    const countdown = getHoldCountdown(
      new Date("2026-01-01T10:00:00Z"),
      Date.parse("2026-01-01T10:05:00Z"),
    );
    assert.equal(countdown?.expired, true);
    assert.match(countdown?.label ?? "", /expired/i);
  });

  it("formats remaining time", () => {
    const countdown = getHoldCountdown(
      new Date("2026-01-01T10:05:00Z"),
      Date.parse("2026-01-01T10:03:10Z"),
    );
    assert.equal(countdown?.expired, false);
    assert.equal(countdown?.label, "Pay within 1:50");
  });

  it("checks active holds", () => {
    assert.equal(
      isHoldActive(
        new Date("2026-01-01T10:05:00Z"),
        Date.parse("2026-01-01T10:00:00Z"),
      ),
      true,
    );
    assert.equal(
      isHoldActive(
        new Date("2026-01-01T10:00:00Z"),
        Date.parse("2026-01-01T10:05:00Z"),
      ),
      false,
    );
  });
});
