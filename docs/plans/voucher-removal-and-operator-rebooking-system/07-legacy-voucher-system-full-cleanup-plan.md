# Phase 6: Complete Legacy Voucher System Elimination & Codebase Purge Plan

This plan details the exhaustive purge of all residual monetary voucher logic, ledger accounts, notification workflows, administrative settings, mobile app components, and static copy across the entire codebase.

---

## 1. Domain-by-Domain Clean-Up Scope

### 1.1 Core Discounts & Engine Layer (`apps/web/features/discounts`)
1. **[`voucher-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/voucher-service.ts):**
   - Delete obsolete `createCancellationVoucherRecord`, `issueMonetaryVoucher`, `listMyVouchers`, and `listVouchersForAdmin` (all administrative and promotional grants are now handled by [`promo-grant-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/promo-grant-service.ts) using `CreditLot`).
2. **[`campaign-loader.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/campaign-loader.ts):**
   - Remove `loadUserVoucher` and `EvalVoucher` type imports.
3. **[`expiry-reminders.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/expiry-reminders.ts):**
   - Remove `prisma.monetaryVoucher.findMany` sweep and `notifyVoucherExpiring`. Sweep only expiring `creditLots`.
4. **[`incentive-status-sweep.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/incentive-status-sweep.ts):**
   - Remove `prisma.monetaryVoucher.updateMany` query. Sweep only `creditLots` and campaign windows.
5. **[`notify.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/notify.ts):**
   - Remove `notifyVoucherIssued` and `notifyVoucherExpiring` notification dispatchers.
6. **[`promo-ceilings.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/lib/promo-ceilings.ts) & [`promo-policy.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/lib/promo-policy.ts):**
   - Remove `MAX_PROMOTIONAL_VOUCHERS_PER_USER`, `PROMOTIONAL_VOUCHER_SOURCES`, and `maxPromotionalVouchersPerUser` ceiling checks.
7. **[`engine/types.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/types.ts), [`engine/stacking.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/stacking.ts), [`engine/auto-apply.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/auto-apply.ts):**
   - Remove `"MONETARY_VOUCHER"` from `InstrumentType` and delete `EvalVoucher` and `voucherAppliedXOF`.

---

### 1.2 Accounting, Ledger & Payments Layer (`apps/web/features/payments`)
1. **[`booking-confirmation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts):**
   - Remove `getPlatformVoucherLiabilityAccount()` calls in both wallet and Paystack checkout flows.
   - Remove `voucherLiabilityId` and `voucherAppliedXOF` from `postPromoLedgerForHoldConfirmation`.
2. **[`promo-ledger.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/promo-ledger.ts) & [`promo-payment-split.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/promo-payment-split.ts):**
   - Remove `VOUCHER_LIABILITY` debit handling and `voucherAppliedXOF` calculations.
3. **[`account-classes.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/account-classes.ts):**
   - Remove `VOUCHER_LIABILITY` account class definition.
4. **[`cancel-trip-with-refunds.ts`](file:///C:/dev/moja-buss/apps/web/lib/cancel-trip-with-refunds.ts):**
   - Remove `"VOUCHER"` from `TripRefundChannel`, restricting whole-trip cancellations to `"WALLET"` or `"CASH"`.
5. **[`checkout-payable.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/checkout-payable.ts):**
   - Clean out `voucherAppliedXOF` from payable calculations.

---

### 1.3 Operator & Admin Dashboard UI (`apps/web`)
1. **[`manifest-drawer.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/trips/manifest-drawer.tsx):**
   - Remove `"VOUCHER"` from `bulkChannel` state and refund options in the operator whole-trip cancellation modal.
2. **[`admin-campaigns-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/views/admin-campaigns-view.tsx):**
   - Replace "Open voucher liability" and "Voucher liability aging" KPI cards with **"Open Promo Credits Liability"** (active `CreditLot` balance sums and 0–30d, 30–90d, 90–365d, 365d+ aging breakdown).
