# Operator Dashboard Audit — Master Fix Tracker

**Audit Source:** `artifacts/operator-dashboard-complete-engineering-audit.md`  
**Total Issues:** 80 (12 Critical · 25 High · 28 Medium · 15 Low)  
**Total Missing Features:** 15  
**Last Updated:** 2026-07-19

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Complete |
| ❌ | Blocked |

---

## Phase Overview

| Phase | Name | Issues | Priority | Status |
|-------|------|--------|----------|--------|
| Phase 1 | Money & Ledger Integrity | C1, C2, C3, C6, C7 | P0 — Block Release | ✅ |
| Phase 2 | Security & Tenant Isolation | C4, C5, C8, C9, C10, C12, H1 | P0 — Block Release | ✅ |
| Phase 3 | Schedule & Inventory Integrity | C11, H12, H13, H19, H22 | P0 — Block Release | ✅ |
| Phase 4 | IAM & Permissions | H9, H10, H11, H14, H16, H21, H23 | P1 — GA Gate | ✅ |
| Phase 5 | Business Rules & Operational Correctness | H2–H8, H15, H17, H18, H20, H24, H25 | P1 — GA Gate | ✅ |
| Phase 6 | Medium Priority Issues | M1–M28 | P2 — Quality | ⬜ |
| Phase 7 | Low Priority Issues | L1–L15 | P3 — Polish | ✅ |
| Phase 8 | New Features | F1–F15 | P4 — Post-GA | 🔄 |

---

## Phase 1 — Money & Ledger Integrity

| ID | Issue | Status |
|----|-------|--------|
| C1 | Escrow release changes balances with no ledger journal | ✅ |
| C2 | Concurrent release-escrow can double-credit available balance | ✅ |
| C3 | CASH/VOUCHER cancel does not claw back operator escrow net | ✅ |
| C6 | Card booking confirmation lacks ledger idempotency | ✅ |
| C7 | AccountingEngine solvency ignores reserved when releaseFromReserve | ✅ |

**Phase 1 Progress: 5 / 5**

---

## Phase 2 — Security & Tenant Isolation

| ID | Issue | Status |
|----|-------|--------|
| C4 | trips.updateStatus can CANCELLED without refunds or trips:cancel | ✅ |
| C5 | Trip cancel non-atomic; post-departure force-cancels without money; holds survive | ✅ |
| C8 | Bank update can keep verified Paystack recipient for old account | ✅ |
| C9 | Duplicate trips under concurrent generation (no unique constraint) | ✅ |
| C10 | Trip generator does not scope bus to schedule company | ✅ |
| C12 | Route create/update does not verify terminal ownership | ✅ |
| H1 | releaseHold / payment init lack hold ownership | ✅ |

**Phase 2 Progress: 7 / 7**

---

## Phase 3 — Schedule & Inventory Integrity

| ID | Issue | Status |
|----|-------|--------|
| C11 | MODIFIED exceptions / calendar edits leave stale trips | ✅ |
| H12 | Fare uniqueness blocks date-windowed prices; deactivate removes last full-route fare | ✅ |
| H13 | Preferred bus inactive still selected by cron; regenerate override not persisted | ✅ |
| H19 | Exception ServiceException no unique (scheduleId, date); removeException incomplete | ✅ |
| H22 | Partial calendar update can clear all weekdays | ✅ |

**Phase 3 Progress: 5 / 5**

---

## Phase 4 — IAM & Permissions

| ID | Issue | Status |
|----|-------|--------|
| H9 | Staff role demotion keeps elevated permissions[] | ✅ |
| H10 | ADMIN template missing withdrawals:create | ✅ |
| H11 | Fleet page unconditional prefetch crashes non-fleet:read roles | ✅ |
| H14 | Terminals cities require routes:read | ✅ |
| H16 | Cron auth only in production NODE_ENV | ✅ |
| H21 | Invitation returns raw inviteUrl to client | ✅ |
| H23 | Terminal deactivate does not protect linked routes | ✅ |

