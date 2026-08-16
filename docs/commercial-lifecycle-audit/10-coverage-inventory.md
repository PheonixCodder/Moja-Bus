# 10 — Coverage inventory

## Method

Static read of application routes, feature modules, tRPC routers, API/cron/webhook handlers, Prisma schema/migrations, and coupled booking/search/trip code. No production DB, live Paystack, browser, or traveler-app runtime exercised.

Unrelated secrets / design dumps intentionally excluded (`google-services.json`, service-account JSON, `design-reference/`).

---

## Reviewed groups

### Discounts / incentives

`apps/web/features/discounts/**` including:

- engine: evaluate, auto-apply, benefits, eligibility, stacking, types, tests
- services: quote, campaign-loader/crud, voucher, credit-grant, claim-credit-grant, referral, promo-ledger, expiry-reminders, scope-options, redemption-list, marketing-audit/blast, notify
- lib: promo-ceilings, promo-policy, pending-referral, device-hash, privacy-display, omit-undefined
- components + referral-join view

Routers: `discounts.ts`, `discounts-admin.ts`, `discounts-operator.ts`

UI: admin campaigns/abuse/referral/promo-credits; operator promotions; passenger referrals/wallet/promo-incentives-panel

Pages: admin marketing campaigns/abuse; passenger wallet/referrals; operator promotions

Cron: `process-referral-rewards`, `promo-expiry-reminders`

Schema: DiscountCampaign, CouponCode, MonetaryVoucher, CreditLot, Referral*, DiscountRedemption, Campaign*Scope, PromoAbuseEvent, PricingSnapshot discount fields

### Payments

`apps/web/features/payments/**` (payment-service, confirmation, cancellation, paystack client/provider, checkout-payable, pricing-resolver, hooks, tests, split validation script)

API: `payments/verify`, `payments/mobile-callback`, `webhooks/paystack`

Routers: `payments.ts`, `wallet.ts`, booking initiate/verify/checkoutWithWallet

Cron: reconcile-payments, release-escrow, release-reservations, snapshot-accounts

Accounting: `AccountingEngine`, `FinancialAccountService`, SnapshotService

### Booking / search / holds

`app/[locale]/search/**`, `features/search/**`, `trpc/routers/search.ts`

`features/booking/**` (dialog, checkout, seat map, hold/availability/read/trip-details services, hold-group, segment-overlap, countdown, success/bookings/tickets/public ticket views)

`trpc/routers/booking.ts`

Passenger bookings page + views; book success page

### Operator / trips / cancel

Operator bookings/**, trips page, booking-detail-drawer, manifest-drawer

`lib/cancel-trip-with-refunds.ts`, `lib/__tests__/cancel-clawback.test.ts`

`trpc/routers/trips.ts`, `operator.ts` (cancel/bulk)

### Schema / migrations

`packages/db/prisma/schema.prisma` commercial models

Migrations listed in [07-schema-integrity.md](./07-schema-integrity.md)

### Notifications (spot)

Passenger/operator promo & payment workflows under `features/notifications/workflows/**` (campaign, promo, refund, hold, wallet, trip-cancelled) — delivery is best-effort; not every template body line-audited.

### Packages / schemas

`packages/schemas` booking/payments-admin/discounts/trips validators (spot-checked where cancel channels / hold max defined)

---

## Tests located (non-exhaustive)

- discounts evaluate + promo-ledger
- checkout-payable, paystack-checkout, pricing-resolver, revenue-analytics
- hold-group, trip-segments, normalize-phone
- cancel-clawback math
- search availability / trip windows (repo has additional search/trip tests beyond this pack’s deep read)

**Missing critical tests:** delayed referral double INITIAL; admin credit ledger funding; multi-seat REFUND unique collision; wallet cancel path; hold-expiry discount release; Paystack amount sync after refreeze; voucher liability burn; end-to-end Paystack webhook reorder.

---

## Explicit limitations

- No production database, migrations application, payment credentials, queues, cron scheduler, Novu configuration, browser session, or live Paystack account was exercised.
- Static inspection cannot prove that every code path is reachable or that all generated/indirect imports are correct.
- Generated output, third-party packages, binary assets, and unrelated mobile credentials were intentionally not read.
- Traveler mobile app parity not runtime-verified (noted open).

## Required next audit pass (from transaction pack)

1. Isolated test DB with seeded multi-seat, multi-segment, mixed-instrument scenarios.
2. Simulated Paystack callbacks/webhooks (duplicates, reordered events, timeout after capture, failed signature, failed refund).
3. Concurrent hold/confirm/refund/referral workers; assert schema/ledger invariants after each run.
4. Browser tests per locale/mobile breakpoint: quote change, hold expiry, failure, retry, ticket sharing, **pending-pay credit reappear** (Trace C).
5. Reconcile live/staging data against SQL in [07-schema-integrity.md](./07-schema-integrity.md) and [12-incident-traces-and-reconciliation.md](./12-incident-traces-and-reconciliation.md) before deployment changes.

## Prior docs

- **Canonical compound:** this folder (`docs/commercial-lifecycle-audit/`).
- **Superseded as standalone:** `docs/commercial-transaction-audit/` (retained for history; README redirects here).
- `docs/audits/discount-referral-voucher-system-audit-2026-08-15.md`
- `docs/plans/schedule-voucher-checkout-cancel-hardening.md`
- `context/paystack/**` — provider docs reference, not app correctness proof