3. **[`admin-settings-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/views/admin-settings-view.tsx):**
   - Remove form fields for `maxPromotionalVouchersPerUser` entirely.

---

### 1.4 Mobile Traveler App (`apps/traveler-app`)
1. **[`promo-incentives.tsx`](file:///C:/dev/moja-buss/apps/traveler-app/features/settings/components/promo-incentives.tsx):**
   - Remove `vouchersQuery` and the "Active vouchers" section. Display active promo credits and referral incentives.
2. **[`personal-info-form.tsx`](file:///C:/dev/moja-buss/apps/traveler-app/features/settings/components/personal-info-form.tsx) & [`terms-privacy.tsx`](file:///C:/dev/moja-buss/apps/traveler-app/features/settings/screens/terms-privacy.tsx):**
   - Update copy: replace "loyalty vouchers" and "operator trip vouchers" with "Promo Credits" and "Instant Rebooking / Wallet Refund".
3. **[`locales/en/wallet.json`](file:///C:/dev/moja-buss/apps/traveler-app/locales/en/wallet.json) & [`locales/fr/wallet.json`](file:///C:/dev/moja-buss/apps/traveler-app/locales/fr/wallet.json):**
   - Purge voucher translation strings (`promoVouchersTitle`, `promoVouchersEmpty`, `promoVoucherCeiling`).

---

### 1.5 Notification Workflows (`apps/web/features/notifications/workflows`)
1. **[`passenger/promo-incentives.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/passenger/promo-incentives.ts) & [`workflows/index.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/index.ts):**
   - Remove `passenger-voucher-issued` and `passenger-voucher-expiring` Novu workflow definitions.

---

### 1.6 Public FAQ, Terms & Localization (`apps/web`)
1. **[`faq.ts`](file:///C:/dev/moja-buss/apps/web/features/home/data/faq.ts) & [`terms.ts`](file:///C:/dev/moja-buss/apps/web/features/home/data/terms.ts):**
   - Update passenger FAQ answers and terms: cancellations are processed via Moja Wallet, original cash refund, or operator direct rebooking.
2. **[`messages/en.json`](file:///C:/dev/moja-buss/apps/web/messages/en.json) & [`messages/fr.json`](file:///C:/dev/moja-buss/apps/web/messages/fr.json):**
   - Remove unused voucher string keys across admin, operator, and passenger namespaces.

---

## 2. Step-by-Step Execution Sequence

| Step | Action | Files Modified | Verification |
|---|---|---|---|
| **Step 1** | Clean Discounts Services & Engine | `voucher-service.ts`, `campaign-loader.ts`, `expiry-reminders.ts`, `incentive-status-sweep.ts`, `notify.ts`, `promo-ceilings.ts`, `types.ts`, `auto-apply.ts` | `npm test` in `apps/web` |
| **Step 2** | Clean Accounting & Confirmation Ledger | `booking-confirmation-service.ts`, `promo-ledger.ts`, `promo-payment-split.ts`, `account-classes.ts`, `cancel-trip-with-refunds.ts`, `checkout-payable.ts` | Accounting & confirmation test suites pass |
| **Step 3** | Operator & Admin Dashboard UI Purge | `manifest-drawer.tsx`, `admin-campaigns-view.tsx` (Promo Credits Liability), `admin-settings-view.tsx` | Visual check & type check |
| **Step 4** | Mobile Traveler App Cleanup | `promo-incentives.tsx`, `personal-info-form.tsx`, `terms-privacy.tsx`, `wallet.json` (en/fr) | `tsc` on traveler-app |
| **Step 5** | Notification Workflows Purge | `promo-incentives.ts`, `workflows/index.ts` | Novu bridge builds cleanly |
| **Step 6** | Copy, Terms & Localization Sync | `faq.ts`, `terms.ts`, `messages/en.json`, `messages/fr.json` | Copy integrity verified |
| **Step 7** | Full Monorepo Compilation & Test Pass | All packages & apps | `tsc --noEmit` exit 0, `npm test` 340+ pass |
