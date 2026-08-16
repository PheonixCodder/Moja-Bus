# Commercial lifecycle hardening — master plan

**Created:** 2026-08-16  
**Status:** Phase 00–07 implemented (staging smoke / go-no-go pending); D1–D8 locked, **D7=OUT**  
**Source of truth (bugs):** [`docs/commercial-lifecycle-audit/`](../../commercial-lifecycle-audit/README.md)  
**Approach:** Fix every catalog finding phase-by-phase; ship money-safety first; no feature expansion until Waves 0–1 (+ pending-pay) land

---

## Why this exists

The commercial stack (search → hold → pay → cancel → incentives) has grown large and now has confirmed P0/P1 failures: wallet cancel blocked, multi-seat refund collisions, false COMPLETED refunds, unfunded promo credits, delayed referral double-grants, pending-pay self-reservation, migration drift, and more.

This plan turns the compound audit into an **executable phased repair program**. Every finding ID in the audit catalog maps to at least one phase (see [02-finding-coverage-matrix.md](./02-finding-coverage-matrix.md)).

---

## Principles

1. **Money and entitlement before polish** — P0 cancel/refund/ledger before i18n.
2. **Idempotent repairs** — every data fix job must be re-runnable and choose one outcome per hold.
3. **No silent cancel-without-refund** — durable obligation or keep travel entitlement.
4. **Honest statuses** — never mark provider refund COMPLETED without a provider id.
5. **One quote truth** — freeze/preview/confirm use the same versioned quote rules.
6. **Do not regress** seat locking, webhook HMAC/idempotency, schedule vouchers, operator cancel channels.
7. **Tests gate each phase** — Trace A–E style scenarios where applicable.

---

## Phase map

| Phase | File | Theme | Primary findings |
|-------|------|-------|------------------|
| **00** | [03-phase-00-cancel-refund-money-safety.md](./03-phase-00-cancel-refund-money-safety.md) | Cancel provenance, multi-seat refunds, trip cancel, honest refund statuses | P0-1…P0-4, P2-3, P2-5*, P2-14, P2-27, P3-4, P3-7, P3-8 |
| **01** | [04-phase-01-incentive-ledger-referrals.md](./04-phase-01-incentive-ledger-referrals.md) | Fund grants, referral INITIAL, voucher liability, soft-fail voucher | P0-5…P0-7, P1-5, P1-6*, P0-6 |
| **02** | [05-phase-02-schema-migrations-data-repair.md](./05-phase-02-schema-migrations-data-repair.md) | Migratable discount schema, CHECKs, repair jobs | P0-8, P2-15*, P2-16, P3-6, P3-15, P3-16, P3-17 |
| **03** | [06-phase-03-hold-pay-lifecycle.md](./06-phase-03-hold-pay-lifecycle.md) | Expiry release, pending-pay self-reservation, amount sync, callbacks, reconcile | P1-1,2,4,7,8,10,12,16,17,18 · P2-4,19,28,29 · P3-9 |
| **04** | [07-phase-04-search-quote-concurrency.md](./07-phase-04-search-quote-concurrency.md) | Occupancy, budget races, quote/versioned checkout | P1-3,19 · P2-1,7,11 · P1-14* |
| **05** | [08-phase-05-product-ops-abuse-flags.md](./08-phase-05-product-ops-abuse-flags.md) | Dead flags, offline payable FSM, abuse, admin/ops gaps | P1-11,13,14,15 · P2-8…10,20…22,26 · P3-1…3,10…12,14 |
| **06** | [09-phase-06-ux-i18n-privacy.md](./09-phase-06-ux-i18n-privacy.md) | i18n, ticket tokens, verify session (**web only**; traveler deferred) | P1-9,20 · P2-12…14,17,18,23…25 · P3-5,13 |

| **07** | [10-phase-07-outbox-tests-staging.md](./10-phase-07-outbox-tests-staging.md) | Outbox, full test matrix, staging smoke, recon | P2-2 · P2-6* · all test gaps · staging |

\* = includes an **open product decision** (see [01-open-decisions.md](./01-open-decisions.md)).

---

## Document map

| File | Purpose |
|------|---------|
| [00-README.md](./00-README.md) | This index |
| [01-open-decisions.md](./01-open-decisions.md) | **Locked** D1–D6, D8; D7 pending (recommend out) |
| [02-finding-coverage-matrix.md](./02-finding-coverage-matrix.md) | Every audit ID → phase (completeness gate) |
| [03-phase-00-…](./03-phase-00-cancel-refund-money-safety.md) | Phase 00 |
| [04-phase-01-…](./04-phase-01-incentive-ledger-referrals.md) | Phase 01 |
| [05-phase-02-…](./05-phase-02-schema-migrations-data-repair.md) | Phase 02 |
| [06-phase-03-…](./06-phase-03-hold-pay-lifecycle.md) | Phase 03 |
| [07-phase-04-…](./07-phase-04-search-quote-concurrency.md) | Phase 04 |
| [08-phase-05-…](./08-phase-05-product-ops-abuse-flags.md) | Phase 05 |
| [09-phase-06-…](./09-phase-06-ux-i18n-privacy.md) | Phase 06 (web only) |
| [10-phase-07-…](./10-phase-07-outbox-tests-staging.md) | Phase 07 |
| [20-phase-07-staging-smoke.md](./20-phase-07-staging-smoke.md) | Staging smoke checklist |
| [21-phase-07-test-matrix.md](./21-phase-07-test-matrix.md) | Trace A–E gate table |
| [11-implementation-order-and-deps.md](./11-implementation-order-and-deps.md) | Dependency graph + suggested sprint slices |
| [12-non-goals-and-do-not-regress.md](./12-non-goals-and-do-not-regress.md) | Out of scope + strengths to preserve |
| [13-env-cutover-and-drift.md](./13-env-cutover-and-drift.md) | db push → migrate cutover, CHECK VALIDATE |
| [14-state-transition-matrix.md](./14-state-transition-matrix.md) | Booking/payment/refund/hold transitions |
| [15-wallet-reservation-decision.md](./15-wallet-reservation-decision.md) | P2-4: keep model/cron, no writers |

---

## Suggested execution order

```text
00 Cancel/refund money
  → 01 Incentive ledger/referrals
  → 02 Migrations + data repair (can start schema draft in parallel with 01)
  → 03 Hold/pay lifecycle (includes pending-pay P1-17 — user-visible)
  → 04 Search/quote concurrency
  → 05 Product/ops/abuse
  → 06 UX/i18n/privacy (web)
  → 07 Outbox + full staging (tests accumulate every phase; 07 is the gate)
```

Phases 00 and 01 are **blocking for any commercial expansion**. Phase 03’s pending-pay fix (P1-17) should not wait until late — it is user-visible and can ship as soon as 00/01 are stable.

---

## Related docs

- Audit: `docs/commercial-lifecycle-audit/`
- Prior product plan: `docs/plans/discount-referral-voucher-system/`
- Prior hardening note: `docs/plans/schedule-voucher-checkout-cancel-hardening.md`
