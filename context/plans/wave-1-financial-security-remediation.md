# Wave 1 Implementation Plan: Critical Financial & Treasury Defense

**Date:** 2026-08-31  
**Status:** READY FOR EXECUTION  
**Author:** Antigravity Architect  
**Scope:** Fix 3 Critical Financial Vulnerabilities + Associated High Priority Blockers

---

## 1. Objectives

1. **Fix Promo-to-Cash Laundering & Arbitrage on Booking Cancellations**:
   - Disallow crediting `PASSENGER_WALLET` for fares paid with promotional marketing credits.
   - Refund cash only for the actual cash portion paid (`chargeAmountXOF`).
   - Restore spent `CreditLot` balances and credit `PROMO_CREDITS` for promo-funded portions.
   - Adjust operator and platform commission clawbacks to match actual post-discount revenues recognized.
2. **Fix Operator-Funded Discount Drainage in Paystack Confirmations**:
   - In `reserveDiscountOnHold` (`quote-service.ts`), update `PricingSnapshot`:
     - $\text{operatorNetXOF} = \max(0, \text{baseOperatorNetXOF} - \text{operatorPromoFundedXOF})$
     - $\text{chargeAmountXOF} = \text{quote.chargeAmountXOF}$
     - $\text{convenienceFeeXOF} = \max(0, \text{quote.convenienceFeeXOF} - \text{quote.feeDiscountXOF})$
   - In `confirmFromPayment` (`booking-confirmation-service.ts`), ensure `clearingNet` and operator revenue credits match the discounted cash flow.
3. **Enforce Database-Level Idempotency on Top-Up & Orphan Rescues**:
   - Pass deterministic `idempotencyKey: 'TOP_UP_${payment.id}'` in `processTopUp` (`payment-service.ts`).
   - Pass deterministic `idempotencyKey: 'ORPHAN_RESCUE_${payment.id}'` in `rescueOrphanedPayment` (`booking-confirmation-service.ts`).
   - Verify that `businessIdempotencyKey` on `FinancialTransaction` prevents any duplicate commits.

---

## 2. Touchpoint Files

| File Path | Description of Changes |
| :--- | :--- |
| [`apps/web/features/payments/lib/cancellation-policy.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/cancellation-policy.ts) | Update `computeRefundQuote` to take pricing snapshot instruments and return `cashRefundXOF`, `creditRestoreXOF`, `operatorNetXOF`, `commissionXOF`. |
| [`apps/web/features/payments/services/cancellation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/cancellation-service.ts) | Execute split tender refund: credit `PASSENGER_WALLET` only for `cashRefundXOF`, reinstate `CreditLot` and post `PROMO_CREDITS` ledger entry for `creditRestoreXOF`. |
| [`apps/web/features/discounts/services/quote-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/quote-service.ts) | Update `reserveDiscountOnHold` to persist `operatorNetXOF` (net of operator promo) and `chargeAmountXOF` into `PricingSnapshot`. |
| [`apps/web/features/payments/services/booking-confirmation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts) | Ensure `confirmFromPayment` debits `clearingNet` and credits `operatorNetXOF` consistently with `PricingSnapshot`; add `idempotencyKey` to `rescueOrphanedPayment`. |
| [`apps/web/features/payments/payment-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/payment-service.ts) | Pass `idempotencyKey: 'TOP_UP_${payment.id}'` to `AccountingEngine` in `processTopUp`. |
| [`apps/web/features/payments/lib/__tests__/phase00-cancel-refund.test.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/__tests__/phase00-cancel-refund.test.ts) | Add unit tests for split-tender cancellation math and zero-cash credit restoration. |

---

## 3. Verification Criteria

1. **Unit & Integration Tests**:
   - `pnpm --filter @moja/web test` passes all cancellation policy and pricing tests.
2. **Typecheck & Lint**:
   - `pnpm turbo typecheck` passes with zero errors across all workspaces.
3. **No Rounding or Precision Leaks**:
   - All XOF calculations remain strict integers (`Math.round`, `roundXOF`).
