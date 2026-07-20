# Operator Trips & Bookings — Complete Engineering Audit

**Date:** 2026-07-19  
**Scope:** Dispatch Board (`/dashboard/operator/trips`) + Bookings (`/dashboard/operator/bookings`)  
**Constraint:** Design is finalized — this audit covers business logic, data, APIs, IAM, workflows, and engineering quality only.  
**Product context:** These pages are operationally coupled to Schedules (trip generation, `scheduleId` drill-down, CANCELLED exceptions → refunds).

---

## 1. Executive Summary

Both pages ship usable day-of-ops UX (manifest, check-in, scan, cancel booking) but are **not release-ready at scale**. The highest risks are:

1. **SUPPORT staff crash on Trips** — page unconditionally suspense-fetches `fleet.getBuses` (`fleet:read`), which SUPPORT does not have.
2. **Schedules → Trips deep link is broken** — schedule cards link `?scheduleId=` but Trips UI never reads or passes it (API already supports it).
3. **Trip cancel leaves guest / failed-refund bookings CONFIRMED** on a CANCELLED trip; does not reuse shared `cancelTripWithRefunds`.
4. **Bookings list loads all company bookings into memory** then filters/paginates in JS — will collapse under volume.
5. **Operator booking cancel bypasses Staff IAM** (`payments.cancelBooking` has no `bookings:update` check).
6. **Delay logic corrupts stop times** on repeated delays; no status transition graph.
7. **Incomplete dispatch lifecycle UI** — no Mark Departed / Arrived / set gate / notes despite DB + API support.
8. **Trips monolith** (~1384 lines, many components in one file) vs bookings (partially split).

Trips and bookings are correctly company-scoped at the procedure layer for list/get/check-in, but financial cancel and trip-wide cancel paths have consistency and guest-refund holes that schedules already partially solved.

---

## 2. Scope Reviewed

| Area | Paths |
|------|--------|
| Pages | `apps/web/app/dashboard/operator/(dashboard)/trips/page.tsx`, `.../bookings/page.tsx` |
| Views / UI | `operator-trips-view.tsx` (~1384 LOC), `operator-bookings-view.tsx`, `components/bookings/*`, `ticket-scanner` |
| Services | `operator-booking-service.ts` (+ tests), `CancellationService`, `cancel-trip-with-refunds.ts` |
| tRPC | `trpc/routers/trips.ts` (~820 LOC), `operator.ts` booking procs, `payments.cancelBooking` |
| Schemas | `packages/schemas/src/trips.ts`, `operator-bookings.ts`, `permissions.ts` |
| Prisma | `Trip`, `TripStop`, `TripSeat`, `Booking`, enums `TripStatus`, `BookingStatus`, `PaymentStatus` |
| Couplings | Schedules card trip link, shared cancel helper, check-in from both pages |
| IAM | Sidebar gates, `requirePermission`, SUPPORT / OPERATIONS / FINANCE templates |

---

## 3. Critical Issues

### C1. SUPPORT (and any non-`fleet:read` role) cannot load Trips page

- **Severity:** Critical  
- **Category:** Security / IAM / Loading order  
- **Location:** `trips/page.tsx` (prefetch `fleet.getBuses`); `operator-trips-view.tsx` ~1206–1209 (`useSuspenseQuery` on `fleet.getBuses`); `fleet.ts` `getBuses` → `requirePermission(ctx, "fleet:read")`; `permissions.ts` SUPPORT template (no `fleet:read`)  
- **Explanation:** Trips page hard-depends on fleet list for bus assignment UI. SUPPORT is intentionally given `trips:read` + bookings check-in without fleet.  
- **Why wrong:** Same failure mode as the pre-fix schedules SUPPORT crash. Page throws FORBIDDEN / Suspense error instead of read-only dispatch board.  
- **Correct behavior:** Lazy/optional `useQuery` for buses only when `can("fleet:read")` or `can("trips:update")`; prefetch only what the actor can read; SUPPORT sees manifests/check-in without assign combobox.  
- **Suggested fix:** Mirror schedules pattern — `useStaffPermissions`, gate fleet query + assign UI, remove unconditional fleet prefetch.

### C2. Schedules → Trips `scheduleId` deep link ignored

