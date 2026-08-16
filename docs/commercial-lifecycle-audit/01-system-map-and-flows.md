# 01 — System map and flows

Compound merge: lifecycle architecture + transaction-pack ownership map, hold-exit table, and modeling notes.

## Ownership map (checkout aggregate)

```text
Search page / search router
  -> offerId (serialized itinerary identity)
  -> TripDetailsService + SeatAvailabilityService
  -> BookingHoldService
       -> HoldGroup + PENDING_PAYMENT Booking rows
       -> PricingSnapshot + RESERVED DiscountRedemption rows
  -> PaymentService / Wallet confirmation
       -> ExternalPayment + PaymentAttempt + PaymentEvent  (card/MM only)
       -> BookingConfirmationService
            -> CONFIRMED Booking rows + FINALIZED redemptions + ledger
  -> CancellationService / cancelTripWithRefunds
       -> CANCELLED booking + Refund + compensating ledger / voucher
```

The **hold group** is the primary checkout aggregate. A booking is one passenger-seat-segment within it; `PricingSnapshot` is 1:1 with a hold; an external payment is 0..1 with a hold but also represents wallet top-ups without a hold. This overloading is a modeling pressure point (see P2-19).

## High-level architecture

```
Search / offer
  → Seat map (segment occupancy)
  → Checkout quote (discounts / vouchers / credits)
  → createHold (15m, trip FOR UPDATE, HoldGroup + PENDING_PAYMENT bookings)
  → freezeDiscountOnHold (RESERVED redemptions + counters)
       ├─ Paystack (payable > 0)
       │    initiate → popup/redirect → verify and/or webhook charge.success
       │    → confirmFromPayment (ledger BOOKING, finalize discounts)
       └─ Wallet / zero-cash (payable = 0 or WALLET method)
            checkoutWithWallet → confirmFromWallet (ledger; NO ExternalPayment)

Post-confirm
  → tickets / QR / receipts / best-effort Novu
  → referral qualify (async) → PENDING credit lots → cron activate + ledger

Cancel
  → CancellationService (requires ExternalPayment SUCCESS today)
  → channel WALLET | CASH | VOUCHER
  → trip cancel: cancelTripWithRefunds (per seat; may CANCEL_WITHOUT_REFUND)
```

## Hold exit states

| Exit | Intended effect | Current concern |
|------|-----------------|-----------------|
| User release | Expire pending bookings + release discount reservations | Implemented by `releaseHold`; caller must invoke it |
| Time expiry (15m) | Availability ignores expired holds | No sweeper consistently flips group/booking/redemption state |
| Failed Paystack reconcile | Pending bookings marked expired | Does not update HoldGroup or release discount reservations (P1-1) |
| Captured after expiry | Wallet rescue | Logged-in only; guest payment → manual intervention (P1-10) |
| Wallet confirm failure after createHold | Release hold | Client does not compensate; reservations stick (P1-18 → P1-17) |

## Layer map

| Layer | Primary paths |
|-------|----------------|
| Search UI | `app/[locale]/search/page.tsx`, `features/search/**` |
| Booking UI | `features/booking/components/*`, `views/*` |
| Hold / seats | `booking-hold-service`, `seat-availability-service`, `segment-overlap` |
| Discounts | `features/discounts/engine/*`, `services/quote-service`, routers `discounts*` |
| Payments | `features/payments/**`, `api/payments/*`, `api/webhooks/paystack` |
| Confirm | `booking-confirmation-service` |
| Cancel | `cancellation-service`, `lib/cancel-trip-with-refunds.ts` |
| Wallet | `trpc/routers/wallet.ts`, passenger wallet views |
| Ops UI | operator bookings/trips/promotions; admin campaigns/abuse |
| Data | `packages/db/prisma/schema.prisma`, `AccountingEngine` |
| Cron | reconcile-payments, process-referral-rewards, promo-expiry-reminders, release-escrow, release-reservations |

## Flow A — Search → hold → Paystack → confirm

1. `search.search` builds geo places, matches trips/stops, `matchSegmentFare`, `getSegmentOccupancy`, paginates.
2. Offer id `{tripId}_{originStopId}_{destStopId}` opens `BookingDialogFlow`.
3. `getTripDetails` + `getSeatAvailability` (overlap: boarding < dest && dropoff > origin).
4. Guests redirected to login with offer + seats in query; `createHold` is protected.
5. `payments.getCheckoutPricing` + discount quote; form may auto-apply promos/credits.
6. `booking.createHold` — 15 minutes, trip lock, conflict check, `HoldGroup` + bookings, freeze discounts.
7. `booking.initiatePayment` / `PaymentService.initiateForHold` — ExternalPayment + attempt + Paystack initialize (XOF, card + mobile_money). **No production subaccount split** (manual script only).
8. Client popup (`use-paystack-checkout`) then `booking.verifyPayment`, and/or browser `GET /api/payments/verify`, and/or webhook `charge.success`.
9. Amount check vs `ExternalPayment.amountXOF`; `markPaymentSuccess`; `confirmFromPayment` (clash re-check, accounting, finalize redemptions, referral hook).
10. Success URL with booking refs / ticket tokens.

