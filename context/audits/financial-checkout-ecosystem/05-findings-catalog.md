# Comprehensive Financial & Checkout Findings Catalog

---

### [CRITICAL] - Promo Credits Converted to Real Fiat Cash via Booking Cancellation Arbitrage
- **Location:** [`apps/web/features/payments/services/cancellation-service.ts:279-339`](file:///C:/dev/moja-buss/apps/web/features/payments/services/cancellation-service.ts#L279-L339) and [`apps/web/features/payments/lib/cancellation-policy.ts:31-56`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/cancellation-policy.ts#L31-L56)
- **The Flaw:** When a booking funded partially or entirely by non-withdrawable promotional marketing credits (`PROMO_CREDITS`) is cancelled, the cancellation engine calculates `refundAmountXOF` against the full undiscounted gross fare (`subtotalBaseXOF`) and credits 100% of the refund into the passenger's fiat Moja Wallet (`PASSENGER_WALLET`). The difference is clawed back from the operator's receivable account and platform commission, effectively laundering promotional credits into withdrawable cash.
- **Exploit Scenario:**
  1. An attacker earns 10,000 XOF in free promotional credits via referral programs or marketing campaigns.
  2. Attacker books a 10,000 XOF ticket using 10,000 XOF in promo credits (paying 0 XOF real cash).
  3. Attacker clicks "Cancel Booking" on their dashboard before departure.
  4. The system debits the operator's account 9,500 XOF and debits platform commission 500 XOF, then credits 10,000 XOF directly into the attacker's `PASSENGER_WALLET`.
  5. The attacker initiates a cash withdrawal or uses the fiat balance, extracting 10,000 XOF in real money from the company's accounts.
- **Remediation:** In `cancellation-policy.ts` and `cancellation-service.ts`, split the refund calculation by tender type. Only the actual fiat amount paid from `PASSENGER_WALLET` or `ExternalPayment` may be credited back to `PASSENGER_WALLET`. The portion funded by `PROMO_CREDITS` must be restored as an active `CreditLot` and credited to `PROMO_CREDITS` in the ledger, with the platform promo expense reversed.

---

### [CRITICAL] - Silent Platform Treasury Drain on Operator-Funded Discount Coupons
- **Location:** [`apps/web/features/payments/services/booking-confirmation-service.ts:177-294`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts#L177-L294) and [`apps/web/features/booking/services/booking-hold-service.ts:250-295`](file:///C:/dev/moja-buss/apps/web/features/booking/services/booking-hold-service.ts#L250-L295)
- **The Flaw:** When an operator issues an operator-funded discount coupon, `PricingSnapshot` records `operatorPromoFundedXOF`, but `snapshot.operatorNetXOF` and `snapshot.chargeAmountXOF` are not reduced. During Paystack confirmation, the ledger debits `PAYSTACK_CLEARING` for the pre-discount full fare and credits `OPERATOR_RECEIVABLE` for the full undiscounted net revenue. Because `postOperatorContra` is disabled, the platform pays the operator's discount out of its own bank account upon operator withdrawal.
- **Exploit Scenario:**
  1. An operator creates a 50% operator-funded promotional coupon for a 10,000 XOF ticket (Operator Net = 9,500 XOF).
  2. A traveler buys the ticket for 5,000 XOF via Paystack Mobile Money.
  3. The platform receives 5,000 XOF in its Paystack merchant account.
  4. The confirmation ledger transaction credits the operator's receivable with the full 9,500 XOF.
  5. When the operator requests a payout, the platform transfers 9,500 XOF to the operator's bank, losing 4,500 XOF of platform capital on a single transaction.
- **Remediation:** Update `BookingHoldService` and `BookingConfirmationService` so that operator-funded discounts directly reduce the credited `operatorNetXOF` ($\text{operatorNetXOF} = \text{baseNetXOF} - \text{operatorPromoFundedXOF}$) or debit `PROMO_CONTRA_OPERATOR` in the double-entry commit.

---

### [CRITICAL] - Double Crediting in Wallet Top-Up via Webhook & Verification Concurrency Race
- **Location:** [`apps/web/features/payments/payment-service.ts:667-735`](file:///C:/dev/moja-buss/apps/web/features/payments/payment-service.ts#L667-L735) and [`packages/db/prisma/schema.prisma:1983-2006`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L1983-L2006)
- **The Flaw:** In `processTopUp`, the check for existing transactions is executed outside the database transaction. In `schema.prisma`, `@@index([externalPaymentId, type])` is an index rather than a unique constraint, and `AccountingEngine` is instantiated without passing `idempotencyKey`. Concurrent execution of the client-side `verifyWalletTopUp` mutation and Paystack's incoming `charge.success` webhook allows two transactions to commit simultaneously.
- **Exploit Scenario:**
  1. A user initiates a 50,000 XOF wallet top-up via Paystack.
  2. Upon entering the OTP, Paystack issues a redirect to the client while simultaneously firing the server webhook.
  3. The client hits `verifyWalletTopUp` at $T=0\text{ms}$; the webhook hits `/api/webhooks/paystack` at $T=5\text{ms}$.
  4. Both routines find no prior transaction and commit a `TOP_UP` ledger entry.
  5. The user's wallet is credited with **100,000 XOF** for a 50,000 XOF deposit.
- **Remediation:** Pass `idempotencyKey: 'TOP_UP_${payment.id}'` to `AccountingEngine` in `processTopUp`, and enforce a database-level `UNIQUE` constraint on `businessIdempotencyKey` on the `FinancialTransaction` model in `schema.prisma`.

---

### [CRITICAL] - Search Drawer Checkout Form Unconditionally Bypasses Wallet and Fails on 0 XOF
- **Location:** [`apps/web/features/booking/components/booking-checkout-form.tsx:331-348`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-checkout-form.tsx#L331-L348)
- **The Flaw:** In `BookingCheckoutForm.tsx`, `handleSubmit` unconditionally invokes `completePayment()` from the `usePaystackCheckout` hook, ignoring whether `paymentMethod === "WALLET"` or `isZeroCash === true`.
- **Exploit Scenario:**
  1. A passenger with sufficient Moja Wallet balance selects "Complete with Wallet" or applies a 100% discount coupon (0 XOF total).
  2. The passenger clicks "Complete with Wallet" / "Confirm Free Booking".
  3. The frontend passes the request to Paystack instead of `trpc.booking.checkoutWithWallet`.
  4. For 0 XOF bookings, Paystack rejects the transaction with a minimum amount error. For wallet bookings, the user is redirected to enter mobile money details instead of using their wallet balance.
- **Remediation:** In `BookingCheckoutForm.tsx`, check `paymentMethod` and `isZeroCash`. If `paymentMethod === "WALLET"` or `isZeroCash === true`, call `trpc.booking.checkoutWithWallet.mutateAsync({ holdId: holdResult.holdId })` directly.

---

### [HIGH] - Duplicate Ledger Posting on Orphaned Payment Rescue
- **Location:** [`apps/web/features/payments/services/booking-confirmation-service.ts:781-862`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts#L781-L862)
- **The Flaw:** When a payment succeeds for an expired hold, `rescueOrphanedPayment` credits the user's wallet. Because `AccountingEngine` does not receive `idempotencyKey`, simultaneous webhook and client verify calls can post duplicate rescue transactions before the hold status is updated to `EXPIRED`.
- **Exploit Scenario:**
  1. A user pays after the 15-minute timer expires.
  2. Client verification and Paystack webhook arrive simultaneously.
  3. Both execute `rescueOrphanedPayment` and credit the user's wallet twice.
- **Remediation:** Pass `idempotencyKey: 'RESCUE_${payment.id}'` to `AccountingEngine` in `rescueOrphanedPayment`.

---

### [HIGH] - Admin Promo Grant Bypasses Ledger Posting Causing Checkout Crashes
- **Location:** [`apps/web/features/discounts/services/promo-grant-service.ts:45-56`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/promo-grant-service.ts#L45-L56)
- **The Flaw:** `grantPromoCredits` inserts an active `CreditLot` into the database but never calls `postPromoCreditGrantLedger`. The passenger's `PROMO_CREDITS` ledger account remains at 0 balance.
- **Exploit Scenario:**
  1. Customer support issues a 2,000 XOF goodwill credit to a user.
  2. The user sees 2,000 XOF in their UI and attempts to book a ticket.
  3. During checkout confirmation, `AccountingEngine` attempts to debit `PROMO_CREDITS`.
  4. Because the balance is 0 and negative balances are forbidden, `AccountingEngine` throws an `Insufficient funds` error, crashing the checkout.
- **Remediation:** Update `grantPromoCredits` in `promo-grant-service.ts` to call `postPromoCreditGrantLedger` inside a database transaction, identical to `grantAdminCreditLot` in `credit-grant-service.ts`.

---

### [HIGH] - Single-Use Coupons Leaked and Exhausted During Checkout Promo Edits
- **Location:** [`apps/web/features/discounts/services/quote-service.ts:365-388`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/quote-service.ts#L365-L388)
- **The Flaw:** In `refreezeHoldDiscounts`, existing `RESERVED` redemptions are deleted, but `couponCode.redemptionCount` is not decremented. When the new reservation is made, `redemptionCount` is incremented again.
- **Exploit Scenario:**
  1. A user enters a single-use coupon (`maxRedemptions = 1`). `redemptionCount` increments from 0 to 1.
  2. The user changes a passenger name or seat on the checkout page, triggering `refreezeHoldDiscounts`.
  3. `refreezeHoldDiscounts` deletes the old reservation but leaves `redemptionCount = 1`.
  4. `reserveDiscountOnHold` tries to increment `redemptionCount` to 2, which exceeds `maxRedemptions` and fails.
  5. The valid coupon is now permanently locked and unusable.
- **Remediation:** In `refreezeHoldDiscounts`, decrement `couponCode.redemptionCount` for any active reservations being cleared.

---

### [HIGH] - Free Promotional Bookings Lose Credits Permanently on Trip Cancellation
- **Location:** [`apps/web/features/payments/services/cancellation-service.ts:175-180`](file:///C:/dev/moja-buss/apps/web/features/payments/services/cancellation-service.ts#L175-L180)
- **The Flaw:** When a zero-cash booking is cancelled, `cancellation-service.ts` exits immediately with `{ refund: null }` and does not restore the spent `CreditLot` or decrement the coupon redemption count.
- **Exploit Scenario:**
  1. A user books a bus ride using their earned promo credits.
  2. The bus operator cancels the trip due to mechanical issues.
  3. The booking is marked cancelled, but the user receives 0 XOF in wallet refund and their promo credits remain spent and expired.
- **Remediation:** When cancelling a zero-cash or credit-funded booking, restore the `remainingXOF` on the associated `CreditLot`, post a ledger credit to `PROMO_CREDITS` and debit to `PROMO_EXPENSE_PLATFORM`, and reset the `DiscountRedemption` status to `CANCELLED`.

---

### [MEDIUM] - Permanent Ledger Discrepancy on Promo Credit Lot Expiration
- **Location:** [`apps/web/features/discounts/services/incentive-status-sweep.ts:17-23`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/incentive-status-sweep.ts#L17-L23)
- **The Flaw:** The daily cron `sweepIncentiveStatuses` updates expired `CreditLot` records to `status: "EXPIRED"`, but does not post double-entry ledger reversals for the unspent balances.
- **Impact:** `PROMO_CREDITS` liabilities and `PROMO_EXPENSE_PLATFORM` expenses remain permanently overstated on the platform balance sheet.
- **Remediation:** In `sweepIncentiveStatuses`, post an `EXPIRATION_REVERSAL` transaction in `AccountingEngine` for each expired lot with `remainingXOF > 0` (DEBIT `PROMO_CREDITS`, CREDIT `PROMO_EXPENSE_PLATFORM`).

---

### [MEDIUM] - Concurrency Race Bypassing Campaign Redemption Limits
- **Location:** [`apps/web/features/discounts/services/claim-credit-grant-service.ts:136-169`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/claim-credit-grant-service.ts#L136-L169)
- **The Flaw:** User and global redemption caps are checked using non-locking `prisma.creditLot.count()` queries outside the transaction in `claimCreditGrant`.
- **Impact:** High-concurrency bot requests can exceed `maxRedemptionsPerUser` and `maxRedemptionsGlobal`.
- **Remediation:** Move the count validation inside the database transaction with row-level locks on the `DiscountCampaign` row (`SELECT ... FOR UPDATE`).

---

### [MEDIUM] - Voided Offline Cash Refunds Leave Unreversed Operator Clawbacks
- **Location:** [`apps/web/features/payments/services/offline-refund-fulfilment.ts:84-114`](file:///C:/dev/moja-buss/apps/web/features/payments/services/offline-refund-fulfilment.ts#L84-L114)
- **The Flaw:** When an offline refund (`CASH`) is voided via `markOfflineRefundVoid`, the refund status is updated to `VOIDED`, but no accounting transaction is posted to reverse the clawback from `OPERATOR_RECEIVABLE`.
- **Impact:** Operators remain penalized for refunds that were never disbursed to passengers.
- **Remediation:** In `markOfflineRefundVoid`, commit an `AccountingEngine` reversal transaction (DEBIT `OFFLINE_REFUND_PAYABLE`, CREDIT `OPERATOR_RECEIVABLE`).

---

### [LOW] - Missing Paystack Fee Recording Leaves Reconciliation Drift in Clearing
- **Location:** [`apps/web/features/payments/services/booking-confirmation-service.ts:182-192`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts#L182-L192)
- **The Flaw:** When Paystack webhooks omit `payload.data.fees`, `feesXOF` defaults to 0. When Paystack later settles the net amount into the platform's bank account, `PAYSTACK_CLEARING` retains an un-reconciled debit balance.
- **Remediation:** Compute expected Paystack interchange fees deterministically based on payment channel (e.g. 1.5% for Mobile Money) if `payload.data.fees` is missing.
