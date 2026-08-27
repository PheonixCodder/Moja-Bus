import type { AccountingEngine } from "@moja/db";

type SnapshotPromoFields = {
  platformPromoFundedXOF: number;
  operatorPromoFundedXOF: number;
  creditAppliedXOF: number;
  ticketDiscountXOF: number;
};

type PromoAccounts = {
  promoExpensePlatformId: string;
  promoCreditsUserId: string | null;
  promoContraOperatorId: string;
};

/**
 * Appends discount/credit balancing legs so BOOKING ledger stays balanced when
 * platform funds a promo, passenger spends promo credits, or operator absorbs discount.
 *
 * Economic rules:
 * - Platform-funded D: Debit PROMO_EXPENSE (subsidy filling passenger shortfall)
 * - Credits applied: Debit passenger PROMO_CREDITS
 * - Operator-funded D: Debit PROMO_CONTRA_OPERATOR + Credit OPERATOR_RECEIVABLE
 */
export function appendPromoLedgerEntries(input: {
  engine: AccountingEngine;
  snapshot: SnapshotPromoFields;
  accounts: PromoAccounts;
  operatorReceivableId: string;
  holdGroupId: string;
  sequenceStart: number;
  /** When true, post operator contra for reporting (balanced: debit contra, credit receivable). */
  postOperatorContra?: boolean;
}): number {
  let seq = input.sequenceStart;
  const platformFunded = Math.max(0, input.snapshot.platformPromoFundedXOF);
  const operatorFunded = Math.max(0, input.snapshot.operatorPromoFundedXOF);
  const creditApplied = Math.max(0, input.snapshot.creditAppliedXOF);

  if (platformFunded > 0) {
    input.engine.addDebit({
      accountId: input.accounts.promoExpensePlatformId,
      amount: platformFunded,
      sequenceNumber: seq++,
      referenceType: "HOLD_GROUP",
      referenceId: input.holdGroupId,
      description: "Platform-funded promo expense",
    });
  }

  if (creditApplied > 0) {
    if (!input.accounts.promoCreditsUserId) {
      throw new Error(
        "Promo credits applied but passenger promo account missing",
      );
    }
    input.engine.addDebit({
      accountId: input.accounts.promoCreditsUserId,
      amount: creditApplied,
      sequenceNumber: seq++,
      referenceType: "HOLD_GROUP",
      referenceId: input.holdGroupId,
      description: "Promo credits applied to charge",
    });
  }

  if (input.postOperatorContra && operatorFunded > 0) {
    input.engine.addDebit({
      accountId: input.accounts.promoContraOperatorId,
      amount: operatorFunded,
      sequenceNumber: seq++,
      referenceType: "HOLD_GROUP",
      referenceId: input.holdGroupId,
      description: "Operator-funded promo contra-revenue",
    });
    input.engine.addCredit({
      accountId: input.operatorReceivableId,
      amount: operatorFunded,
      sequenceNumber: seq++,
      referenceType: "HOLD_GROUP",
      referenceId: input.holdGroupId,
      description: "Offset for operator-funded promo contra",
      reserveOnCredit: true,
    });
  }

  return seq;
}
