# 06 — Remediation Plan

Do **not** start coding until product picks the window policy for terminal statuses (below). Default recommendation is Option A.

## Decision D1 — What should chips count?

| Option | Behavior | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **A (recommended)** | Chips = same window as list (default rolling; honor toolbar dates) | Chip ≡ list; fixes prod report | Past ARRIVED not visible unless dates widened |
| B | Chips all-time; list all-time | Consistent but huge board | Defeats rolling ops UX; perf |
| C | Split: “Ops” chips windowed + “History” toggle all-time | Clearest long-term | More UI |

**Ratify A** unless ops explicitly needs always-visible historical ARRIVED/CANCELLED without touching dates.

## Phase 0 — Shared where builder (closes DISP-001, DISP-004)

1. Extract `buildOperatorTripWhere({ companyId, status, serviceType, scheduleId, routeId, q, startDate, endDate, driverProfileId })` in e.g. `features/operator/lib/trips/trip-where.ts` or next to router.
2. Default dates via `getAppRollingTripWindow(14)` when both dates absent (except `driverProfileId` full-history mode — keep existing exception).
3. Parse dates with `startOfAppCalendarDay` / `endOfAppCalendarDay` (closes DISP-006).
4. `list` and `statusCounts` both call it.

## Phase 1 — UI honesty (closes DISP-002, DISP-003, DISP-005)

1. All badge ← `statusCounts` sum **or** separate unfiltered total field — never filtered `list.total`.
2. Empty state: filtered → `noTripsMatch`; unfiltered empty → `noTripsYet`.
3. Render `list.window` (or toolbar dates) as visible range text.
4. Prefetch `statusCounts` on the page with matching inputs (DISP-010).

## Phase 2 — Align horizons (DISP-007)

Share `OPERATOR_TRIP_BOARD_DAYS = 14` between generator and list; document inclusive day count in one comment.

## Phase 3 — Data lifecycle (DISP-008) — separate product session

1. Inventory overdue SCHEDULED / stale BOARDING per company (SQL from 03-symptom-repro).
2. Choose: archive empty overdue SCHEDULED; force-cancel or arrive stale BOARDING with audit note; optional History tab.
3. Add cron only after policy sign-off.

## Phase 4 — Tests

No current tests cover `statusCounts` vs `list` parity. Add:

1. Unit: where-builder — default window bounds; endDate inclusive EOD; status filter.
2. Router/integration (or pure where tests): given fixtures with past ARRIVED + future SCHEDULED, chips match list totals per status.
3. UI optional: empty copy branch when `status=BOARDING` and total 0.

## Out of order / do not

- Do not “fix” by removing the list window without a History plan.
- Do not delete historical trips with bookings.
- Do not change Prisma enum.
