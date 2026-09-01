# Wave 3 Implementation Plan: Ledger Hygiene, Reconciliations & Concurrency Locks

**Date:** 2026-08-31  
**Status:** IN PROGRESS  
**Author:** Antigravity Architect  
**Scope:** Offline Refund Void Reversals, Expired Promo Credit Sweep Ledger Reconciliations, and Claim Concurrency Locks

---

## 1. Objectives

1. **Offline Refund Void / Rejection Reversals (Finding D-03)**:
   - When an offline cash refund is marked `CANCELLED` or `REJECTED`, the system must reverse the `OFFLINE_REFUND_PAYABLE` credit back into the operator's receivable account and platform commission revenue account.
   - Ensure refund status updates execute through a double-entry reversal engine.
2. **Expired Promo Credit Sweeper Cron & Ledger Reconciliations (Finding C-02)**:
   - Create or update the cron sweep for expired promo credits to:
     - Mark expired `CreditLot` records (`status: 'ACTIVE'`, `remainingXOF > 0`, `expiresAt <= now`) as `EXPIRED`.
     - Post double-entry ledger reversals (DEBIT `PROMO_CREDITS`, CREDIT `PROMO_EXPENSE_PLATFORM`) for the unspent amounts.
3. **Claim Concurrency Row-Level Locks (Finding C-03)**:
   - Add database row-level locking (`SELECT ... FOR UPDATE` or atomic condition updates) in `claimCreditGrant` in `claim-credit-grant-service.ts` to prevent race conditions during reward code claims.

---

## 2. Touchpoint Files

| File Path | Description of Changes |
| :--- | :--- |
| [`apps/web/features/payments/services/refund-status-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/refund-status-service.ts) (or relevant refund router) | Implement double-entry void reversal when offline cash refunds are cancelled or rejected. |
| [`apps/web/app/api/cron/sweep-expired-credits/route.ts`](file:///C:/dev/moja-buss/apps/web/app/api/cron/sweep-expired-credits/route.ts) / [`apps/web/features/discounts/services/credit-expiry-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/credit-expiry-service.ts) | Sweep expired credit lots and post double-entry expiration reversals. |
| [`apps/web/features/discounts/services/claim-credit-grant-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/claim-credit-grant-service.ts) | Add row-level concurrency locking on credit grant claims. |

---

## 3. Verification Criteria

1. Offline refund void reversals correctly restore operator receivables and balance accounting journals.
2. Expired credit lots are safely expired with corresponding ledger debits to `PROMO_CREDITS`.
3. Concurrency locks prevent duplicate reward claim grants.
4. All unit tests and turbo typechecks pass with 100% success rate.
