# 09 — Status Machine, Shifts & Earnings

> Audit date: 2026-08-26 · Sources: `drivers.ts:1377-2410`, `init.ts:303-349`, `lib/driver-run-state.ts`, `lib/driver-earnings.ts`, driver-app profile/earnings screens.

## 1. DriverStatus transitions — one authority per edge (F-DV-06 matrix)

| Edge | Authority |
|---|---|
| OFFLINE/RESTING/AVAILABLE ↔ each other (idle, shiftless) | `updateMyStatus` (free) |
| → ON_DUTY | **only** `toggleShift(onDuty:true)` — a ledger row must back it |
| ON_DUTY → anything | only `toggleShift(onDuty:false)` (prevents silent shift abandonment) |
| any mid-run (currentTripId set) | nobody hand-edits; start/complete + forced convergence own it |
| SUSPENDED / REJECT teardown / restore | verification surfaces (`verifyDriver` operator+admin) via `suspendDriverOperationalState` |
| post-run landing | `resolvePostRunStatus(openShift)` ⇒ AVAILABLE with open shift else OFFLINE |

`updateMyStatus` refuses when mid-run ("finish or report it"), when an open shift exists ("clock out via the duty toggle"), and always refuses ON_DUTY requests. Phase 31 D8-a additionally stripped `status` from `updateDriver` (the generic operator write bypassed this whole matrix).

## 2. Shift ledger (`DriverShift`)

- Clock-on: VERIFIED + licence-valid-today gates; exactly-one-open-shift enforced in-code AND by DB partial unique index (migration 20260824000001); company attribution deterministic (client companyId or most-recent ACTIVE affiliation). Conflicts are NAMED ("open since HH:MM UTC, for another carrier") not silently swapped.
- Clock-off: binds to the resolved company's open shift; totalMinutes computed; closing "nothing" vs "another carrier's shift" are distinct errors.
- `serviceType` on the shift records INTERCITY vs URBAN duty (dual-mode earnings labeling).
- `tripsCompleted` counter on shifts is never incremented by completion flow (known lag; reconcile covers driver-level totals).

## 3. Earnings (`getMyEarnings`)

- Rate: `PlatformSettings.driverPayRateXofPerMinute` (single DB truth; migration-backed after the env-var approach was REJECTED as drift-prone — F-IN-11 class), fallback DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE.
- Minutes: one raw-SQL aggregate over UNBOUNDED history (`FILTER` clauses; ISO Monday week-start; UTC day boundary); OPEN shifts accrue live minutes (`NOW() - startedAt`), closed shifts use ledger totalMinutes.
- Scope ruling (Phase 31): totals GLOBAL ACROSS CARRIERS by design — urban-contractor shifts coexist and are labeled per carrier in UI. Do not "fix" into per-company without product decision.
- Honesty: response carries `isPlaceholderRate: true`; UI shows "Estimation", never "Guaranteed Payout". The per-affiliation pay-rate model is explicitly post-launch roadmap.
- History: `getMyShifts` paginated with per-shift carrier labels.

## 4. Career aggregates & scoring recap

safetyScore 100→0 floor, −5 overspeed / −10 harsh braking, −20/day cap (locked FOR UPDATE across flush batches), +1 per 10 consecutive clean ARRIVED trips (reconcile job), never resets. Trust badges computed on read everywhere (TOP_RATED ≥4.8 w/ ≥10 reviews · SAFE_DRIVER ≥95 · VETERAN ≥500 trips). Rating aggregation fixed to driverRating-only semantics with nightly self-healing recompute.

## 5. Gaps

1. Placeholder pay rate ships to production UI (flagged honestly, but real money model pending).
2. No minimum-rest enforcement between shifts/trips.
3. Shift `tripsCompleted` dead field (above).
4. Earnings have no payout/withdrawal rail at all — informational only today.