- **Severity:** Critical  
- **Category:** Workflow / Product / URL state  
- **Location:** `schedule-card.tsx` → `href=/dashboard/operator/trips?scheduleId=...`; `operator-trips-view.tsx` only reads `manifest` (~1199–1204); `trips.list` input supports `scheduleId` (~81, 96–97) but UI always calls `list()` with no filters  
- **Explanation:** Enterprise schedules work added trip drill-down; dispatch board never wired it.  
- **Why wrong:** Operators click “View trips” from a schedule and see the entire company trip history unfiltered.  
- **Correct behavior:** Parse `scheduleId` (nuqs), pass to `trips.list`, show banner “Filtered to schedule X”, clear filter control.  
- **Suggested fix:** nuqs parsers + list query input; optional prefetch with that input on page.

### C3. Trip cancel does not refund guest bookings; can leave CONFIRMED tickets on CANCELLED trips

- **Severity:** Critical  
- **Category:** Business logic / Money / Consistency  
- **Location:** `trips.ts` `cancel` (~544–562); same pattern in `cancel-trip-with-refunds.ts` (~63–89); `CancellationService` wallet path rejects guests without `userId`  
- **Explanation:** Refund loop only runs `if (booking.userId)`. Guests and failed refunds leave booking `CONFIRMED` while trip is already `CANCELLED`. Trip is marked cancelled **before** refunds succeed (no transactional rollback).  
- **Why wrong:** Passengers keep valid tickets / QR for a cancelled departure; ledger and ops disagree; schedules exception path shares the same helper flaw.  
- **Correct behavior:** Cancel + refund must be atomic or compensating; guest path must use CASH/VOUCHER/Paystack channel or force status CANCELLED with open refund task; surface partial failures to operator UI.  
- **Suggested fix:** Unify on hardened `cancelTripWithRefunds`; cancel booking rows even when wallet refund impossible; return `refundResults` to UI toast; never claim success if any CONFIRMED booking remains.

### C4. Bookings list fetches entire company booking table then filters in process memory

- **Severity:** Critical  
- **Category:** Performance / Database / Pagination  
- **Location:** `operator-booking-service.ts` `listCompanyBookings` (~97–139)  
- **Explanation:** `findMany` with no date predicate loads all bookings; `matchesFilter` / sort / `slice(offset, limit)` run in Node. Default UI limit 50 after full scan.  
- **Why wrong:** O(N) memory and query cost per keystroke/filter; will time out / OOM as bookings grow.  
- **Correct behavior:** Push today/upcoming/past (or absolute date range) into SQL using `Africa/Abidjan` bounds on `originTripStop.scheduledDeparture` / `trip.departureDate`; `take`/`skip` or cursor in DB; return accurate `total` via `count`.  
- **Suggested fix:** Rewrite list query; add DB indexes supporting filter+companyId; keep Zod limit/offset as real server pagination.

### C5. Operator cancel-booking via `payments.cancelBooking` skips Staff IAM `bookings:update`

- **Severity:** Critical  
- **Category:** Security  
- **Location:** `booking-detail-drawer.tsx` (~50–75); `payments.ts` `cancelBooking` (~71–91) — only `protectedProcedure` + company membership via `CancellationService`  
- **Explanation:** Any authenticated OPERATOR with a company profile can cancel/refund if they know `bookingReference`, even without `bookings:update` (e.g. FINANCE template has neither bookings keys).  
- **Why wrong:** IAM catalog is authoritative for staff; this path ignores it.  
- **Correct behavior:** Use `operatorCompanyProcedure` + `requirePermission(ctx, "bookings:update")`, or wrap cancel in `operator.cancelBooking` that enforces IAM.  
- **Suggested fix:** Move operator cancel to operator router; keep passenger self-cancel on payments with ownership checks only.

---

## 4. High Priority Issues

### H1. Repeated “Log Delay” desynchronizes `delayMinutes` vs stop clocks

- **Severity:** High  
- **Category:** Business logic / Race / Incorrect information  
- **Location:** `trips.ts` `delay` (~398–428)  
- **Explanation:** Sets `delayMinutes` to the **new** input (overwrite), but **adds** that many minutes to every `TripStop` scheduled time and `estimatedArrival` each call. Second “15 min” delay → stops +30, badge still “+15m”.  
- **Why wrong:** Manifest times and passenger Novu “newTime” become wrong; operators cannot trust clocks.  
- **Correct behavior:** Store cumulative delay, or recompute stop times from original baseline + total delay; delay twice should be idempotent relative to baseline.  
- **Suggested fix:** Keep immutable original times (or compute from `routeSnapshot` + departure); set `delayMinutes` cumulatively; shift from baseline only.

### H2. No trip status transition validation

