# Phase 01 — Incentive ledger & referrals

**Status:** Implemented (2026-08-16)  
**Depends on:** Phase 00 (cancel must work after credit-covered bookings)  
**Unlocks:** Trustworthy promo credits, referrals, voucher books  
**Findings:** P0-5, P0-6, P0-7, P1-5 (and wires context for P1-6 in Phase 05)

## Goal

Make every spendable incentive **ledger-backed**, stop delayed referral double INITIAL grants, book voucher redemption as liability burn, and stop invalid vouchers from wiping other instruments.

## Scope

### In
- Admin grant + claim grant accounting (mirror referral activation)
- Repair job for underfunded ACTIVE lots (execution may land in Phase 02)
- Referral edge-level INITIAL claim
- Voucher instrument funding type / promo-ledger path
- `emptyReject` → soft fail voucher only
- Unit tests for Trace B, Trace E, voucher liability

### Out
- Migration baseline (Phase 02)
- Pending-pay self-reservation (Phase 03)
- Dead flag cleanup (Phase 05)
- Abuse UI (Phase 05)

## Work items

### 01.1 — Fund admin & claim grants (P0-5)
1. In `grantAdminCreditLot` and `claimCreditGrant`, inside same transaction as lot create/activate:
   - Ensure passenger `PROMO_CREDITS` financial account
   - Post debit expense / credit liability (same pattern as `referral-service` activation)
   - Unique grant idempotency key on ledger
2. Map AccountingEngine errors to accurate “promo credits unavailable” (not wallet balance) + correct Novu.
3. On checkout failure after hold, rely on Phase 03 release — but do not create unfunded lots anymore.

### 01.2 — Repair existing lots
1. Script/job: for each user, `sum(remainingXOF)` of ACTIVE/PARTIALLY_REDEEMED lots vs promo account available.
2. If lot > ledger: post missing credit **or** reduce lot remaining (product choice — **recommend post missing credit** with audit tag `REPAIR_PROMO_GRANT`).
3. Dry-run report before apply (ties to Phase 02 / staging).

### 01.3 — Delayed referral INITIAL (P0-6)
1. When enqueueing INITIAL, claim at edge level:
   - e.g. set `initialRewardHoldGroupId` / `initialEnqueuedAt`, or transition to a status that forbids second INITIAL
   - Idempotency key **without** holdGroup for INITIAL: `referral:{edgeId}:INITIAL`
2. While QUALIFIED and INITIAL already enqueued/pending/active → subsequent confirms use RECURRING only.
3. Concurrent confirm test + cron test (two bookings before cron).

### 01.4 — Voucher liability burn (P0-7)
1. Change evaluate instrument for monetary vouchers: do not use `platformFundedXOF` expense path.
2. On finalize, burn voucher liability / remaining consistently with reserved amounts.
3. Backfill note: historical expense posts may need finance recon, not automatic reverse without review.

### 01.5 — Soft-fail voucher (P1-5)
1. Replace `emptyReject` on voucher validation failure with: keep coupon/auto instruments; clear voucher only; surface voucher error to UI.
2. Tests: coupon + bad voucher code → coupon still applied.

### 01.6 — Tests
- Trace B: admin grant → zero-cash confirm succeeds
- Claim grant → debit succeeds
- Trace E: two delayed confirms → one INITIAL lot
- Voucher redeem ledger shape assertion

## Acceptance criteria

- [x] New admin/claim grants always create matching promo ledger credit
- [x] Zero-cash checkout with admin credits completes without “Insufficient wallet balance”
- [x] Delayed referral cannot create two INITIAL lots for one edge
- [x] Voucher apply posts liability burn, not platform promo expense
- [x] Invalid voucher does not clear a valid coupon/auto selection

## Risks

- Double-funding if repair + new grant race — use idempotency keys
- Changing voucher funding may affect operator settlement reports — update revenue analytics

## Exit checklist

- [ ] Staging: Trace B/E green (run repair dry-run, then smoke admin grant → zero-cash)
- [ ] Finance spot-check: sample voucher redemption journal

## Progress note (2026-08-16)

Shipped:
- `promo-credit-grant-ledger.ts` + wired into admin grant, claim grant, referral activation
- Repair script: `apps/web/scripts/repair-promo-credit-funding.ts` (`--dry-run` / `--apply`)
- Referral INITIAL key `referral:{edgeId}:INITIAL`; QUALIFIED + existing INITIAL → RECURRING
- Voucher as `voucherAppliedXOF` payment instrument; `appendPromoLedgerEntries` burns `VOUCHER_LIABILITY`
- Soft-fail voucher (`voucherRejection`) keeps coupon/auto; checkout UI surfaces error
- Wallet confirm maps underfunded promo credits to “Promo credits unavailable…”
- Tests: `evaluate.test.ts`, `phase01-incentive-ledger.test.ts`, `promo-ledger.test.ts`