**Phase 4 Progress: 7 / 7**

---

## Phase 5 — Business Rules & Operational Correctness

| ID | Issue | Status |
|----|-------|--------|
| H2 | Escrow stuck when ARRIVED without actualArrival | ✅ |
| H3 | Escrow fallback uses gross farePaidSum when snapshot missing | ✅ |
| H4 | Withdraw posts ledger success before Paystack ack; catch never reverses | ✅ |
| H5 | Withdraw UI escrow = posted − available not liveReservedBalance | ✅ |
| H6 | trips.list q applied after pagination | ✅ |
| H7 | assignBus no status guard + TOCTOU | ✅ |
| H8 | Check-in ignores trip status; token lookup global then FORBIDDEN | ✅ |
| H15 | Revenue analytics UTC buckets + full-table load + refund undercount | ✅ |
| H17 | Search/booking formatters use fr-FR + UTC | ✅ |
| H18 | Schedules routeId nuqs unused; trips startDate/endDate unused | ✅ |
| H20 | createBus ignores shared schema; busType vs layout mismatch | ✅ |
| H24 | Wallet pre-check outside posting transaction (TOCTOU) | ✅ |
| H25 | Number(bigint) on financial balances | ✅ |

**Phase 5 Progress: 13 / 13**

---

## Phase 6 — Medium Priority Issues

| ID | Issue | Status |
|----|-------|--------|
| M1 | Gate/notes cannot clear to null | ✅ |
| M2 | Trip status chips count current page only | ✅ |
| M3 | updateStatus(DELAYED) without minutes | ✅ |
| M4 | Delay concurrency double-shifts | ✅ |
| M5 | boardedAt/completedAt never written | ✅ |
| M6 | routeSnapshotJson may be double-encoded string | ✅ |
| M7 | Assign bus matches seat by label only | ✅ |
| M8 | Proportional refund remainder race | ✅ |
| M9 | Bookings nuqs status/tripId no UI | ✅ |
| M10 | Trips prefetch q vs client debounce mismatch | ✅ |
| M11 | Fleet/layouts overfetch seat graphs | ⬜ |
| M12 | Schedule create trips outside transaction | ⬜ |
| M13 | Waypoint stopOrder can collide with dest order | ✅ |
| M14 | updateFare allows price 0 | ✅ |
| M15 | Retired schedule booked trips still sellable | ✅ |
| M16 | reconcile-payments fakes charge.success | ✅ |
| M17 | Reveal bank with only OWNER + company:view | ✅ |
| M18 | Multi-seat Math.round remainder dust | ✅ |
| M19 | ActivityLog metadata often stringified | ✅ |
| M20 | Dual revenue parsers | ✅ |
| M21 | FINANCE cannot read bookings | ✅ |
| M22 | OPERATIONS lacks trips:cancel | ✅ |
| M23 | Manifest mixes holds + confirmed | ✅ |
| M24 | Soft-remove staff transferredAssignments: 0 | ✅ |
| M25 | Novu delay payloads use UTC | ✅ |
| M26 | Schedule UI date parse local browser | ✅ |
| M27 | getDashboardMetrics exposes bus counts without fleet:read | ✅ |
| M28 | Search resume offer staleness | ✅ |

