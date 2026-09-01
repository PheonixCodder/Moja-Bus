# Wave 2 Implementation Plan: Checkout Blockers & Admin Ledger Controls

**Date:** 2026-08-31  
**Status:** IN PROGRESS  
**Author:** Antigravity Architect  
**Scope:** Fix Checkout Drawer Routing (Wallet & 0 XOF Free Tickets), Admin Promo Ledger Sync, and Coupon Concurrency

---

## 1. Objectives

1. **Fix Checkout Drawer Routing (`checkout-drawer-form.tsx`)**:
   - Detect when payment method is `WALLET` or when `payableAmount === 0` (100% promo/discount covered).
   - Route `WALLET` selections to `confirmFromWallet` TRPC mutation.
   - Route `0 XOF` payable amounts to zero-cash confirmation (calling `confirmFromWallet` with 0 cash or dedicated confirm endpoint) without initializing a Paystack charge.
   - Guard minimum Paystack charge: ensure Paystack `initializePayment` is only invoked when `paymentMethod === 'PAYSTACK'` and `payableAmount >= 100` XOF.
2. **Admin Manual Promo Credit Grant Ledger Commit**:
   - Ensure all manual promo credit grants created in `credit-management-service.ts` (or admin promo grant endpoints) invoke `postPromoCreditGrantLedger` atomically within the database transaction.
   - Prevent drift between `CreditLot` sum and `FinancialAccount.balance` for `PROMO_CREDITS`.
3. **Single-Use Coupon Concurrency Defense**:
   - Enforce concurrency protection so single-use coupons (`maxUsagePerUser === 1` or global usage caps) cannot be simultaneously claimed by racing browser tabs or concurrent holds.

---

## 2. Touchpoint Files

| File Path | Description of Changes |
| :--- | :--- |
| [`apps/web/features/search/components/checkout-drawer-form.tsx`](file:///C:/dev/moja-buss/apps/web/features/search/components/checkout-drawer-form.tsx) | Fix submission handler to route `WALLET` and `0 XOF` zero-cash payments correctly instead of unconditionally calling Paystack `initializePayment`. |
| [`apps/web/features/admin/services/credit-management-service.ts`](file:///C:/dev/moja-buss/apps/web/features/admin/services/credit-management-service.ts) (or admin promo grant service) | Integrate `postPromoCreditGrantLedger` inside admin manual credit lot creation transaction. |
| [`apps/web/features/discounts/engine/coupon-code.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/coupon-code.ts) / [`quote-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/quote-service.ts) | Enforce concurrency safety and active reservation count validation for user/global single-use coupons. |

---

## 3. Verification Criteria

1. Drawer form handles `PAYSTACK`, `WALLET`, and `0 XOF` flows cleanly.
2. Admin promo grants create matching double-entry ledger records.
3. Unit and integration tests pass with 100% success rate.
4. Turbo typecheck passes with 0 errors across all 12 monorepo packages.
