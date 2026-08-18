# Chapter 1: Checkout & Payment Flows End-to-End

## 1. Overview of Checkout Architecture

The checkout system spans from the public search experience (`apps/web/app/[locale]/search/page.tsx`) through seat selection, pricing calculation, coupon/credit evaluation, hold creation, payment execution, to ticket issuance.

### Core Components & Handlers:
- **Search Entry Point:** [`apps/web/app/[locale]/search/page.tsx`](file:///C:/dev/moja-buss/apps/web/app/[locale]/search/page.tsx)
- **Checkout Form & Mode Selector:** [`apps/web/features/booking/components/booking-checkout-form.tsx`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-checkout-form.tsx)
- **Paystack Pop-up Handler:** [`apps/web/features/payments/hooks/use-paystack-checkout.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/hooks/use-paystack-checkout.ts) & [`paystack-checkout.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/paystack-checkout.ts)
- **Hold & Booking Procedures:** [`apps/web/trpc/routers/booking.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/booking.ts)
- **Pricing & Fee Engine:** [`apps/web/features/payments/lib/pricing-resolver.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/pricing-resolver.ts) & [`checkout-payable.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/lib/checkout-payable.ts)
- **Payment & Verification Service:** [`apps/web/features/payments/payment-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/payment-service.ts)
- **Confirmation & Ledger Service:** [`apps/web/features/payments/services/booking-confirmation-service.ts`](file:///C:/dev/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts)

---

## 2. Step-by-Step Checkout Lifecycle

### Step 1: Search & Quote Generation (`getCheckoutPricing`)
When a passenger selects seats in the search results drawer or booking modal:
1. `BookingCheckoutForm` invokes `trpc.payments.getCheckoutPricing.useQuery`.
2. The pricing resolver loads `PlatformSettings` and distance commission tiers:
   - **Base Fare:** `priceXOF * seatCount` (tax-inclusive).
   - **Platform Commission:** Dynamic tier or default $500\text{ bps}$ ($5\%$).
   - **Convenience Fee:** $250\text{ bps}$ ($2.5\%$) for `PAYSTACK`, but **$0\text{ XOF}$ ($0\%$) for `WALLET`**.
   - **Discounts & Promo Credits:** Evaluated via `QuoteService`. If the user enters a promo code or has active `CreditLot` records, `ticketDiscountXOF` and `creditAppliedXOF` reduce the payable balance.
3. The server signs a deterministic cryptographic HMAC quote token or generates a transient `PricingSnapshot`.

---

### Step 2: Hold Group Creation (`booking.createHold`)
Before money can be taken, the seats must be reserved exclusively to avoid race conditions:
1. Passenger submits passenger names/phones (or links `savedPassengerId`).
2. Server enters a database transaction with `SELECT ... FOR UPDATE` on the trip to prevent concurrent race conditions on the same physical seat segments (`boardingStopOrder` $\rightarrow$ `dropoffStopOrder`).
3. If any seat is already booked or actively held, the server returns `CONFLICT` (`409`), triggering `onSeatConflict` in the UI to refresh available seats.
4. If available, a `HoldGroup` is created with `status: ACTIVE` and `holdExpiresAt: now() + 10 minutes`.
5. For each seat, a `Booking` row is inserted with `status: PENDING_PAYMENT` and a pre-assigned unique `bookingReference` (e.g. `MR-7K4P92`) and `ticketToken`.
6. `PricingSnapshot` is persisted, freezing the financial breakdown:
   - `baseFareXOF`, `subtotalBaseXOF`, `convenienceFeeXOF`, `chargeAmountXOF`, `commissionXOF`, `operatorNetXOF`, `platformPromoFundedXOF`, `operatorPromoFundedXOF`, `creditAppliedXOF`.
7. Any applied discount coupons or promo credit lots are marked `status: RESERVED` with `budgetReservedXOF` allocated.

---

### Step 3: Payment Route Divergence (Paystack vs. Moja Wallet)

```
                            [ HOLD CREATED ]
                         (10-Minute Expiry Window)
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
         [ METHOD: PAYSTACK ]                [ METHOD: WALLET ]
      (Card / Mobile Money)              (Internal Cash Balance)
                  │                                   │
      Convenience Fee: 2.5%               Convenience Fee: 0% WAIVED
                  │                                   │
      • Generate Paystack Reference       • Zero-Cash Check (100% Promo)
      • Initialize Paystack Popup         • Row Lock User Wallet (FOR UPDATE)
      • Passenger Pays (Fiat)             • Verify Available >= Payable
                  │                                   │
                  ├──────────────────┐                │
                  ▼                  ▼                ▼
         [ CLIENT VERIFY ]   [ WEBHOOK EVENT ]   [ INSTANT ATOMIC SETTLE ]
                  │                  │                │
                  └─────────┬────────┘                │
                            ▼                         ▼
                  [ CONFIRM FROM PAYMENT ]    [ CONFIRM FROM WALLET ]
                  • Verify Paystack status    • Debit Passenger Wallet
                  • Credit Operator Escrow    • Credit Operator Escrow
                  • Credit Platform Revenue   • Credit Platform Revenue
                  • Post Double-Entry Ledger  • Post Double-Entry Ledger
                  • Mark Bookings CONFIRMED   • Mark Bookings CONFIRMED
                  • Send Novu Confirmation    • Send Novu Confirmation
```

#### Path A: Paystack (Cards & Mobile Money - Orange, MTN, Wave, Moov)
1. **Initiation (`booking.initiatePayment`)**:
   - `PaymentService.initiateForHold` creates an `ExternalPayment` record with `purpose: CHECKOUT`, `status: INITIALIZED`, and amount `snapshot.chargeAmountXOF`.
   - Calls Paystack REST API `/transaction/initialize` with email, amount in subunits, reference `hold_{holdId}_{attempt}`, and metadata.
   - Creates a `PaymentAttempt` record and returns `{ publicKey, reference, accessCode }`.
2. **Execution**:
   - The browser opens the Paystack inline popup modal or redirects to Mobile Money authorization.
   - If the user cancels the popup, `usePaystackCheckout` catches `PaystackPaymentCancelledError` and sends a best-effort `releaseHoldMutation`.
3. **Dual Verification (Client Verify + Webhook Webhook)**:
   - **Client path:** On popup success, the client calls `trpc.booking.verifyPayment({ reference })`. The server calls Paystack `/transaction/verify/{reference}`. If verified, it calls `confirmationService.confirmFromPayment`.
   - **Webhook path:** Paystack delivers a `charge.success` webhook to `/api/webhooks/paystack`. The handler checks signature HMAC, records `WebhookEvent` for idempotency, verifies with Paystack, marks `ExternalPayment` as `SUCCESS`, and calls `confirmationService.confirmFromPayment`.
   - Both paths are strictly idempotent guarded by PostgreSQL serializable transactions.

#### Path B: Moja Wallet Checkout
1. **Convenience Fee Waiver**:
   - When `paymentMethod === "WALLET"`, the convenience fee is $0\text{ XOF}$.
   - Total payable is `snapshot.subtotalBaseXOF - discountXOF - creditAppliedXOF`.
2. **Instant Settlement (`booking.confirmBooking` with no ExternalPayment)**:
   - Client directly calls `trpc.booking.confirmBooking({ holdId })`.
   - Server resolves `holdGroup`, confirms it is `ACTIVE`, and executes `confirmFromWallet`.
   - Inside a database transaction, it acquires a row-level lock:
     ```sql
     SELECT "availableBalance" FROM "financial_account" WHERE id = $walletId FOR UPDATE
     ```
   - Checks that `availableBalance >= totalToPay`.
   - Debits the passenger's wallet liability account and credits the operator's receivable liability account and platform commission revenue account.
   - Completes without third-party API latency.

#### Path C: Zero-Cash Booking (100% Promo Covered)
- When a booking is $100\%$ covered by promo credits or $100\%$ discount coupons:
- `payableXOF === 0`.
- The user can click "Confirm (promo covers fare)".
- No fiat gateway is called, and no passenger wallet cash is debited.
- The double-entry ledger debits `PROMO_EXPENSE_PLATFORM` and/or `PROMO_CREDITS` and credits `OPERATOR_RECEIVABLE` (escrowed) + `COMMISSION_REVENUE`.

---

## 4. Edge Cases & Resilience Mechanisms

### 1. Orphaned Payment Rescue (`rescueOrphanedPayment`)
- **Problem**: A passenger takes 12 minutes to approve their Mobile Money prompt on their phone. The 10-minute `HoldGroup` expires in Moja Bus, but Paystack captures the fiat money.
- **Solution**: When Paystack sends `charge.success` (or the user returns to verify) for an expired hold:
  1. `BookingConfirmationService.confirmFromPayment` detects `holdIsExpired`.
  2. Rather than discarding the webhook or failing silently, it executes `rescueOrphanedPayment`:
     - Debits `PAYSTACK_CLEARING` for the captured money.
     - Debits `PAYMENT_PROCESSOR_FEES` for the Paystack fee already incurred.
     - **Credits 100% of the captured amount to the passenger's Moja Wallet (`PASSENGER_WALLET`)**.
     - Marks `HoldGroup` as `EXPIRED`.
     - Alerts the user: *"Your booking session expired, but your payment was captured. The full amount has been credited to your Moja Wallet. You can use it to book again immediately."*

### 2. Seat Clash at Confirm Defense (`F-16`)
- `createHold` serializes holds using row locks. However, inside `confirmFromPayment` and `confirmFromWallet`, another defense-in-depth check verifies that no other `CONFIRMED` booking or non-expired `PENDING_PAYMENT` booking overlaps with the target seat's segment order.

### 3. Idempotent Double Delivery Guard
- Webhooks and verify endpoints can fire concurrently.
- `holdGroup.updateMany({ where: { id, status: "ACTIVE" }, data: { status: "CONFIRMED" } })` ensures only the first execution proceeds with ledger mutations.
- The second caller reads `status === "CONFIRMED"` and returns the already confirmed booking references without duplicate ledger entries.
