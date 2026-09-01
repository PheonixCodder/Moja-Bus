# Category A Audit: Checkout & Payment Flow Mechanics

## Scope Inspected
- Gateway Integration: [`PaystackClient`](file:///C:/dev/moja-buss/apps/web/features/payments/providers/paystack-client.ts) & [`PaymentService`](file:///C:/dev/moja-buss/apps/web/features/payments/payment-service.ts)
- Webhook Ingestion: [`/api/webhooks/paystack/route.ts`](file:///C:/dev/moja-buss/apps/web/app/api/webhooks/paystack/route.ts)
- Pricing & Canonical Payables: [`pricing-resolver.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/pricing-resolver.ts) & [`checkout-payable.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/checkout-payable.ts)
- Seat Hold Concurrency: [`booking-hold-service.ts`](file:///C:/dev/moja-buss/apps/web/features/booking/services/booking-hold-service.ts)
- Confirmation & Ledger Commit: [`booking-confirmation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts)

---

## Detailed Findings

### 1. [CRITICAL] Checkout Drawer UI Ignores "Wallet" and "0 XOF Free Booking" Selections
- **Location:** [`apps/web/features/booking/components/booking-checkout-form.tsx:331-348`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-checkout-form.tsx#L331-L348)
- **The Flaw:** In `BookingCheckoutForm.tsx`, when a passenger chooses `paymentMethod = "WALLET"` or when a 100% discount reduces the price to `0 XOF` (`isZeroCash = true`), `handleSubmit` unconditionally triggers `completePayment()` from `usePaystackCheckout()` instead of branching to `trpc.booking.checkoutWithWallet.mutateAsync({ holdId })`.
- **Systemic Impact:**
  - **Zero Cash Failure:** For free tickets (100% promo/credit discount), `initiatePayment` passes `amountXOF = 0` to Paystack, which rejects amounts under 100 XOF, blocking free promotional bookings entirely.
  - **Wallet Bypass:** Users who select "Complete with Wallet" are forced into the Paystack card/mobile money gateway modal, making direct wallet checkout from the search drawer impossible.

---

### 2. [CRITICAL] Race Condition & Double Crediting in Wallet Top-Up and Webhooks
- **Location:** [`apps/web/features/payments/payment-service.ts:667-735`](file:///C:/dev/moja-buss/apps/web/features/payments/payment-service.ts#L667-L735) and [`packages/db/prisma/schema.prisma:1983-2006`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L1983-L2006)
- **The Flaw:** In `processTopUp`, the check `financialTransaction.findFirst({ where: { externalPaymentId, type: "TOP_UP" } })` runs outside the transaction. Inside `AccountingEngine`, `businessIdempotencyKey` is not passed. In `schema.prisma`, `@@index([externalPaymentId, type])` is an index, **not a unique constraint**.
- **Exploit Scenario:** When a user completes a Paystack top-up, their browser immediately triggers `verifyWalletTopUp` while Paystack sends the `charge.success` webhook. If both requests execute concurrently within the same 50ms window:
  1. Both pass the `findFirst` check.
  2. Both execute `engine.commit(tx)`.
  3. Because `businessIdempotencyKey` is `null` and there is no unique constraint on `(externalPaymentId, type)`, both transactions commit.
  4. The passenger's Moja Wallet is **credited twice** for a single fiat deposit.

---

### 3. [HIGH] Double Credit Vulnerability on Orphaned Payment Rescue
- **Location:** [`apps/web/features/payments/services/booking-confirmation-service.ts:781-862`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts#L781-L862)
- **The Flaw:** `rescueOrphanedPayment` credits the user's wallet when payment arrives after the 15-minute hold expiry. However, `AccountingEngine` is invoked without setting `idempotencyKey: 'RESCUE_${payment.id}'`. Concurrent execution of webhook and client verify calls before `holdGroup.update` commits can post duplicate `ORPHANED_PAYMENT_RESCUE` ledger transactions.

---

### 4. [HIGH] Inconsistent Paystack Fee Deduction / Net Clearing Settlement
- **Location:** [`apps/web/features/payments/services/booking-confirmation-service.ts:182-192`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts#L182-L192)
- **The Flaw:** In `confirmFromPayment`, `clearingNet` is calculated as `snapshot.chargeAmountXOF - feesXOF`, where `feesXOF` is retrieved from `payment.feesXOF` (the Paystack gateway processing fee).
  - If `payment.feesXOF` is recorded, the double-entry transaction posts:
    - DEBIT `PAYSTACK_CLEARING` with `clearingNet`
    - DEBIT `PAYMENT_PROCESSOR_FEES` with `feesXOF`
  - However, when Paystack webhook `charge.success` is received, `feesXOF` is parsed from `payload.data.fees`. In Côte d'Ivoire Paystack integration, if `fees` is reported in sub-units or null, `feesXOF` defaults to 0. If `feesXOF` is 0 during confirmation but Paystack later settles net of fees in the bank account, `PAYSTACK_CLEARING` accumulates an un-reconciled debit balance representing phantom asset value.

---

### 5. [MEDIUM] XOF Currency Invariants & Zero-Decimal Protection
- **Status:** **VERIFIED & SECURE**
- **Analysis:**
  - `roundXOF(val)` in `apps/web/features/discounts/engine/types.ts` strictly uses `Math.round(val)`.
  - In `benefits.ts`, split funding uses:
    $$PlatformShare = \text{roundXOF}\left(\frac{\text{Discount} \times \text{PlatformShareBps}}{10000}\right)$$
    $$OperatorShare = \text{Discount} - PlatformShare$$
  - This ensures that $PlatformShare + OperatorShare \equiv \text{Discount}$ exactly, preventing fractional CFA Franc leakage.
  - `AccountingEngine.validate()` enforces `Number.isSafeInteger(amount)` and rejects any negative or non-integer numbers before committing to PostgreSQL.

---

### 6. [MEDIUM] Seat Hold Concurrency & Overbooking Prevention
- **Status:** **VERIFIED & SECURE**
- **Analysis:**
  - In `BookingHoldService.createHold`, segment clash detection runs under an explicit row lock:
    `SELECT id FROM "trip" WHERE id = ${input.tripId} FOR UPDATE`
  - Overlapping segment bookings are checked against active holds (`holdExpiresAt > now`).
  - In `BookingConfirmationService.confirmFromPayment`, segment overlaps are re-checked inside a `Serializable` transaction prior to transitioning status from `PENDING_PAYMENT` to `CONFIRMED`.
