# Phase 00 — Cancel & refund money safety

**Status:** Implemented (2026-08-16)  
**Depends on:** Open decisions **locked** — D1=A, D2=subtotal-only, D3=B, **D7=OUT** (see `01-open-decisions.md`)  
**Unlocks:** Safe operator/passenger cancel for all settlement types; multi-seat trip cancel; honest refund UX  
**Findings:** P0-1, P0-2, P0-3, P0-4, P2-3, P2-5, P2-14, P2-27, P3-4, P3-7, P3-8

## Goal

Make cancellation and refund accounting correct for **every** settlement path (Paystack, wallet, zero-cash, mixed instruments) without destroying passenger entitlement when money movement fails.

## Scope

### In
- `CancellationService` settlement provenance (not “must have ExternalPayment SUCCESS”)
- Multi-seat `FinancialTransaction` uniqueness fix
- Trip/bulk cancel failure semantics (D3)
- Honest refund status model + channel copy
- Passenger cancel channel picker (at least stop hardcoding WALLET)
- `Refund.bookingId` + request idempotency
- ACCOUNT_CLASS constants for offline payable
- Unit/integration tests for Trace A, multi-seat, trip failure path

### Out
- Paystack refund API wiring unless D1=B (then Phase 00b)
- Full notification outbox (Phase 07)
- Pending-pay self-reservation (Phase 03)
- Incentive grant funding (Phase 01)

## Work items

### 00.1 — Settlement provenance model
1. Define `BookingSettlement` view (function or query): for a hold/booking, resolve:
   - `PAYSTACK` if SUCCESS ExternalPayment
   - `WALLET` if confirm posted WALLET_PAYMENT / passenger wallet debit
   - `ZERO_CASH` if confirmed with charge 0 and promo/voucher legs only
   - `MIXED` if both cash wallet + instruments
2. Replace cancel guard that requires `holdGroup.payment.status === SUCCESS`.
3. Branch clawback/credit using original ledger transactions (idempotent keys per booking).

### 00.2 — Multi-seat REFUND uniqueness (P0-2)
1. Change `FinancialTransaction @@unique([externalPaymentId, type])` so multiple refunds per payment are allowed.
2. Prefer: unique on `LedgerEntry.idempotencyKey` already; add `FinancialTransaction.idempotencyKey` required unique, **or** change unique to `[externalPaymentId, type, bookingId]` / drop type-level unique.
3. Migration + backfill strategy for existing rows.
4. Test: 3-seat hold, cancel all seats sequentially + trip cancel.

### 00.3 — Refund row schema (P2-27)
1. Add `Refund.bookingId` (FK), `requestIdempotencyKey` unique, optional `paystackRefundId` unique where not null.
2. One refund row per booking cancel attempt (status machine below).

### 00.4 — Honest refund statuses (P0-4, P2-3)
Per D1 default A (wallet/offline only):
| Outcome | Status / channel semantics |
|---------|----------------------------|
| Wallet credit posted | `COMPLETED` + channel WALLET + ledger proof |
| Offline payable posted | `PENDING_FULFILMENT` or `COMPLETED_INTERNAL` + channel CASH/VOUCHER — **never imply card return** |
| Provider refund (if D1=B) | `PENDING` → `PROCESSING` → `COMPLETED`/`FAILED` with provider id |

Remove writing `COMPLETED` + `paystackRefundId: null` for card-paid bookings without an explicit internal channel.

### 00.5 — Trip cancel failure (P0-3, P3-4)
1. Implement D3 default B: on refund failure, booking → `REFUND_PENDING` (new enum) **or** stay CONFIRMED with durable `Refund` FAILED + ops queue — pick one in schema.
2. Delete path that cancels ticket + `CANCEL_WITHOUT_REFUND` as success-ish outcome.
3. Ops list: bookings needing refund remediation.
4. Fix `skippedCheckedIn` reporting (return real skip count or omit field when hard-blocked).

### 00.6 — Passenger + operator UX (P2-14)
1. Passenger cancel: channel picker WALLET (if account) / respect guest→cash; disable invalid channels.
2. Operator copy: channel-specific refund wording (no “refunded to card” for A).
3. D2: document fee non-refund in UI.

### 00.7 — Constants & tests
1. Add missing ACCOUNT_CLASS entries (P3-7).
2. Tests: Trace A wallet cancel; zero-cash cancel; 2+ seat Paystack cancel; trip cancel with simulated refund failure; proportional math regression.

## Acceptance criteria

- [x] Wallet-confirmed and zero-cash bookings cancel successfully via operator + passenger paths
- [x] Multi-seat cancel posts N refund ledger txs without unique collision
- [x] Trip cancel never leaves passenger without ticket **and** without durable refund obligation
- [x] No Refund row claims COMPLETED Paystack refund without provider id (unless D1=B and id present)
- [x] `Refund.bookingId` populated for new cancels
- [x] Automated tests for Trace A + multi-seat + trip failure cover P0-1…P0-3

## Risks

- Changing FinancialTransaction unique may affect top-up/other types — audit all `type` values using that constraint
- New booking status needs board/check-in rules (check-in still requires CONFIRMED)
- Existing CANCEL_WITHOUT_REFUND historical rows need recon, not silent rewrite

## Exit checklist

- [ ] Staging recon: wallet confirms without payment; multi-REFUND counts; REFUND_PENDING queue empty or owned
- [x] Update audit Trace A/D as “fixed” in a progress note (do not delete audit)

## Progress note (2026-08-16)

Shipped: settlement provenance (`settlement-provenance.ts`), `CancellationService` rewrite, `REFUND_PENDING` + `PENDING_FULFILMENT`, optional `Refund.paymentId` + `bookingId` + `requestIdempotencyKey`, dropped `FinancialTransaction @@unique([externalPaymentId, type])` in favor of `businessIdempotencyKey`, trip cancel failure → `REFUND_PENDING`, passenger channel picker + fee copy, `ACCOUNT_CLASS.OFFLINE_REFUND_PAYABLE`, unit tests in `phase00-cancel-refund.test.ts`. Migration: `20260816140000_phase00_cancel_refund_safety`. **D7=OUT** (no Paystack splits).
