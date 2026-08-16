# Phase 02 — Schema migrations & data repair

**Status:** Implemented (migrations + playbooks + docs; staging deploy + CHECK VALIDATE still ops)  
**Depends on:** Can draft in parallel with 00/01; apply after 01 grant shape known  
**Unlocks:** Fresh `migrate deploy` matches schema; durable constraints; safe env cutover  
**Findings:** P0-8, P2-15, P2-16, P3-6, P3-15, P3-16, P3-17 (+ repair execution for P0-5)

## Goal

Make the commercial schema **migratable from the repo**, add missing integrity constraints where safe, document state transitions, and run read-only then write repairs for known drift.

## Scope

### In
- Baseline migration for discount/referral/voucher/credit/scopes + pricing discount columns (D4=A)
- Make `20260816120000` safe if table already exists
- Optional CHECKs: amounts ≥ 0, hybrid bps sum, dropoff > boarding (where PG allows)
- Soft-delete / restrict cascade policy for post-money aggregates (P2-15)
- Voucher schedule/company nullability policy (P2-16)
- Typed columns for recon (provider event id, payment purpose already Phase 03, refund execution state)
- State-transition matrix doc for payment/refund/booking enums (P3-6)
- Data repair jobs from audit SQL (lots vs ledger; stuck RESERVED; multi INITIAL; CANCEL_WITHOUT_REFUND inventory)

### Out
- Application behavior changes except those required by new NOT NULL / CHECKs
- Full PaymentIntent redesign

## Shipped (2026-08-16)

| Item | Location |
|------|----------|
| Baseline IF NOT EXISTS | `packages/db/prisma/migrations/20260816160000_phase02_discount_domain_baseline` |
| Constraints / Restrict / CHECKs NOT VALID | `.../20260816170000_phase02_commercial_constraints` |
| Schema Restrict | `MonetaryVoucher.schedule/company`, `ExternalPayment.holdGroup`, `Refund.holdGroup` |
| Env cutover + drift | [13-env-cutover-and-drift.md](./13-env-cutover-and-drift.md) |
| Transition matrix | [14-state-transition-matrix.md](./14-state-transition-matrix.md) |
| Repair / inventory scripts | `apps/web/scripts/repair-duplicate-initial-credit-lots.ts`, `inventory-cancel-without-refund.ts`, `inventory-stuck-reserved-holds.ts` (+ Phase 01 promo funding repair) |
| P3-16 | `offerId` intentionally non-unique (documented) |
| P3-17 | Confirmed: max promo vouchers in `issueMonetaryVoucher` only for promotional sources |

## Work items

### 02.1 — Inventory drift
1. Per environment: compare `schema.prisma` to live DB (`migrate diff` / introspection).
2. Document which envs used `db push`. → [13-env-cutover-and-drift.md](./13-env-cutover-and-drift.md)

### 02.2 — Baseline migration (P0-8, D4)
1. Author migration creating missing tables/columns with IF NOT EXISTS / guards. ✅
2. Include indexes/FKs matching Prisma. ✅
3. Ensure `20260816120000` is no-op when columns exist. ✅ (already IF NOT EXISTS)
4. CI check: empty DB → migrate deploy → prisma generate → typecheck. ⏳ staging/CI

### 02.3 — Constraints
1. Add safe CHECKs in a follow-up migration after data cleaned. ✅ NOT VALID; VALIDATE in runbook
2. Decide `HoldGroup.offerId` uniqueness (P3-16): **intentional reuse** — do not add unique. ✅
3. Voucher: Restrict on schedule/company delete; CHECK cancellation scope. ✅

### 02.4 — Cascade / retention (P2-15)
1. Policy: no hard delete of HoldGroup after funds moved; Restrict on payment/refund. ✅
2. Migration changing onDelete where feasible. ✅

### 02.5 — Repair playbooks
1. Dry-run SQL / scripts. ✅
2. Write repairs: promo lots (Phase 01), duplicate INITIAL, inventories. ✅ (apply finance-gated)
3. Max promotional vouchers: confirmed in issue path (P3-17). ✅

### 02.6 — Docs
1. Transition matrix. ✅
2. Promote critical JSON fields to columns list (incrementally with Phase 03 purpose). ⏳ Phase 03

## Acceptance criteria

- [x] Fresh database: baseline migration creates discount domain (verify on empty DB / CI)
- [ ] Staging migrate succeeds without manual push
- [ ] Dry-run repair reports reviewed; write repairs applied with audit log
- [x] Cancellation vouchers cannot lose schedule/company silently on schedule delete (Restrict + CHECK)
- [x] Transition matrix published

## Risks

- Long locks on large tables — run in maintenance window
- CHECK failures on dirty historical data — clean first; VALIDATE separately

## Exit checklist

- [x] Env cutover runbook checked in ([13](./13-env-cutover-and-drift.md))
- [x] Audit P0-8 marked addressed in progress tracker (code/migrations; staging deploy pending)