- **Severity:** High  
- **Category:** Invalid transitions / Business rules  
- **Location:** `trips.ts` `updateStatus` (~604–640)  
- **Explanation:** Any `tripStatusEnum` value can be applied (except weak BOARDING+bus check). Allows ARRIVED→SCHEDULED, CANCELLED→BOARDING, etc.  
- **Why wrong:** Corrupts ops history, escrow/clearance assumptions, passenger notifications.  
- **Correct behavior:** Explicit graph, e.g. SCHEDULED→BOARDING|DELAYED|CANCELLED; BOARDING→DEPARTED|DELAYED|CANCELLED; DEPARTED→ARRIVED; DELAYED→BOARDING|DEPARTED|CANCELLED; terminal CANCELLED/ARRIVED.  
- **Suggested fix:** Shared `assertTripTransition(from, to)` in `lib/`; UI only offers legal next actions.

### H3. Dispatch lifecycle incomplete in UI (API exists)

- **Severity:** High  
- **Category:** Missing flows / Product  
- **Location:** Manifest actions in `operator-trips-view.tsx` (~835–952) — Start Boarding, Delay, Cancel only; API has `updateStatus` DEPARTED/ARRIVED, `setGate`, `updateNotes`  
- **Explanation:** Operators cannot mark departed/arrived or set gate from the board they live in.  
- **Why wrong:** Boarding never progresses in product; `actualDeparture`/`actualArrival`/`gate` unused; passengers never get boarding/gate workflows from real ops.  
- **Correct behavior:** Action buttons for legal next statuses; gate + notes fields on manifest.  
- **Suggested fix:** Wire existing mutations with IAM (`trips:update`).

### H4. Trip cancel path duplicated; not using shared helper; UI hides refund failures

- **Severity:** High  
- **Category:** Architecture / Error handling  
- **Location:** `trips.ts` `cancel` vs `lib/cancel-trip-with-refunds.ts`; Manifest toast only “Trip cancelled” (~508–514)  
- **Explanation:** Schedules CANCELLED exceptions call helper; trips router reimplements. Helper exists but trips.cancel ignores it. Refund partial failures only logged.  
- **Why wrong:** Drift between schedule-driven and manual cancel; operators think all passengers refunded.  
- **Correct behavior:** Single code path; return/refund summary to client.  
- **Suggested fix:** `trips.cancel` → `cancelTripWithRefunds`; toast warn on failures.

### H5. Client-side filter/search/stats on full unpaginated trip list

- **Severity:** High  
- **Category:** Performance / Filtering  
- **Location:** `operator-trips-view.tsx` ~1206, 1219–1251; `trips.list` returns all trips with nested `seats` + seat rows (~113–149)  
- **Explanation:** List includes every `TripSeat`+`Seat` for every trip — massive overfetch. Status/search filter in browser. Stats count all historical trips.  
- **Why wrong:** Unusable with weeks of generated trips × 40–50 seats.  
- **Correct behavior:** Server filters (`status`, date window default next 14 days, `scheduleId`, search); list DTO without full seat maps; seats only on `trips.get`.  
- **Suggested fix:** Slim list select; default `startDate`/`endDate`; paginate.

### H6. Bookings “today/upcoming/past” use server local timezone, not `Africa/Abidjan`

- **Severity:** High  
- **Category:** Incorrect information / Filters  
- **Location:** `operator-booking-service.ts` `startOfToday`/`endOfToday` (~50–58)  
- **Explanation:** Uses `new Date()` local parts of the Node runtime (often UTC on Vercel). Product timezone is Abidjan.  
- **Why wrong:** Near-midnight bookings land in wrong bucket; ops “Today” wrong.  
- **Correct behavior:** Zone-aware day bounds (same helpers as trip generator / schedules).  
- **Suggested fix:** Reuse Abidjan calendar utilities.

### H7. Trips date grouping uses browser local timezone

- **Severity:** High  
- **Category:** Incorrect information  
- **Location:** `groupTripsByDate` (~154–162)  
- **Explanation:** `new Date(trip.departureDate)` then local Y-M-D.  
- **Why wrong:** Same trip appears under wrong day for staff not in UTC/CI; splits a single ops day.  
- **Correct behavior:** Group by Abidjan calendar date from UTC instant.  
- **Suggested fix:** Shared format helper.

### H8. Manifest displays schedule template time, not trip departure instant

