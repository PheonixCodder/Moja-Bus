# 04 — Findings Catalog

Severity: **P0** blocker · **P1** critical broken core flow · **P2** major reliability · **P3** polish.

---

## DISP-001 — `statusCounts` ignores list date window (P1)

**Where:** `apps/web/trpc/routers/trips.ts` `statusCounts` (≈L488–518) vs `list` (≈L298–317)

**What:** Counts are all-time; list defaults to `getAppRollingTripWindow(14)`.

**Impact:** Chip badges disagree with the list. Scheduled inflated with history. Terminal statuses show non-zero chips that open to empty boards.

**Evidence:** Production 1027 SCHEDULED vs 340 All; Boarding/Arrived/Cancelled non-zero but empty.

**Fix direction:** Apply the same departure window (and optional filters) to `statusCounts`. Prefer sharing a `buildTripListWhere(ctx, input)` helper so the two cannot drift again.

---

## DISP-002 — All chip badge bound to filtered `list.total` (P1)

**Where:** `operator-trips-view.tsx` All button badge = `listData.total`

**What:** All is not an independent total; it mirrors the active list query.

**Impact:** Opening Boarding/Arrived/Cancelled with empty window sets All badge to 0 — reads as “company wiped.”

**Fix direction:** Bind All to either (a) sum of windowed `statusCounts`, or (b) a dedicated `list` call / field with `status` cleared, or (c) return `unfilteredTotal` from list alongside filtered `total`.

---

## DISP-003 — Empty state uses “No trips yet” for filtered empties (P1 UX)

**Where:** `operator-trips-view.tsx` empty branch; i18n `noTripsYet` / `noTripsYetDesc`

**What:** `listData.total === 0` ⇒ onboarding empty copy regardless of active filters.

**Impact:** Operators are told to create schedules when trips already exist outside the filter/window.

**Fix direction:** Prefer `noTripsMatch` whenever `status !== "ALL"` or any other filter is set; reserve `noTripsYet` for All + no filters + total 0. Optionally mention widening the date range.

---

## DISP-004 — Status chips do not respect toolbar date / service / search filters (P2)

**Where:** `statusCounts` input only allows optional `scheduleId` / `routeId`. UI never even passes those. Toolbar `startDate`/`endDate`/`serviceType`/`q` only hit `list`.

**Impact:** After narrowing dates in the toolbar, chips still show global numbers — second-order version of DISP-001.

**Fix direction:** Extend `statusCounts` input to mirror list filters; pass the same `listInput` fields from the view (minus pagination).

---

## DISP-005 — Rolling window never shown in UI (P2)

**Where:** `trips.list` returns `window: { startDate, endDate }`; view ignores it.

**Impact:** Operators cannot tell the board is “today → +14” only. Inflates trust in chips and hides why history vanished.

**Fix direction:** Show a subtle range label next to Refresh / `totalInfo`. When toolbar dates override, show those instead.

---

## DISP-006 — Toolbar `endDate` parsed as UTC midnight (P2)

**Where:** `trips.list` → `new Date(input.endDate)` for `YYYY-MM-DD`

**What:** `lte: 2026-09-06T00:00:00.000Z` excludes almost all departures on the end day (Abidjan is UTC+0).

**Impact:** Manual “To date” filter silently drops the last selected day.

**Fix direction:** Parse with `endOfAppCalendarDay` / `startOfAppCalendarDay` from `@/lib/timezone` (same as rolling window). Mirror on admin `listDispatchTrips` `to` if desired (same pattern).

---

## DISP-007 — Generator horizon vs list window off-by-one (P3)

**Where:** `getCandidateDepartureDates({ daysCount: 14 })` = today … today+13; `getAppRollingTripWindow(14)` = today … today+14.

**Impact:** List can include one extra calendar day beyond what generation targets (usually empty unless manually created).

**Fix direction:** Align constants (shared `TRIP_BOARD_DAYS = 14`) and document inclusive semantics once.

---

## DISP-008 — No automated closure of overdue SCHEDULED / stale BOARDING (P2 data)

**Where:** No cron found that transitions past-due trips; status only via `trips.updateTripStatus` / cancel / driver complete.

**Impact:** All-time SCHEDULED grows without bound (explains 1027). Stale BOARDING rows linger and poison chips + bus conflict checks (`checkBusScheduleConflict` includes all active statuses with no date bound).

**Fix direction (policy session):** Choose one — (1) nightly mark overdue SCHEDULED with no bookings as archived/cancelled, (2) board “History” mode for past statuses, (3) both. Do not silently delete booked history.

---

## DISP-009 — Duplicate status controls (chips + toolbar Select) (P3)

**Where:** Status chips and `TripsToolbar` Select both write `params.status`.

**Impact:** Not a functional bug; cognitive noise. Toolbar still useful for DELAYED/DEPARTED when chip hidden at 0.

**Fix direction:** Optional — keep chips as primary; toolbar status as advanced or remove duplication.

---

## DISP-010 — `statusCounts` not prefetched on page (P3)

**Where:** `trips/page.tsx` prefetches only `trips.list`

**Impact:** Chips may flash empty/zero then populate (minor).

**Fix direction:** Prefetch `statusCounts` with the same filter args once unified.

---

## DISP-011 — Admin Dispatch has no default window (P3 / informational)

**Where:** `admin.listDispatchTrips`

**Impact:** Different semantics than operator board; can OOM/slow on large datasets if filters omitted. Not the reported bug, but parity debt.

**Fix direction:** Separate admin audit; consider default from/to.

---

## Non-findings (checked OK)

| Check | Result |
| :--- | :--- |
| Status enum mismatch UI ↔ Prisma ↔ Zod | Aligned |
| Invalid transitions for Boarding→Arrived etc. | Guarded in `lib/trip-status.ts` |
| Archived trips leaking into chips | Filtered (`archivedAt: null`) |
| Wrong company tenancy | `operatorCompanyProcedure` + `companyId` |
| nuqs rejecting BOARDING/ARRIVED/CANCELLED | `parseAsStringLiteral` includes full enum |
| Card render crash on those statuses | Unlikely — empty `items` before map |

---

## Count summary

| Severity | IDs |
| :--- | :--- |
| P1 | DISP-001, DISP-002, DISP-003 |
| P2 | DISP-004, DISP-005, DISP-006, DISP-008 |
| P3 | DISP-007, DISP-009, DISP-010, DISP-011 |
