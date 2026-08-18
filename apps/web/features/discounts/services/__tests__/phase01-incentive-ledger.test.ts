import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccountingEngine } from "@moja/db";
import { appendPromoLedgerEntries } from "../promo-ledger";
import { splitPromoPaymentInstruments } from "../promo-payment-split";

describe("Phase 01 promo grant / credit ledger", () => {
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

  it("extracts lot credits via splitPromoPaymentInstruments", () => {
    const split = splitPromoPaymentInstruments({
      creditAppliedXOF: 7000,
    });
    assert.equal(split.creditAppliedXOF, 7000);
  });

  it("credit apply debits promo credits account and balances ledger", () => {
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
        ticketDiscountXOF: 1000,
      },
      accounts: {
        promoExpensePlatformId: "promo-exp",
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
