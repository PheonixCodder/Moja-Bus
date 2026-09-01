# Category B & C Audit: Discounts, Coupons, Promo Credits & Ledger Integrity

## Scope Inspected
- Discount Engine: [`evaluate.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/evaluate.ts), [`auto-apply.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/auto-apply.ts), [`benefits.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/benefits.ts), [`eligibility.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/eligibility.ts), [`stacking.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/stacking.ts)
- Quote & Reservation Services: [`quote-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/quote-service.ts)
- Grants & Claims: [`promo-grant-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/promo-grant-service.ts), [`claim-credit-grant-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/claim-credit-grant-service.ts), [`credit-grant-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/credit-grant-service.ts)
- Referral Engine: [`referral-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/referral-service.ts)
- Status Sweeps: [`incentive-status-sweep.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/incentive-status-sweep.ts)

---

## Detailed Findings

### 1. [CRITICAL] Silent Platform Treasury Drain on Operator-Funded Discount Coupons
- **Location:** [`apps/web/features/payments/services/booking-confirmation-service.ts:177-294`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts#L177-L294) and [`apps/web/features/booking/services/booking-hold-service.ts:250-295`](file:///C:/dev/moja-buss/apps/web/features/booking/services/booking-hold-service.ts#L250-L295)
- **The Flaw:** When an operator creates an operator-funded discount coupon (e.g. 20% off), `freezeDiscountOnHold` records `operatorPromoFundedXOF` in `pricing_snapshot`, but **does NOT reduce `snapshot.operatorNetXOF` or `snapshot.chargeAmountXOF`**.
  - During Paystack booking confirmation in `BookingConfirmationService.ts`:
    - The engine debits `PAYSTACK_CLEARING` for the **pre-discount full fare amount** (`snapshot.chargeAmountXOF`).
    - The engine credits `OPERATOR_RECEIVABLE` for the **full undiscounted operator net** (`snapshot.operatorNetXOF`).
    - `postOperatorContra` is set to `false`, so no contra-revenue entry is posted to the operator.
- **Exploit Scenario & Financial Impact:**
  - Ticket gross price: 10,000 XOF (Operator Net = 9,500 XOF, Commission = 500 XOF).
  - Operator creates a 2,000 XOF operator-funded coupon.
  - Passenger pays 8,000 XOF on Paystack.
  - The confirmation service credits the operator with **9,500 XOF** and debits `PAYSTACK_CLEARING` for **10,000 XOF**.
  - Paystack only settled 8,000 XOF into the bank.
  - When the operator clears escrow and withdraws 9,500 XOF, the platform **pays the 2,000 XOF operator discount out of the platform's own fiat bank treasury**!

---

### 2. [HIGH] Admin Promo Grant Creates DB CreditLot Without Ledger Posting
- **Location:** [`apps/web/features/discounts/services/promo-grant-service.ts:45-56`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/promo-grant-service.ts#L45-L56)
- **The Flaw:** In `promo-grant-service.ts`, `grantPromoCredits` creates a `CreditLot` with `status = "ACTIVE"`, but **never calls `postPromoCreditGrantLedger`**.
- **Systemic Failure:**
  - The user's `financialAccount` of class `PROMO_CREDITS` is never credited in the ledger.
  - When the user tries to checkout using these promo credits, `AccountingEngine` attempts to debit `PROMO_CREDITS` (balance = 0, `allowNegativeBalance = false`).
  - `AccountingEngine` throws: `Insufficient funds for account ...`.
  - The checkout fails with: *"Promo credits unavailable — contact support if this persists"*.

---

### 3. [HIGH] Coupon Redemption Count Leaked on Pending Payment Promo Edits
- **Location:** [`apps/web/features/discounts/services/quote-service.ts:365-388`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/quote-service.ts#L365-L388)
- **The Flaw:** In `refreezeHoldDiscounts` (called when a user types, tests, or changes promo codes in the pending payment screen), the system deletes existing `RESERVED` redemptions and releases campaign budget, but **fails to decrement `couponCode.redemptionCount`**.
- **Exploit Scenario:**
  - A single-use coupon (`maxRedemptions = 1`) is applied to a hold. `redemptionCount` becomes `1`.
  - The user re-applies or edits promo parameters on the checkout screen.
  - `refreezeHoldDiscounts` runs, deletes the reservation, and calls `reserveDiscountOnHold` again.
  - `reserveDiscountOnHold` increments `redemptionCount` to `2` (exceeding `maxRedemptions`).
  - The coupon is now permanently exhausted and dead without any booking ever being completed.

---

### 4. [MEDIUM] Permanent Ledger Asymmetry on Credit Lot Expiration
- **Location:** [`apps/web/features/discounts/services/incentive-status-sweep.ts:17-23`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/incentive-status-sweep.ts#L17-L23)
- **The Flaw:** When `sweepIncentiveStatuses` runs via cron and marks expired `CreditLot` rows as `"EXPIRED"`, it does not post an accounting reversal for the unredeemed balances.
- **Impact:**
  - The platform's balance sheet permanently reports unredeemed marketing liabilities in `PROMO_CREDITS` and inflated `PROMO_EXPENSE_PLATFORM` expense balances that cannot be spent or reconciled.

---

### 5. [MEDIUM] Concurrency Race Bypassing Campaign Redemption Limits in Claims
- **Location:** [`apps/web/features/discounts/services/claim-credit-grant-service.ts:136-169`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/claim-credit-grant-service.ts#L136-L169)
- **The Flaw:** In `claimCreditGrant`, checks for `maxRedemptionsGlobal` and `maxRedemptionsPerUser` are performed using non-locking `prisma.creditLot.count()` queries outside the transaction.
- **Exploit Scenario:** A user or group of bots sending 20 concurrent HTTP requests with distinct coupon codes from a campaign with `maxRedemptionsPerUser = 1` will pass the pre-check concurrently and successfully mint 20 `CreditLot` grants.
