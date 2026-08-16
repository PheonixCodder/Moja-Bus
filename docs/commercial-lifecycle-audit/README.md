# Commercial lifecycle deep audit (compound)

**Status:** static-code audit (source inspection only)  
**Date:** 2026-08-16 (compound merge)  
**Scope:** discounts, campaigns, coupons, vouchers, promo credits, referrals, search → seat → hold → checkout, Paystack, wallet/zero-cash, cancellations, refunds, trip/bulk cancel, operator/admin/passenger UIs, Prisma schema & migrations  

This is an assessment, not an implementation plan. No production DB, live Paystack account, or browser session was exercised.

## Provenance (compound merge)

This folder is the **canonical** commercial audit. It merges:

| Source | Role |
|--------|------|
| `docs/commercial-lifecycle-audit/` (this pack, first pass) | Deeper domain coverage, multi-seat REFUND P0, occupancy, amount desync, migration gap, UI matrices |
| `docs/commercial-transaction-audit/` (same-day earlier pack) | Narrative findings, incident traces A–C, pending-pay self-reservation P1, hold-exit table, next-audit-pass checklist |

Overlapping findings were **unified** (one ID, highest justified severity, combined evidence). Unique items from either source were **kept**. Where the packs disagreed on severity, the compound catalog records the chosen severity and notes the alternate ranking.

Also related (not fully inlined): `docs/audits/discount-referral-voucher-system-audit-2026-08-15.md`, `docs/plans/schedule-voucher-checkout-cancel-hardening.md`.

Unrelated untracked files were excluded from review: `apps/traveler-app/google-services.json`, service-account JSON, `design-reference/`.

---

## Document map

| File | Contents |
|------|----------|
| [01-system-map-and-flows.md](./01-system-map-and-flows.md) | Architecture + lifecycle + hold exit states |
| [02-findings-catalog.md](./02-findings-catalog.md) | Unified P0–P3 catalog (both packs) |
| [03-incentives-audit.md](./03-incentives-audit.md) | Campaigns, coupons, vouchers, credits, referrals, engine |
| [04-payments-paystack-wallet.md](./04-payments-paystack-wallet.md) | Paystack, wallet, zero-cash, verify/webhook/cron |
| [05-cancellations-refunds.md](./05-cancellations-refunds.md) | Seat/trip/bulk cancel channels & refund accounting |
| [06-holds-seats-search-ops.md](./06-holds-seats-search-ops.md) | Search, seats, holds, pending-pay, ops UI |
| [07-schema-integrity.md](./07-schema-integrity.md) | Schema, invariants, migrations, recon queries |
| [08-edge-case-matrices.md](./08-edge-case-matrices.md) | Scenario × expected × actual |
| [09-ui-i18n-inconsistencies.md](./09-ui-i18n-inconsistencies.md) | Locale, copy, misleading states |
| [10-coverage-inventory.md](./10-coverage-inventory.md) | Coverage + next audit pass |
| [11-remediation-roadmap.md](./11-remediation-roadmap.md) | Fix order + target architecture sketch |
| [12-incident-traces-and-reconciliation.md](./12-incident-traces-and-reconciliation.md) | Confirmed traces A–C + ops SQL |

---

## Severity definitions

| Severity | Meaning |
|----------|---------|
| **P0** | Money, entitlement, or books can break on a normal path. Block rollout / repair first. |
| **P1** | Material correctness or ops-control failure with a realistic trigger. |
| **P2** | User-visible inconsistency, weak control, missing recovery, data-quality risk. |
| **P3** | Maintainability, observability, test, or polish gap. |

---

## Executive assessment

**What is solid**

- Trip-level `FOR UPDATE` + segment-overlap checks at hold creation largely prevent same-seat double sells.
- Pricing snapshots + discount reservation/finalize reduce many quote-drift bugs.
- Paystack webhook HMAC + `WebhookEvent` idempotency + hold confirmation claim reduce duplicate confirms.
- Double-entry ledger via `AccountingEngine` for card confirm, wallet confirm, and (most) refunds.
- Operator cancel channels (WALLET / CASH / VOUCHER), guest→cash coercion, and checked-in guards are coherent on the UI side.
- Schedule-scoped cancellation vouchers are modeled and enforced in evaluate when both schedule + company are set.

**What is not reliable**

The financial lifecycle cannot yet be treated as trustworthy end-to-end:

1. **Wallet / zero-cash confirmed bookings cannot cancel** — cancel requires a SUCCESS `ExternalPayment`; wallet confirm never creates one. *(earlier pack ranked P1; compound = P0)*
2. **Multi-seat refunds collide** on `FinancialTransaction @@unique([externalPaymentId, type])`. *(lifecycle-only; earlier pack noted uniqueness as schema P2)*
3. **Paystack refunds are never executed in product** — refund rows are written `COMPLETED` with `paystackRefundId: null`. Adapter `refund()` exists but is unused. *(earlier pack said “no refund call”; compound clarifies adapter exists, product path does not call it)*
4. **Trip cancel still cancels tickets when refund fails** (`CANCEL_WITHOUT_REFUND`).
5. **Admin / claim promo credit lots are unfunded in the ledger** — checkout can fail after hold with misleading wallet error. *(earlier P1 → compound P0)*
6. **Delayed referral INITIAL rewards can double-grant** while edge stays `QUALIFIED`. *(earlier P1 → compound P0)*
7. **Pending-pay re-quote / preview treats the hold’s own reservations as unavailable**, then can refreeze to a zero-credit quote. *(transaction-audit unique; compound P1-17)*
8. **Voucher redemption is booked as platform expense**, not voucher-liability burn.
9. **Discount domain tables are not fully represented in migration history**.
10. Soft-expired / failed payment paths **do not release promo reservations**; Paystack re-init after refreeze **may not update `ExternalPayment.amountXOF`**.
11. Segment occupancy **sums booking rows** → false sold-out under mid-route reuse.

**Bottom line:** booking inventory concurrency is comparatively strong; **money movement, incentive ledgers, multi-seat refunds, cancel provenance, and pending-pay re-quote ordering** are the primary failure domains.

---

## Top fix order (summary)

See [11-remediation-roadmap.md](./11-remediation-roadmap.md).

1. Cancel without requiring Paystack-shaped payment (wallet / zero-cash / mixed).
2. Fix multi-seat REFUND ledger uniqueness (per-booking refund key).
3. Stop canceling entitlement when refund fails; durable refund obligation.
4. Fund admin/claim credit grants in the same transaction as the lot.
5. Fix delayed-referral INITIAL vs RECURRING while `QUALIFIED`.
6. **Fix pending-pay self-reservation quote/refreeze (P1-17)** + release on confirm failure (P1-18).
7. Sync Paystack payment amount on re-init; release discounts on expire/fail.
8. Honest refund statuses; wire or explicitly defer Paystack refund API.
9. Capture discount schema in proper migrations; add expiry sweeper + recon jobs.
