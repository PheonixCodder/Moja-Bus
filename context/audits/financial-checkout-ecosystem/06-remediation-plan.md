# Financial & Checkout Remediation Plan

This document outlines the phased engineering roadmap to fix the vulnerabilities and architectural gaps identified in the audit.

---

## Phase 1: Critical Financial & Security Hotfixes (Immediate)

### 1.1 Fix Promo Credit Laundering on Booking Cancellations
- **Files:** [`apps/web/features/payments/services/cancellation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/cancellation-service.ts), [`apps/web/features/payments/lib/cancellation-policy.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/cancellation-policy.ts)
- **Changes:**
  1. Inspect the `PricingSnapshot` and `DiscountRedemption` records associated with the cancelled booking to determine the exact tender breakdown:
     - `cashPaidXOF`: Paid via Moja Wallet or Paystack.
     - `promoCreditsPaidXOF`: Paid via `PROMO_CREDITS`.
     - `discountSubsidyXOF`: Discount funded by platform or operator coupon.
  2. For `channel === "WALLET"`, only credit `PASSENGER_WALLET` with `cashPaidXOF`.
  3. If `promoCreditsPaidXOF > 0`, re-credit `PROMO_CREDITS` and restore the `remainingXOF` on the passenger's `CreditLot` (or mint an unexpired reinstatement lot).
  4. Claw back `operatorNetXOF` only in proportion to the actual net operator revenue recognized at booking time.

### 1.2 Fix Operator-Funded Discount Leakage in Paystack Confirmations
- **Files:** [`apps/web/features/payments/services/booking-confirmation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts), [`apps/web/features/booking/services/booking-hold-service.ts`](file:///C:/dev/moja-buss/apps/web/features/booking/services/booking-hold-service.ts)
- **Changes:**
  1. When freezing discounts on a hold, calculate:
     $$\text{effectiveOperatorNetXOF} = \text{baseOperatorNetXOF} - \text{operatorPromoFundedXOF}$$
  2. Update `PricingSnapshot.operatorNetXOF` with `effectiveOperatorNetXOF`.
  3. In `confirmFromPayment`, ensure the credit to `OPERATOR_RECEIVABLE` equals `effectiveOperatorNetXOF`.
  4. Ensure `clearingNet` debited to `PAYSTACK_CLEARING` equals the actual cash charged after discounts (`snapshot.chargeAmountXOF`).

### 1.3 Add Unique Idempotency Constraints on Ledger Transactions
- **Files:** [`packages/db/prisma/schema.prisma`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma), [`apps/web/features/payments/payment-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/payment-service.ts), [`apps/web/features/payments/services/booking-confirmation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts)
- **Changes:**
  1. In `processTopUp`, pass `idempotencyKey: 'TOP_UP_${payment.id}'`.
  2. In `rescueOrphanedPayment`, pass `idempotencyKey: 'ORPHAN_RESCUE_${payment.id}'`.
  3. In `schema.prisma`, ensure `businessIdempotencyKey` on `FinancialTransaction` is strictly enforced with a unique index.

### 1.4 Route Wallet & 0 XOF Bookings Correctly in Search Drawer
- **Files:** [`apps/web/features/booking/components/booking-checkout-form.tsx`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-checkout-form.tsx)
- **Changes:**
  1. In `handleSubmit`, branch on `isZeroCash || paymentMethod === "WALLET"`:
     ```ts
     if (isZeroCash || paymentMethod === "WALLET") {
       const confirmed = await walletCheckoutMutation.mutateAsync({
         holdId: holdResult.holdId,
       });
       onConfirmed({ ... });
       return;
     }
     ```
  2. Maintain `completePayment()` exclusively for `paymentMethod === "PAYSTACK"` with `chargeAmountXOF > 0`.

---

## Phase 2: Discount & Ledger Consistency Fixes (Next Sprint)

### 2.1 Post Double-Entry Ledger on Admin Promo Grants
- **Files:** [`apps/web/features/discounts/services/promo-grant-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/promo-grant-service.ts)
- **Changes:** Integrate `postPromoCreditGrantLedger` inside a transaction in `grantPromoCredits`.

### 2.2 Fix Coupon Redemption Count Leaks in Pending Payment Refreeze
- **Files:** [`apps/web/features/discounts/services/quote-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/quote-service.ts)
- **Changes:** When deleting `RESERVED` redemptions in `refreezeHoldDiscounts`, decrement `couponCode.redemptionCount` for any active coupon codes being released.

### 2.3 Post Reversals on Voided Offline Cash Refunds
- **Files:** [`apps/web/features/payments/services/offline-refund-fulfilment.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/offline-refund-fulfilment.ts)
- **Changes:** When `markOfflineRefundVoid` executes, post an `AccountingEngine` transaction:
  - DEBIT `OFFLINE_REFUND_PAYABLE`
  - CREDIT `OPERATOR_RECEIVABLE`

### 2.4 Reconcile Expired Promo Credits in Double-Entry Ledger
- **Files:** [`apps/web/features/discounts/services/incentive-status-sweep.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/incentive-status-sweep.ts)
- **Changes:** In `sweepIncentiveStatuses`, post an `EXPIRATION_REVERSAL` transaction for expired lots:
  - DEBIT `PROMO_CREDITS`
  - CREDIT `PROMO_EXPENSE_PLATFORM`

---

## Phase 3: Financial Monitoring & Reconciliation Suite

### 3.1 Daily Double-Entry Equilibrium & Trial Balance Check
- Implement an automated daily cron that verifies:
  $$\sum_{\text{all accounts}} \text{postedBalance} \equiv 0$$
  $$\sum \text{CreditLot.remainingXOF} \equiv \text{Balance}(\text{PROMO\_CREDITS})$$

### 3.2 Automated Alerting on Treasury Discrepancies
- Configure Novu / Slack alerts whenever `PAYSTACK_CLEARING` diverges from Paystack settlement reports by more than 0.1% (interchange drift).