- **Severity:** High  
- **Category:** Incorrect information  
- **Location:** Manifest / TripCard `formatTime(trip.schedule?.departureTime)` (~675, 1076) while listing uses `formatDate(trip.departureDate)`  
- **Explanation:** After delay, stop times move but UI still shows calendar `departureTime` string from Schedule. MODIFIED exceptions / delays ignored.  
- **Why wrong:** Dispatch sees wrong clock.  
- **Correct behavior:** Format time from `trip.departureDate` (+ delay) or first pickup `TripStop.scheduledDeparture`.  
- **Suggested fix:** Prefer trip/stop timestamps everywhere on this page.

### H9. `assignBusDriver` name implies drivers; schema has no driver assignment

- **Severity:** High (product honesty) / Medium (schema)  
- **Category:** Missing features / Stale naming  
- **Location:** Schema `Trip` (bus only); `assignBusDriverSchema` (busId only); UI “Assign bus”  
- **Explanation:** Procedure and schema names promise driver IAM that does not exist.  
- **Why wrong:** Docs/UI-registry say “assign bus/driver”; staff expect driver field.  
- **Correct behavior:** Either add driver staff assignment model or rename API to `assignBus`.  
- **Suggested fix:** Rename now; track driver assignment as future epic.

### H10. Prefetch + Suspense contract mismatches IAM and filter state

- **Severity:** High  
- **Category:** Prefetch / TanStack Query  
- **Location:** Trips page prefetches `trips.list()` + `fleet.getBuses`; Bookings page prefetches `listBookings({ filter: "today" })` but filter/search live in React state (not URL) — OK for today default; changing filter without Suspense boundary on page may hard-suspend  
- **Explanation:** Bookings page has **no** `<Suspense>`; list uses `useSuspenseQuery`. Trips prefetch fleet breaks SUPPORT.  
- **Correct behavior:** Prefetch only permitted queries; wrap list in Suspense; align prefetch input with URL state.  
- **Suggested fix:** As C1 + nuqs + Suspense.

---

## 5. Medium Priority Issues

### M1. Expired `PENDING_PAYMENT` still included on `trips.get` bookings

- **Severity:** Medium  
- **Category:** Status handling  
- **Location:** `trips.ts` `get` where `status in CONFIRMED, PENDING_PAYMENT` (~206–208) without `holdExpiresAt` check (list `_count` does filter holds correctly ~134–142)  
- **Why wrong:** Manifest passenger list / seat grid show dead holds as “held”.  
- **Correct behavior:** Same active-hold predicate as list count / search.

### M2. Seat occupancy denominator uses `trip.totalSeats` not active sellable seats

- **Severity:** Medium  
- **Category:** Incorrect calculations  
- **Location:** `SegmentOccupancySection` SeatFillBar (~375–377)  
- **Explanation:** Blocked/`isActive:false` seats still in denominator; EMPTY_SPACE/DRIVER_AREA may be in `totalSeats` depending on generation.  
- **Correct behavior:** Denominator = active passenger seats on trip.

### M3. Bus swap does not verify new bus capacity ≥ active bookings (only label compatibility)

- **Severity:** Medium  
- **Category:** Edge cases  
- **Location:** `assignBusDriver` (~253–274)  
- **Explanation:** Smaller bus with overlapping labels can pass if labels subset matches.  
- **Correct behavior:** Also require `newBus.seats.length >= activeBookings` and no duplicate label mapping collisions.

### M4. Delay Novu `newTime` uses `estimatedArrival` or departure+delay — not new origin departure

- **Severity:** Medium  
- **Category:** Incorrect information / Notifications  
- **Location:** `trips.ts` delay payload (~479)  
- **Why wrong:** Passengers told wrong “new departure” concept.  
- **Correct behavior:** New origin departure = old departure + delayMinutes.

### M5. Check-in does not set `boardedAt` / never moves booking to `COMPLETED`

- **Severity:** Medium  
- **Category:** DB features not exposed / Incomplete workflow  
- **Location:** Schema `checkedInAt`, `boardedAt`, `completedAt`; `OperatorBookingService.checkIn` only sets `checkedInAt`  
- **Explanation:** Product has richer passenger lifecycle than UI/API uses.  
- **Correct behavior:** Define when boarded vs completed (e.g. on DEPARTED/ARRIVED trip jobs).

### M6. Bookings UI missing status / tripId filters despite Zod + service support

- **Severity:** Medium  
- **Category:** Filtering / Product  
- **Location:** `operatorListBookingsSchema`; `BookingsList` only passes `filter` + `search`  
- **Correct behavior:** Status chips, trip-scoped view from manifest link (`?tripId=`).

### M7. No “load more” / page controls though offset/limit exist