## Flow B — Wallet / zero-cash

1. Same hold path.
2. Payable from `resolveCheckoutPayable` / `walletPayableFromSnapshot` (fee waived for wallet).
3. `booking.checkoutWithWallet` → `confirmFromWallet`: wallet `FOR UPDATE`, optional zero-cash when promo covers fare, posts ledger, **does not create ExternalPayment**.
4. Promo legs via `appendPromoLedgerEntries` against passenger `PROMO_CREDITS` account.
5. Zero-cash is modeled as wallet-style confirmation, not an explicit payment record — workable only if every voucher/credit leg is ledger-backed (P0-5).

The return callback at `/api/payments/verify` calls `verifyAndConfirm` **without** a session user, while authenticated tRPC passes a user ID. Treat webhook/callback confirmation as service-to-service; never rely on that optional user argument for customer-owned authorization (P1-20).

## Flow C — Pending pay (abandoned hold still within 15m)

1. Passenger bookings / details PaymentTab.
2. May `refreezeHoldDiscounts` (re-quote, release RESERVED, new freeze).
3. Re-initiate Paystack or wallet confirm.
4. **Risks:**
   - Re-init may not update `ExternalPayment.amountXOF` → verify mismatch (P1-2).
   - Preview/refreeze quotes **before** releasing this hold’s own reservations → credits appear missing / get discarded (P1-17, Trace C).

## Flow D — Incentives lifecycle

```
Campaign/Coupon CRUD (admin OPERATOR/PLATFORM; operator OPERATOR only)
  → CouponCode
  → quoteCheckoutDiscounts / evaluate
  → freeze (RESERVED + budget/coupon counters)
  → finalize on confirm OR release on explicit releaseHold

Voucher (admin promo OR cancellation issue)
  → MonetaryVoucher (optional scheduleId/companyId)
  → evaluate schedule/company match
  → reservedAmount / remaining on freeze/finalize

Promo credits
  → CreditLot (ADMIN grant | CLAIM | REFERRAL)
  → evaluate FIFO by expiry
  → promo-ledger debit on confirm
  ⚠ ADMIN/CLAIM lots often have no matching ledger credit

Referrals
  → apply code → ATTRIBUTED edge
  → confirm → QUALIFIED + PENDING lot (delay) or immediate ACTIVE+ledger
  → cron process-referral-rewards → ACTIVE + ledger → REWARDED
  ⚠ delayed INITIAL can fire per holdGroup while still QUALIFIED
```

## Flow E — Single booking cancel

1. Operator drawer or passenger tickets (passenger hardcodes WALLET).
2. Guards: CONFIRMED, not checked-in, before departure, auth.
3. Requires `holdGroup.payment.status === SUCCESS`.
4. Proportional seat share of `subtotalBaseXOF` / `operatorNetXOF`; last seat absorbs dust.
5. Channel:
   - WALLET → credit passenger wallet + clawback
   - CASH / VOUCHER → credit OFFLINE_REFUND_PAYABLE; VOUCHER also `issueCancellationVoucher` (schedule-scoped)
6. Refund row written `status: COMPLETED`, `paystackRefundId: null`.

## Flow F — Trip / bulk cancel

1. Trip cancel blocked if any checked-in; expires PENDING_PAYMENT seats; cancels trip.
2. Per confirmed seat → `CancellationService`; guests WALLET/VOUCHER → CASH.
3. On refund failure: booking still `CANCELLED` + `CANCEL_WITHOUT_REFUND` audit tx.
4. Bulk manifest: skips checked-in; same channels.

## Settlement model (as implemented)

- Paystack captures 100% to platform (no v2 split in app init).
- Confirm credits operator receivable with `reserveOnCredit` (escrow).
- `release-escrow` cron after trip ARRIVED + 24h (or updatedAt + 48h fallback).
- Operator payouts via Paystack transfers (separate from booking cancel).

## Notification model

Confirmation, cancel, hold, referral, wallet-low are mostly best-effort post-tx promises (Novu). No durable outbox / retry / delivery audit for the commercial path.
