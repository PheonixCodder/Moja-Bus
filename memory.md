# Memory — Moja Ride Paystack Payments

Last updated: 2026-07-05

## What was built

**Schema** (`packages/db/prisma/schema.prisma`)
- `HoldGroup` aggregate root with `PricingSnapshot` (immutable fee breakdown)
- `Payment` 1:1 with `HoldGroup`; `PaymentAttempt`, `PaymentEvent`, `WebhookEvent`
- `PlatformSettings`, `CommissionDistanceTier` (admin distance bands)
- `OperatorLedgerEntry` (append-only), `Refund`
- `Company.paystackSubaccountCode` for v2 split
- DB pushed after clearing legacy `payment` rows and orphan `holdGroupId` UUIDs

**Pricing**
- Default 5% operator commission + 2.5% passenger convenience fee (admin-configurable)
- Distance tiers via `Route.distanceKm` → `CommissionDistanceTier`
- `apps/web/features/payments/lib/pricing-resolver.ts`

**Payment flow**
- `BookingHoldService` creates `HoldGroup` + `PricingSnapshot` + bookings
- `PaymentService` — Paystack-only initialize, verify, webhook handler
- `BookingConfirmationService` — idempotent confirm; ledger credit; email receipt
- `CancellationService` — cash/voucher cancel with ledger debit
- Paystack Popup via `@paystack/inline-js` with redirect fallback to hosted checkout
- Shared `usePaystackCheckout` hook for checkout + dashboard resume payment
- Pending payment tab: live countdown + **Complete payment** button

**API**
- `booking.initiatePayment`, `booking.verifyPayment` (Paystack only)
- `payments` router: pricing preview, cancel, admin tiers/settings, ledger export, settlement
- `POST /api/webhooks/paystack`, `GET /api/payments/verify` (redirects to `/book/{offerId}/success`)

**Checkout UI**
- Fare + service fee breakdown; card/MoMo via Paystack Popup only

**Tests**
- `pricing-resolver.test.ts` — 47 total passing in `apps/web`

## Env vars required for live Paystack

```
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Optional: popup (default) | redirect (hosted Paystack page only)
# NEXT_PUBLIC_PAYSTACK_CHECKOUT_MODE=redirect
RESEND_API_KEY=...  # optional; logs email when missing
EMAIL_FROM=Moja Ride <receipts@yourdomain.com>
```

## Validation script (manual)

`node apps/web/features/payments/scripts/validate-paystack-split.mjs` — test-mode split + refund checklist

## Decisions

- Platform absorbs Paystack fees; fees stored on `Payment.feesXOF` after verify
- Payment failure does not release seats; retries create new `PaymentAttempt`
- v1: single merchant account + ledger; v2: `paystackSubaccountCode` on Initialize when set
- Refunds v1: cash/voucher records only (no Paystack refund API in passenger cancel path yet)

## Next session

1. Run Paystack test-mode split validation script before enabling operator subaccounts
2. Admin UI for commission tiers + settlement (tRPC API exists under `payments.*`)
3. Wire Paystack Refund API for operator-cancel auto-refund
4. End-to-end smoke: real Paystack test keys + Popup checkout