- **Severity:** Medium  
- **Category:** Pagination  
- **Location:** Schema defaults limit 50; UI never increments offset  
- **Why wrong:** Silent truncation after in-memory slice (and after C4 fix, still need UI).

### M8. Search on bookings is submit-only (no debounce); trips search is client-only

- **Severity:** Medium  
- **Category:** Search  
- **Location:** Bookings form submit (~86–88); Trips immediate filter (~1194, 1219)  
- **Correct behavior:** Debounced URL-backed search hitting server.

### M9. Permission-gated actions not reflected in Trips/Bookings UI

- **Severity:** Medium  
- **Category:** Security / UX honesty  
- **Location:** Neither view uses `useStaffPermissions` for cancel / assign / check-in buttons  
- **Explanation:** API enforces permissions; UI shows actions that 403. SUPPORT lacks `trips:update`/`trips:cancel` but still sees assign/cancel controls.  
- **Correct behavior:** Hide/disable by `can(...)`.

### M10. `payments.cancelBooking` + drawer expose refund channels without verifying guest wallet eligibility

- **Severity:** Medium  
- **Category:** Workflow  
- **Location:** Drawer defaults WALLET; CancellationService rejects guest wallet  
- **Correct behavior:** Detect `userId` null → default CASH/VOUCHER; disable WALLET.

### M11. Trip create still `JSON.stringify` route snapshot; generator uses plain Json object

- **Severity:** Medium  
- **Category:** Consistency  
- **Location:** `trips.ts` `create` (~50) vs `trip-generator.ts`  
- **Why wrong:** Inconsistent snapshot shape for downstream readers.

### M12. Unused imports / dead search wiring in trips router

- **Severity:** Medium (hygiene)  
- **Location:** `trips.ts` imports `SearchFilters`, `SearchService`, `TripSearchReadRepository` — unused  
- **Suggested fix:** Remove dead code.

### M13. Optimistic bus assign types as `any`; list cache shape fragile

- **Severity:** Medium  
- **Category:** TanStack Query  
- **Location:** TripCard / ManifestDrawer optimistic updaters (~455–468, 993–1004)

### M14. Bookings detail missing paymentStatus, issuedAt prominence, hold group, refund history

- **Severity:** Medium  
- **Category:** DB ↔ UI  
- **Location:** `toDetail` has fare/issuedAt/token but drawer omits payment status / ticket token / link to trip schedule

### M15. No export / print manifest / CSV passenger list

- **Severity:** Medium  
- **Category:** Missing operational features  
- **Explanation:** Day-of ops typically needs printable manifest.

---

## 6. Low Priority Issues

### L1. Trips view monolith violates “one primary component per file”

- **Severity:** Low–Medium (maintainability)  
- **Location:** Entire `operator-trips-view.tsx` embeds StatusBadge, SeatFillBar, SegmentSeatGrid, ManifestDrawer, TripCard, helpers  
- **Suggested fix:** Split like bookings/staff/schedules under `features/operator/components/trips/`.

### L2. Accessibility gaps

- **Severity:** Low  
- **Category:** a11y  
- **Examples:** Trip card header expands via `div onClick` without keyboard/button role (~1045–1047); status filter combobox labeling; delay number input missing associated label; passenger table not a real `<table>` with headers linkage; drawer focus OK via Drawer primitive (assume radix).

### L3. Empty/error states incomplete

- **Severity:** Low  
- **Manifest error is text-only (~646–649); bookings empty OK; no retry button on trip detail failure.

### L4. Hardcoded guest email domain `@guest.mojaride.ci` for Novu

- **Severity:** Low  
- **Category:** Notifications  
- **Location:** trips cancel/delay/status loops  
- **Risk:** Fake inboxes; SMS channel unused despite phone collected.

### L5. `formatTime` ignores timezone and invalid schedule.departureTime empty string

- **Severity:** Low  
- **Location:** `formatTime("")` → `12:undefined AM` risk

### L6. Stats strip ignores CANCELLED/DEPARTED/ARRIVED counts and date window

- **Severity:** Low  
- **Location:** ~1248–1251

### L7. Check-in badge does not show paymentStatus anomalies (CONFIRMED + UNPAID)

- **Severity:** Low  
- **Category:** Impossible states visibility

### L8. Documentation drift

- **Severity:** Low  
- **Location:** `context/ui-registry.md` “assign bus/driver”; build-plan may still mark trip ops incomplete relative to gate/notes  
- **Suggested fix:** Update registry after fixes.

### L9. Bookings page unused imports in view

