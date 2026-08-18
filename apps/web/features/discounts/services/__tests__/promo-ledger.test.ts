import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccountingEngine } from "@moja/db";
import { appendPromoLedgerEntries } from "../promo-ledger";

describe("appendPromoLedgerEntries", () => {
  it("adds platform expense and credit debits that balance with booking credits", () => {
    const engine = new AccountingEngine("BOOKING", {
      idempotencyKey: "test-promo-ledger",
    });
    // Passenger paid 9000; fee 0; operatorNet 8500; commission 1500; platform D=1000
    // pre=10000, D=1000 platform, charge=9000
    engine.addDebit({
      accountId: "clearing",
      amount: 9000,
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
        creditAppliedXOF: 0,
        ticketDiscountXOF: 1000,
      },
      accounts: {
        promoExpensePlatformId: "promo-exp",
        promoCreditsUserId: "user-credits",
        promoContraOperatorId: "op-contra",
      },
      operatorReceivableId: "operator",
      holdGroupId: "hold_1",
      sequenceStart: 4,
    });
    assert.doesNotThrow(() => engine.validate());
  });

  it("debits promo credits when applied", () => {
    const engine = new AccountingEngine("BOOKING", {
      idempotencyKey: "test-credits",
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
      holdGroupId: "hold_2",
      sequenceStart: 4,
    });
    // 7000 + 1000 + 2000 = 10000; credits 8500+1500=10000
    assert.doesNotThrow(() => engine.validate());
  });
});
