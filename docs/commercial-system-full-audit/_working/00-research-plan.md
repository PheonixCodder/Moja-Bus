# Research Plan: Commercial system full audit (post-hardening)

> Core question: After Phase 00–07 commercial lifecycle hardening, what money-safety, entitlement, flow, schema, and UX defects remain across discounts, checkout, payments, cancellations, holds, and related surfaces?
> min_rounds: 3
> Date: 2026-08-16
> Save location: `docs/commercial-system-full-audit/`

## Dimensions

1. **Incentives** — campaigns, coupons, vouchers, promo credits, referrals, evaluate/stacking/quote/freeze/finalize, budgets, abuse
2. **Checkout & inventory** — search, seat selection, holds, quoteId, pending-pay, expire/release, occupancy
3. **Payments** — Paystack init/verify/webhook/mobile-callback, wallet, zero-cash, amount sync, outbox
4. **Cancellations & refunds** — passenger/operator/admin/trip/bulk, channels (wallet/cash/voucher), offline fulfilment, ledger
5. **Schema & data** — Prisma models, migrations Phase 00–07, CHECKs, invariants, repair scripts, recon
6. **Surfaces & i18n** — passenger/operator/admin UIs listed by user + EN/FR consistency
7. **Prior-audit re-verification** — each P0/P1 from `docs/commercial-lifecycle-audit/` FIXED / PARTIAL / OPEN / REGRESSED with code evidence
8. **Edge cases & ops** — cron paths, race conditions, multi-seat, mid-route, guest flows

## Completion criteria

- [ ] Each dimension covered by ≥2 agents from different angles
- [ ] Every prior-audit P0/P1 has an explicit FIXED/PARTIAL/OPEN verdict with file:line evidence
- [ ] Flow traces: search→seat→hold→quote→pay→confirm; cancel→refund; referral; voucher; credit grant
- [ ] Schema section covers discount/payment/refund/hold/outbox models + migration status
- [ ] Edge-case matrices for money and inventory races
- [ ] Verifier PASS after min_rounds (3)
- [ ] Final multi-file audit pack written (not only working notes)

## Scope

**In:**

- `apps/web/app/[locale]/search` (+ related search features)
- `apps/web/features/payments`, `apps/web/app/api/payments`, `apps/web/app/api/cron/*`
- `apps/web/features/discounts` (+ all related)
- `apps/web/features/booking`, search, cancel-trip helpers
- Passenger: bookings, wallet, referrals pages
- Operator: bookings, promotions, trips
- Admin: marketing campaigns/abuse, financials offline-refunds/outbox
- `packages/db/prisma/schema.prisma` + Phase 00–07 migrations
- `apps/web/trpc/routers` (booking, payments, discounts-*, passenger, wallet, search, …)
- Related packages: schemas, types, AccountingEngine

**Out:**

- Traveler-app deep rewrite (D6 — minimal quoteId only); note gaps only
- Paystack split settlements (D7=OUT)
- Unrelated design-reference / credential JSON files
- Live Paystack / production DB execution (static + unit-test evidence only)

## Method

1. Read current code as source of truth (hardening may have fixed prior findings).
2. Do not trust prior audit executive summary without re-reading code.
3. Cite `path` + symbols; mark [UNVERIFIED] when only inferred.
4. Prefer root-cause over symptom lists.
5. Final deliverable = multi-file pack under `docs/commercial-system-full-audit/`.

## Prior baseline (must re-verify, not copy)

Canonical prior pack: `docs/commercial-lifecycle-audit/` (claims many P0s that Phase 00–07 intended to fix).