- **Severity:** Low  
- **Location:** `operator-bookings-view.tsx` imports Link, Badge, Card, Dialog, etc. unused (drawer owns cancel UI)

### L10. No virtualization for long trip/booking lists

- **Severity:** Low until volume grows (then High)

---

## 7. Missing Features

| Feature | Notes |
|---------|--------|
| Schedule-scoped trip board | API ready; UI/URL missing |
| Date range filter on trips | API `startDate`/`endDate` unused |
| Route filter | API `routeId` unused |
| Mark Departed / Arrived | API `updateStatus` unused in UI |
| Set gate / notes | API `setGate` / `updateNotes` unused |
| Driver assignment | Not in schema |
| Printable / exportable manifest | Missing |
| Booking status filter chips | Schema supports |
| Trip-scoped bookings (`tripId`) | Schema supports; deep link from board missing reverse |
| Bulk check-in / no-show marking | Missing |
| Refund failure inbox / retry | Missing |
| Seat block/unblock on trip | `TripSeat.isActive` / `blockedReason` not editable in UI |
| Live refresh / polling | Manual refresh only |
| Create ad-hoc trip UI | `trips.create` exists, no operator UI |
| Boarded / completed booking states | Columns unused |
| Pagination controls | Both pages |
| nuqs shareable filters | Both pages |

---

## 8. Database ↔ UI Inconsistencies

| DB field / enum | UI / API usage |
|-----------------|----------------|
| `Trip.gate` | Stored + Novu; **no edit UI** |
| `Trip.notes` | Delay can set notes in API; **UI delay form ignores notes** |
| `Trip.actualDeparture` / `actualArrival` | Set on status change; **never displayed** |
| `Trip.cancelReason` | Set on cancel; **not shown on cancelled cards** |
| `Trip.delayMinutes` | Shown; **semantics wrong after multi-delay** |
| `Trip.routeSnapshotJson` | Not shown (OK) but create stringify inconsistency |
| `TripSeat.blockedReason` | Not exposed |
| `Booking.boardedAt` / `completedAt` / `clearedAt` | Not in operator UI |
| `Booking.paymentStatus` | In list DTO; **not shown on row** |
| `Booking.ticketToken` | In detail DTO; **not shown** (QR regenerate) |
| `BookingStatus.COMPLETED` / `EXPIRED` | Filter schema allows; UI filters ignore |
| `TripStatus` full set | Filter UI has all; **actions don’t drive DEPARTED/ARRIVED** |
| Driver | **No column** but API name implies it |
| `HoldGroup` / payment / refund records | Cancel uses them; **UI no history** |

---

## 9. Backend ↔ UI Inconsistencies

| Backend | UI |
|---------|-----|
| `trips.list({ scheduleId, status, dates, routeId })` | Always unfiltered list; client status/search |
| `trips.setGate` / `updateNotes` / DEPARTED/ARRIVED | Not wired |
| `cancelTripWithRefunds` | Schedules use it; trips.cancel duplicates |
| `operator.listBookings` status/tripId/limit/offset | Only filter+search; no paging UI |
| `fleet.getBuses` required by page | Breaks roles without `fleet:read` |
| `payments.cancelBooking` | Used for operator cancel without IAM key |
| List trip includes all seats | Only needed on manifest detail |
| Check-in `tripId` scoping | Manifest passes it; bookings list check-in does **not** pass tripId (weaker) |

---

## 10. Product Gaps

1. End-to-end day-of workflow: Board → Depart → Arrive not operable from Dispatch Board.  
2. Schedule-centric ops broken (deep link).  
3. No operational reporting from these pages (no-shows, load factor by segment for day).  
4. Guest refund / cash desk path unclear in cancel UIs.  
5. SUPPORT intended as check-in role cannot open Trips; Bookings OK if they only use bookings page.  
6. No confirmation of multi-passenger refund impact when cancelling a full trip (count + amount).  
7. Connection to Revenue/ledger after cancel not visible to operator.

---

## 11. Workflow Issues

```
Schedules "View trips" --X--> Trips ignores scheduleId
Trips Manifest check-in --> OK (scoped)
Bookings "Manifest" link --> ?manifest=tripId --> OK
Trip Cancel --> Trip CANCELLED, then per-booking refund (partial) --> UI success always
Booking Cancel (drawer) --> payments path --> IAM gap; guest WALLET fails
Delay --> mutates stops; repeat delay compounds
Boarding --> only from SCHEDULED; no path from DELAYED→BOARDING in UI (API allows anything)
```

