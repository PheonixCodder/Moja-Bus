# Coverage inventory and unverified areas

## Reviewed source groups

| Group | Inspected paths |
|---|---|
| Routes | `app/[locale]/search/page.tsx`; passenger bookings/wallet/referrals pages; admin campaigns/abuse pages; operator bookings/promotions/trips pages; `app/api/payments/**`; `app/api/webhooks/paystack/route.ts`; relevant cron routes. |
| Payments | `features/payments/**` payment service, Paystack provider/inline checkout hook, price/hold helpers, confirmation and cancellation services, tests and validation script. |
| Booking | `features/booking/**` dialog/checkout/seat map/context, hold, availability, trip details/read services and hold/segment helpers. |
| Discounts | `features/discounts/**` engine, campaign/quote/ledger/voucher/referral/credit/expiry/marketing services, components, and tests. |
| APIs | `trpc/routers/booking.ts`, `payments.ts`, `wallet.ts`, `discounts.ts`, `discounts-admin.ts`, `discounts-operator.ts`, plus search/schedules/trips boundaries referenced by flows. |
| Operations | operator trip/schedule/booking/promotion views/components/services; admin campaign/abuse/promo-credit/referral views/components; `cancel-trip-with-refunds.ts`, trip generator/status/window helpers. |
| Data | `packages/db/prisma/schema.prisma`; relevant 2026 voucher/promotion/trip migrations; financial-account/ledger relationships. |

## Tested material located

The repository has unit tests for discount evaluation/promo ledger, checkout payable/Paystack checkout/pricing/revenue analytics, hold grouping/trip segments, search availability, trip dates/windows, cancellation clawback, operator booking service, and schedule departure editor. These tests are valuable but do not demonstrate end-to-end transactional coverage for the P0/P1 flows identified here.

## Explicit limitations

- No production database, migrations application, payment credentials, queues, cron scheduler, Novu configuration, browser session, or live Paystack account was exercised.
- Static inspection cannot prove that every code path is reachable or that all generated/indirect imports are correct.
- Generated output, third-party packages, binary assets, and unrelated mobile credentials were intentionally not read.

## Required next audit pass

1. Run an isolated test database with seeded multi-seat, multi-segment, mixed-instrument scenarios.
2. Instrument simulated Paystack callbacks/webhooks (duplicates, reordered events, timeout after capture, failed signature, failed refund).
3. Run concurrent hold/confirm/refund/referral workers and assert schema/ledger invariants after each run.
4. Use browser tests in each locale/mobile breakpoint for quote change, hold expiry, failure, retry, and ticket sharing.
5. Reconcile live data against the invariant queries listed in the schema document before deployment changes.
