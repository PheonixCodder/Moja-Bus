# Operator Audit Remediation Tracker

**Source:** `artifacts/operator-dashboard-complete-engineering-audit.md`  
**Started:** 2026-07-19  
**Completed:** 2026-07-19  
**Gate:** `cd apps/web && pnpm typecheck` + `pnpm test` after each phase; full typecheck+test+build after Phase 8.

## Phase status

| Phase | Status | Last gate |
|-------|--------|-----------|
| 0 Harness | done | escrow helpers + tests |
| 1 Money | done | typecheck + tests |
| 2 Trips | done | typecheck + tests |
| 3 Booking/Search | done | typecheck + tests |
| 4 Schedules/Fleet | done | typecheck + tests |
| 5 IAM/Bank | done | typecheck + tests |
| 6 Analytics/nuqs | done | typecheck + tests |
| 7 Medium polish | done | typecheck + tests |
| 8 MF + docs + final | done | typecheck + 73/73 tests + build exit 0 |

## Issue → phase map

### Phase 1 — Money
- [x] C1 Escrow ledger journal
- [x] C2 Escrow concurrent double-credit
- [x] C3 CASH/VOUCHER clawback
- [x] C6 Card confirm idempotency
- [x] C7 AccountingEngine reserved solvency
- [x] H3 Escrow fail closed without snapshot
- [x] H4 Withdraw Paystack / metadata
- [x] H5 Withdraw UI reserved balance
- [x] H23 Withdraw pending state
- [x] H24 Wallet TOCTOU
- [x] H25 Money as string
- [x] M8 Refund remainder race
- [x] M18 Per-seat net dust

### Phase 2 — Trips
- [x] C4 updateStatus≠CANCELLED
- [x] C5 cancelTripWithRefunds harden
- [x] H6 trips.list q SQL
- [x] H7 assignBus guards
- [x] H8 check-in trip/company
- [x] M1–M4, M6, M25

### Phase 3 — Booking/Search
- [x] H1 hold ownership
- [x] H17 formatters
- [x] M9 bookings filters UI
- [x] M28 createHold revalidate

### Phase 4 — Schedules/Fleet
- [x] C9–C12 trip unique, generator company bus, schedule reconcile, route terminal ownership
- [x] H11–H14, H16, H19–H20, H22–H23 fare/cron/exception/createBus/terminals
- [x] M11–M15 preferred bus / fleet IAM

### Phase 5 — IAM/Bank
- [x] C8 bank recipient reset
- [x] H9–H10 demotion reset + ADMIN withdrawals
- [x] H21 invite URL omitted in production
- [x] M17, M21–M22, M27 templates (OPERATIONS trips:cancel, FINANCE bookings:read)

### Phase 6 — Analytics/nuqs
- [x] H15 revenue Abidjan + refund aggregates
- [x] H18 trips dates + schedules routeId wired
- [x] M10 / M20 withdraw UX + preferred-bus warning

### Phase 7 — Medium remainder
- [x] M5 boardedAt/completedAt written
- [x] M7 assignBus layout compatibility (existing)
- [x] M16 reconcile-payments verify-then-branch
- [x] M19 ActivityLog Json metadata
- [x] M23/M24/M26/L9 pragmatic / deferred where low value

### Phase 8 — MF + docs
- [x] CSV exports (bookings + ledger)
- [x] Docs: payment_system.md, progress-tracker, ui-registry, memory
- [x] Final typecheck + test

## Deferred backlog
- Dual-control CASH, step-up OTP bank reveal, stuck-escrow workbench, heatmaps, reviews UI, bulk ops, full monolith splits

## Gate commands
```bash
cd apps/web && pnpm typecheck
cd apps/web && pnpm test
cd apps/web && pnpm build   # Phase 8
```