**Impossible / bad states observable:** CANCELLED trip + CONFIRMED booking; DELAYED with stop clocks ≠ delayMinutes; CONFIRMED + paymentStatus not PAID (if data bug) with no badge.

---

## 12. Performance Issues

1. **Trips list overfetch:** all trips × all seats × seat metadata.  
2. **Bookings full-table scan** + in-memory filter.  
3. **N+1 patterns in delay/cancel Novu loops** (acceptable async but heavy).  
4. **Delay stop updates** loop individual `tripStop.update` instead of batched.  
5. **No pagination / virtualization.**  
6. **Duplicate fleet fetch** prefetch + suspense.  
7. **Stats** recompute from full array each render (cheap vs fetch cost).

---

## 13. Query & Prefetch Audit

| Query | Prefetch | Client | Issues |
|-------|----------|--------|--------|
| `trips.list()` | Yes (no filters) | Suspense unfiltered | Should prefetch window + scheduleId |
| `fleet.getBuses` | Yes | Suspense always | IAM crash; should be conditional |
| `trips.get` | No | On manifest open | OK; could prefetch on hover |
| `operator.listBookings({today})` | Yes | Suspense; filter state may diverge | Add Suspense; nuqs; server date filter |
| `operator.getBooking` | No | Detail drawer | OK |
| `operator.checkInBooking` | — | Mutation | Invalidate list/get; bookings scanner double-invalidates |
| `payments.cancelBooking` | — | Mutation | Wrong router/IAM; invalidate OK |
| `trips.assign/delay/cancel/status` | — | Mutations | Invalidate list/get; cancel should expose refund summary |

---

## 14. nuqs Audit

**Neither page uses nuqs** (unlike schedules/staff/revenue).

| State | Should be URL? | Why |
|-------|----------------|-----|
| Trips `statusFilter` | Yes | Share/refresh |
| Trips `search` | Yes (debounced) | Share |
| Trips `scheduleId` | **Yes — required** | Schedules deep link |
| Trips `manifest` / selected trip | Yes (already partial via `useSearchParams`) | Prefer nuqs parser |
| Trips date range | Yes | Ops shifts |
| Bookings `filter` | Yes | Prefetch alignment |
| Bookings `search` | Yes | Share reference lookups |
| Bookings `detailId` | Optional | Deep link ticket |
| Bookings `status` / `tripId` | Yes when added | Manifest continuity |
| Page / pageSize | Yes | After server pagination |

---

## 15. Zod Audit

| Area | Status |
|------|--------|
| `packages/schemas/src/trips.ts` | Present for assign/delay/cancel/status enum |
| `trips.list` input | Inline zod in router — OK but could live in schemas package |
| `trips.create` input | Inline; no shared schema |
| `operator-bookings.ts` | Solid defaults for limit/offset/filter |
| Feature-local `features/operator/lib` parsers | **Missing** for trips/bookings URL state |
| Manual `parseInt` delay in UI | Should rely on schema coerce only after mutate |

**Recommend:** `features/operator/lib/trips/trip-search-params.ts` and `.../bookings/booking-search-params.ts` (nuqs + zod), mirror schedules.

---

## 16. TanStack Query Audit

- Trips: heavy suspense waterfall risk if fleet fails.  
- Optimistic assign duplicated in two components — extract mutation hook.  
- BookingsList suspense without page-level Suspense boundary.  
- No `placeholderData` when filter changes (full suspend).  
- Invalidation: check-in on bookings view invalidates twice (mutation onSuccess + handleScan).  
- No `staleTime` tuning for dispatch board (consider short polling later).  
- Cache keys: unfiltered `trips.list` vs future filtered lists must not collide incorrectly after fix.

---

## 17. Security Issues

1. **C1** SUPPORT trips page fleet FORBIDDEN.  
2. **C5** Cancel booking without `bookings:update`.  
3. Trip cancel impersonates `userRole: "ADMIN"` inside CancellationService — intentional bypass; ensure only company-scoped trip cancel can call it (trips router is company-scoped — OK) but still skips passenger ownership (OK for ops).  
4. UI shows destructive actions without permission gating (defense in depth missing).  
5. Ticket token / booking reference scan: company check present — good.  
6. Sensitive: detail DTO includes `ticketToken` — ensure not logged client-side; consider not returning raw token if QR regenerated server-side only.

---

## 18. Accessibility Issues

- Expandable trip cards not keyboard operable.  
- Icon-only refresh depends on visible text (has “Refresh” — OK).  
- Comboboxes need visible labels (“Status”, “Bus”).  
- Manifest passenger grid should be semantic table.  
- Cancel / delay confirmations: trip cancel inline; booking cancel has dialog (better). Trip cancel should confirm passenger refund count.