**Phase 6 Progress: 26 / 28** — _Verified 2026-07-20: M1, M2, M8, M9, M10, M13, M16, M17, M18, M23, M26, M27, M28 confirmed already fixed in source (M## comments + correct logic across trips.ts, routes.ts, operator.ts, cancellation-service.ts, booking-dialog-flow.tsx, operator-trips-view.tsx, manifest-drawer.tsx, trips/page.tsx, pricing-resolver.ts). M3–M7, M14, M19–M22, M25 were fixed earlier. Remaining: M11 (perf — `seatTemplates` legitimately used by layout preview canvas; not a correctness bug) and M12 (deferred by design — schedule-create keeps trip generation outside the tx so a future-dated/transient-failure schedule still persists; documented in schedules.ts)._

---

## Phase 7 — Low Priority Issues

| ID | Issue | Status |
|----|-------|--------|
| L1 | Trip get heavy seats+bookings | ✅ |
| L2 | Check-in race mostly idempotent | ✅ |
| L3 | Trip cancel Novu amount may overstate | ✅ |
| L4 | Settings/notifications section incomplete | ✅ |
| L5 | Operator search dialog coverage gaps | ✅ |
| L6 | Missing export CSV on bookings/revenue | ✅ |
| L7 | Missing bulk check-in / bulk cancel | ✅ |
| L8 | Accessibility: combobox/drawer labels incomplete | ✅ |
| L9 | Missing skeletons on several pages | ✅ |
| L10 | context docs partially stale | ✅ |
| L11 | Reviews model unused in operator UI | ✅ |
| L12 | TripStop actualArrival/Departure unused | ✅ |
| L13 | SeatStatus enum vs TripSeat.isActive duality | ✅ |
| L14 | Onboarding "bank complete" without recipient | ✅ |
| L15 | withdrawPage 0-index confusion | ✅ |

**Phase 7 Progress: 15 / 15** — _All items resolved (2026-07-19). L1 `trips.get` split into `getManifest` + lazy `getSeatMap`; L5 operator `globalSearch` + entity-grouped command palette; L7 bulk check-in/cancel mutations + drawer UI; L8 aria-labels on combobox/reason inputs + focus-trapped (modal) manifest drawer; L11 `Review.response`/`respondedAt` schema + `operator.listReviews`/`respondToReview` + Reviews tab; L10 docs (tracker, phase-7, memory) brought in sync with actual code state._

---

## Phase 8 — New Features

| ID | Feature | Maps To | Status |
|----|---------|---------|--------|
| F1 | Stuck escrow / failed refund queue (Ops Workbench) | — | ⬜ |
| F2 | Export bookings, ledger, payouts (CSV) | L6 | ✅ |
| F3 | Date-range controls on trips | — | ⬜ |
| F4 | Route filter on schedules | H18 | ⬜ |
| F5 | Status filter chips on bookings UI | M9 | ⬜ |
| F6 | Audit trail UI (bank reveal, withdrawals, trip cancels) | — | ⬜ |
| F7 | Preferred bus health warning | H13 | ⬜ |
| F8 | Reconcile schedule button after route edits | — | ⬜ |
| F9 | _(absent from `new-features.md` source — verify)_ | — | ⬜ |
| F10 | Occupancy heatmaps / no-show rates | M5 | ⬜ |
| F11 | Dual-control large CASH refunds | — | ⬜ |
| F12 | Step-up auth for bank reveal / large withdrawals | M17 | ⬜ |
| F13 | Search: price lock / offer version after login resume | M28 | ⬜ |
| F14 | Mark no-show / boardedAt workflow | — | ⬜ |
| F15 | Company verification status on withdraw | — | ⬜ |

**Phase 8 Progress: 1 / 15** — _Only F2 (CSV export) is implemented (as L6). The other 14 are post-GA features, mostly overlapping Phase 6 medium items (M9→F5, M17→F12, M28→F13). Note: `new-features.md` lists 14 features (F9 missing) yet claims "Total Missing Features: 15" — discrepancy flagged for verification._

---

## Summary Totals

| Phase | Total | Completed | Remaining |
|-------|-------|-----------|-----------|
| Phase 1 | 5 | 5 | 0 |
| Phase 2 | 7 | 7 | 0 |
| Phase 3 | 5 | 5 | 0 |
| Phase 4 | 7 | 7 | 0 |
| Phase 5 | 13 | 13 | 0 |
| Phase 6 | 28 | 26 | 2 |
| Phase 7 | 15 | 15 | 0 |
| Phase 8 | 15 | 1 | 14 |
| **Total** | **95** | **79** | **16** |
