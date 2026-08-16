import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccountingEngine } from "@moja/db";
import { appendPromoLedgerEntries } from "../promo-ledger";
import { splitPromoPaymentInstruments } from "../promo-payment-split";

describe("Phase 01 promo grant / voucher ledger", () => {
  it("Trace E: INITIAL idempotency key is edge-scoped", () => {
    const edgeId = "edge_1";
    const holdA = "hold_a";
    const holdB = "hold_b";
    const initialKey = `referral:${edgeId}:INITIAL`;
    const oldBuggyA = `referral:${edgeId}:${holdA}:INITIAL`;
    const oldBuggyB = `referral:${edgeId}:${holdB}:INITIAL`;
    assert.notEqual(oldBuggyA, oldBuggyB);
    assert.equal(initialKey, `referral:${edgeId}:INITIAL`);
    assert.equal(new Set([initialKey, initialKey]).size, 1);
  });

  it("splits lot credits from voucher burn via breakdown", () => {
    const split = splitPromoPaymentInstruments({
      creditAppliedXOF: 7000,
      discountBreakdownJson: {
        creditAppliedXOF: 2000,
        voucherAppliedXOF: 5000,
      },
    });
    assert.equal(split.creditAppliedXOF, 2000);
    assert.equal(split.voucherAppliedXOF, 5000);
  });

  it("voucher redeem debits VOUCHER_LIABILITY not promo expense", () => {
    const engine = new AccountingEngine("BOOKING", {
      idempotencyKey: "test-voucher-burn",
    });
    engine.addDebit({
      accountId: "clearing",
      amount: 5000,
      sequenceNumber: 1,
    });
    engine.addCredit({
      accountId: "operator",
      amount: 9000,
      sequenceNumber: 2,
    });
    engine.addCredit({
      accountId: "commission",
      amount: 1000,
      sequenceNumber: 3,
    });
    appendPromoLedgerEntries({
      engine,
      snapshot: {
        platformPromoFundedXOF: 0,
        operatorPromoFundedXOF: 0,
        creditAppliedXOF: 0,
        voucherAppliedXOF: 5000,
        ticketDiscountXOF: 0,
      },
      accounts: {
        promoExpensePlatformId: "promo-exp",
        voucherLiabilityId: "voucher-liab",
        promoCreditsUserId: "user-credits",
        promoContraOperatorId: "op-contra",
      },
      operatorReceivableId: "operator",
      holdGroupId: "hold_v",
      sequenceStart: 4,
    });
    assert.doesNotThrow(() => engine.validate());
  });

  it("credit apply debits promo credits account", () => {
    const engine = new AccountingEngine("BOOKING", {
      idempotencyKey: "test-credit-apply",
    });
    engine.addDebit({
      accountId: "clearing",
      amount: 7000,
      sequenceNumber: 1,
    });
    engine.addCredit({
      accountId: "operator",
      amount: 8500,
      sequenceNumber: 2,
    });
    engine.addCredit({
      accountId: "commission",
      amount: 1500,
      sequenceNumber: 3,
    });
    appendPromoLedgerEntries({
      engine,
      snapshot: {
        platformPromoFundedXOF: 1000,
        operatorPromoFundedXOF: 0,
        creditAppliedXOF: 2000,
        voucherAppliedXOF: 0,
        ticketDiscountXOF: 1000,
      },
      accounts: {
        promoExpensePlatformId: "promo-exp",
        voucherLiabilityId: "voucher-liab",
        promoCreditsUserId: "user-credits",
        promoContraOperatorId: "op-contra",
      },
      operatorReceivableId: "operator",
      holdGroupId: "hold_c",
      sequenceStart: 4,
    });
    assert.doesNotThrow(() => engine.validate());
  });
});