---

## 19. Scalability Concerns

1. Unbounded `trips.list` + seats include.  
2. Unbounded bookings `findMany`.  
3. Per-stop delay updates.  
4. Novu fan-out inline in request path (consider `after()`).  
5. Monolithic trips view blocks IAM/composition refactors.  
6. No archival strategy for past trips in default board query.  
7. Missing composite indexes for booking list by company + departure (once SQL filter exists).

---

## 20. Recommended Fixes

### P0 (before any staff-role rollout)

1. Gate fleet query/prefetch on permissions; SUPPORT-safe trips read path.  
2. Honor `scheduleId` (and prefer nuqs) from schedules.  
3. Harden trip cancel + refunds (reuse helper; guest/cash path; surface failures; don’t leave CONFIRMED on CANCELLED).  
4. Enforce `bookings:update` on operator booking cancel.  
5. Push bookings date filter into SQL with Abidjan timezone; real pagination.

### P1

6. Slim `trips.list` payload; server-side status/date filters; default rolling window.  
7. Fix delay cumulative semantics; add transition graph.  
8. Wire Departed / Arrived / gate / notes in manifest; permission-aware actions.  
9. Align displayed times with trip/stop timestamps.  
10. Split trips components; add trips/bookings URL parsers.

### P2

11. Status/tripId filters on bookings; export manifest; seat block UI; complete booking lifecycle fields; docs/registry sync; remove dead imports; optional polling.

---

## 21. Final Checklist

- [ ] SUPPORT can open Trips without `fleet:read`
- [ ] `?scheduleId=` filters dispatch board
- [ ] `?manifest=` still opens drawer
- [ ] Trip cancel refunds or safely closes all CONFIRMED bookings (incl. guests)
- [ ] Partial refund failures visible to operator
- [ ] `trips.cancel` uses shared helper
- [ ] Delay twice does not corrupt clocks
- [ ] Illegal status transitions rejected
- [ ] UI can Depart / Arrive / set gate
- [ ] Bookings list query bounded + timezone-correct
- [ ] Bookings pagination UI works
- [ ] Operator cancel requires `bookings:update`
- [ ] Assign/cancel/check-in buttons respect IAM
- [ ] List endpoints do not overfetch seats
- [ ] Times shown from trip/stop, Abidjan grouping
- [ ] nuqs for filters/search/scheduleId/manifest/filter
- [ ] Trips view split into components/lib
- [ ] Context docs updated (no “driver” unless real)
- [ ] Prefetch matches permissions + URL state
- [ ] Empty/error/retry states for detail failures
- [ ] a11y: keyboard expand + labeled filters

---

## Appendix A — File size / architecture snapshot

| File | ~LOC | Notes |
|------|------|-------|
| `operator-trips-view.tsx` | 1384 | Monolith; multiple components |
| `trpc/routers/trips.ts` | 820 | Full ops API; cancel/delay issues |
| `operator-bookings-view.tsx` | 176 | Thin; unused imports |
| `operator-booking-service.ts` | 362 | In-memory filter bottleneck |
| `booking-detail-drawer.tsx` | 276 | Cancel via payments |
| `bookings-list.tsx` / `booking-row.tsx` | small | Decent split |

## Appendix B — Permission matrix (relevant)

| Key | SUPPORT | OPERATIONS | Impact on these pages |
|-----|---------|------------|------------------------|
| `trips:read` | ✓ | ✓ | List/manifest |
| `trips:update` | ✗ | ✓ | Assign, delay, status, gate |
| `trips:cancel` | ✗ | ✓ | Cancel trip |
| `fleet:read` | ✗ | ✓ | **Trips page currently requires** |
| `bookings:read` | ✓ | ✓ | Bookings list |
| `bookings:update` | ✓ | ✓ | Check-in; **should** gate cancel |

## Appendix C — Coupling to Schedules (must stay consistent)

| Schedules behavior | Trips/Bookings expectation |
|--------------------|----------------------------|
| Preferred bus generates trips | Board shows those trips; assign = swap |
| CANCELLED exception → `cancelTripWithRefunds` | Manual cancel must same semantics |
| Link `trips?scheduleId=` | Must filter |
| Rolling generate-trips cron | Board volume grows → pagination mandatory |

---

*End of audit. No UI redesign proposed; all items are correctness, safety, scale, or missing operational capability behind the existing design.*
