# Memory — Commercial lifecycle hardening

Last updated: 2026-08-16 (Phase 07 implemented — staging gate open)

## Locked decisions

- D1=A wallet/cash/voucher only (no Paystack card refund in this program)
- D2=subtotal only (no convenience fee refund)
- D3=B REFUND_PENDING / disruption on trip refund failure
- D4=A baseline migration
- D5=surgical quote
- D6=defer traveler/mobile (minimal quoteId wire only for schema compat)
- D7=OUT — Paystack splits not in scope; platform capture + ledger/escrow/payout
- D8=minimal outbox in Phase 07 ✅

## Phase 00–06 shipped

- Cancel/refund through UX/i18n/privacy (web)

## Phase 07 shipped (code)

- Plan: [10](docs/plans/commercial-lifecycle-hardening/10-phase-07-outbox-tests-staging.md)
- Migration `20260816200000_phase07_outbox` — `OutboxMessage`
- Enqueue on confirm / refund / trip-cancel / referral / hold-created
- Cron `/api/cron/process-outbox` (every minute); admin DLQ `/dashboard/admin/financials/outbox`
- Staging smoke: [20](docs/plans/commercial-lifecycle-hardening/20-phase-07-staging-smoke.md)
- Test matrix: [21](docs/plans/commercial-lifecycle-hardening/21-phase-07-test-matrix.md)

## Plan location

`docs/plans/commercial-lifecycle-hardening/`

## Next session starts with

1. Staging: migrate through `20260816200000` + run smoke checklist [20] + recon SQL
2. Eng + ops go/no-go; then growth features only
3. Optional: FR/EN web QA pass

## Do not

- Traveler-app deep work (D6)
- Paystack splits (D7=OUT)
- Wire WalletReservation writers without design
- VALIDATE Phase 02 CHECKs before cleaning dirty data
