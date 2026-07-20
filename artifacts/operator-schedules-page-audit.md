# Operator Schedules Page — Complete Engineering Audit

**Audit date:** 2026-07-19  
**Page:** `/dashboard/operator/schedules`  
**Primary UI:** `apps/web/features/operator/views/operator-schedules-view.tsx`  
**Page shell:** `apps/web/app/dashboard/operator/(dashboard)/schedules/page.tsx`  
**API:** `apps/web/trpc/routers/schedules.ts`  
**Schemas:** `packages/schemas/src/schedules.ts`  
**Generator:** `apps/web/lib/trip-generator.ts`  
**Prisma models:** `Schedule`, `ServiceCalendar`, `ServiceException`, `Fare`, `Trip`, `TripStop`, `TripSeat`, `Route`, `RouteWaypoint`  
**Scope rule:** Functional / data / API / product / security audit only. Visual design is treated as finalized.

---

## 1. Executive Summary

The schedules page implements a coherent operator workflow (list → 4-step create wizard → edit drawer → exceptions → fare edits → extend trips), and the core Prisma model shape largely matches the UI concepts.

It is **not release-ready for millions of users**. Several defects can produce empty trip windows, incorrect bus assignment, silent trip-generation failure, permission page crashes for legitimate staff roles, misleading financial “Net” numbers, and exception types that exist in the database but do nothing operationally.

| Severity | Count (approx.) |
|----------|-----------------|
| Critical | 8 |
| High | 14 |
| Medium | 18 |
| Low | 16 |

Highest-risk theme: **the create/preview/publish path and trip generator do not share the same time window or failure contract**, so operators can believe trips exist when they do not — or publish bookable trips with missing/wrong fares.

---

## 2. Scope Reviewed

| Area | Files / surfaces reviewed |
|------|---------------------------|
| Page route | `schedules/page.tsx` (prefetch + hydrate) |
| View + all co-located components | `operator-schedules-view.tsx` (~2100 lines, many components in one file) |
| tRPC | `schedules.ts` (list/get/create/delete/updateBasic/updateCalendar/updateFare/regenerateTrips/addException/removeException) |
| Zod | `packages/schemas/src/schedules.ts` |
| Trip generation | `trip-generator.ts`, `timezone.ts` |
| Related routers | `routes.ts` (list/get), `fleet.ts` (getBuses) |
| Prisma | Schedule domain + Route/Trip/Fare enums |
| IAM | `permissions.ts`, `useStaffPermissions`, sidebar gating |
| Product/docs | `context/project-overview.md`, `progress-tracker.md`, `ui-registry.md`, `build-plan.md`, `docs/payment_system_parts/12-pricing.md` |
| Downstream pricing | `search-service.ts` fare resolution |

**Not in scope:** visual redesign, spacing/typography/color critique (except where copy or controls misrepresent system behavior).

---

## 3. Critical Issues

### C1 — Preview window ≠ trip generation window (false “trips will be created” promise)

- **Severity:** Critical  
- **Category:** Business logic / incorrect information  
- **Location:** `getPreviewDates()` + `PreviewStep` vs `generateTripsForSchedule()`  
- **Explanation:** Preview walks forward from `validFrom` until it finds **14 matching weekdays** (up to 60 calendar days). The generator only materializes trips for **`today … today+daysCount-1`** (default 14 calendar days), then skips days outside calendar validity.  
- **Why it is wrong:** If `validFrom` is more than ~14 days ahead, Preview can show many pink dots while publish creates **0 trips**. Success banner then says “0 trips generated for the next 14 days,” contradicting the preview the operator just confirmed.  
- **Correct behavior:** Preview must use the same window and rules as `generateTripsForSchedule` (app timezone calendar days from today, weekday flags, validFrom/validUntil, CANCELLED exceptions).  
- **Suggested fix:** Extract shared “candidate departure dates” helper used by both UI preview and generator; preview labels should say “next 14 calendar days from today,” not “first 2 weeks from validFrom.”

### C2 — Trip pre-generation failure is swallowed on create

- **Severity:** Critical  
- **Category:** Business logic / error handling / rollback  
- **Location:** `schedulesRouter.create` (`try/catch` around `generateTripsForSchedule`, errors only `console.error`)  
- **Explanation:** Schedule + calendar + fares commit in a transaction; trip generation runs after and failures are ignored. UI still treats publish as success and shows `result._count.trips` (often 0).  
- **Why it is wrong:** Operator believes the schedule is live for booking; search finds nothing. No compensating UI error, no retry CTA, no orphan detection.  
- **Correct behavior:** Fail the mutation (or return an explicit partial-success status) when generation fails; surface actionable error; optionally keep schedule but require forced “Generate trips” with error state.  
- **Suggested fix:** Do not swallow; return `{ schedule, tripsCreated, generationError }`; toast hard failure; block “published” success panel unless tripsCreated > 0 or operator acknowledges deferral.

### C3 — CANCELLED exception deletes trips without booking safety

- **Severity:** Critical  
- **Category:** Business logic / concurrency / data integrity  
- **Location:** `schedulesRouter.addException` when `type === "CANCELLED"` → `trip.deleteMany` by date range  
- **Explanation:** Deletes all trips that day for the schedule with **no check** for bookings, holds, payments, or trip status.  
- **Why it is wrong:** Can destroy paid bookings’ operational parent rows (or orphan booking FKs depending on cascade rules), contradicting delete-schedule messaging and passenger trust.  
- **Correct behavior:** Cancel trips via status transition + refund/notification workflow when bookings exist; only hard-delete empty SCHEDULED trips; block or escalate if booked.  
- **Suggested fix:** Mirror `trips.cancel` semantics; count bookings/holds first; never `deleteMany` booked trips.

### C4 — Delete dialog promises different behavior than API

- **Severity:** Critical  
- **Category:** UI ↔ backend consistency / product honesty  
- **Location:** Delete `DialogDescription` in view vs `schedulesRouter.delete`  
- **Explanation:** UI says: remove schedule and cancel future trips **with no bookings**; past/booked unaffected. API: if **any** booking exists on **any** trip of the schedule, delete is refused entirely; otherwise **all** trips are deleted (including past).  
- **Why it is wrong:** Operators act on false safety guarantees; past trip history can vanish; partial-booked schedules cannot be retired gracefully (no deactivate-only path emphasized).  
- **Correct behavior:** Either soft-retire (`isActive=false` + cancel empty future trips) or implement the dialog’s selective cancel; never wipe historical trips with bookings elsewhere on the schedule without clarity.  
- **Suggested fix:** Align copy + API; prefer deactivate; if hard delete, only allow when zero trips exist or only unbooked future trips, and archive past trips.

### C5 — SUPPORT (and similar) staff crash the Schedules page

- **Severity:** Critical  
- **Category:** Security / permissions / loading  
- **Location:** `schedules/page.tsx` prefetches + view `useSuspenseQuery` on `schedules.list`, `routes.list`, `fleet.getBuses`  
- **Explanation:** Sidebar shows Schedules for `schedules:read`. SUPPORT template has `schedules:read` but **not** `routes:read` or `fleet:read`. Suspense queries for routes/fleet will throw FORBIDDEN and break the page for read-only staff.  
- **Why it is wrong:** IAM Model A is violated at the page boundary: granted nav ≠ loadable page.  
- **Correct behavior:** List view needs only `schedules:read`. Routes/buses load lazily inside create wizard, gated by `schedules:create` + respective read perms.  
- **Suggested fix:** Remove routes/fleet from page-level suspense/prefetch; fetch inside wizard; gate New/Edit/Delete with `useStaffPermissions().can(...)`.

### C6 — UI allows publish with zero fares; Zod requires ≥1 fare

- **Severity:** Critical  
- **Category:** Validation / business rules  
- **Location:** `canProceed()` Pricing step returns `true` always; `createScheduleSchema.fares.min(1)`; search fallback `5000` XOF  
- **Explanation:** Wizard treats pricing as optional. Submit hits Zod and fails, or if schema were loosened, search would invent **5000 XOF** (`search-service.ts`).  
- **Why it is wrong:** Broken happy path (“Continue” through Pricing with empty matrix → Publish error), or worse, silent wrong passenger prices.  
- **Correct behavior:** Require at least origin→destination FIXED fare (product minimum); block Continue on Pricing until required segments filled; never invent prices in search.  
- **Suggested fix:** Align UI + Zod (`min(1)` + refine full-route segment); remove 5000 fallback in search; show inline validation before Publish.

### C7 — Hardcoded “Net: price × 0.95” is financially false

- **Severity:** Critical  
- **Category:** Incorrect information / documentation drift  
- **Location:** `PricingStep` and edit fare matrix (`Math.round(fare.priceXOF * 0.95)`)  
- **Explanation:** Platform commission is **basis points** from `PlatformSettings` / **distance tiers** (`docs/payment_system_parts/12-pricing.md`). Default 500 bps is 5%, but tiers can differ; operator net is `Subtotal - Commission`, not a fixed 95%. Convenience fee is passenger-side and not shown.  
- **Why it is wrong:** Operators price tickets using a fabricated net. Mis-sets commercial expectations before launch.  
- **Correct behavior:** Show “Passenger pays (base fare)” and optionally “Estimated operator net using current commission rules” from PricingResolver / settings API — or hide net entirely.  
- **Suggested fix:** Remove `* 0.95`; if estimate needed, call a shared pricing estimate with distance + active tiers.

### C8 — EXTRA_SERVICE / MODIFIED exceptions are non-operational

- **Severity:** Critical (product claims “complete”)  
- **Category:** Missing flows / DB features not exposed correctly  
- **Location:** `addException` UI + API; `generateTripsForSchedule` only skips `CANCELLED`  
- **Explanation:** Progress tracker / ui-registry claim exception types including extra service. Creating `EXTRA_SERVICE` or `MODIFIED` only inserts a row. Generator does not create an extra trip; MODIFIED has no alternate time/bus fields.  
- **Why it is wrong:** Operators believe they scheduled holiday extras or time changes; nothing changes on the dispatch board.  
- **Correct behavior:** EXTRA_SERVICE → create trip on that date (even if weekday off); MODIFIED → store override departure time/bus and apply in generator; or hide types until implemented.  
- **Suggested fix:** Implement generator branches **or** remove options from UI until backend supports them.

---

## 4. High Priority Issues

### H1 — “Automatic daily rolling trip extensions” do not exist

- **Severity:** High  
- **Category:** Incorrect information / product completeness  
- **Location:** Edit drawer copy for `isActive` Switch; docs claim “14-day rolling”  
- **Explanation:** No cron/job calls `generateTripsForSchedule`. Rolling only happens on create or manual Extend. `isActive` is not checked by the generator at all.  
- **Why it is wrong:** Inactive schedules can still get trips via Extend; active schedules go dark after day 14 without manual action.  
- **Correct behavior:** Cron extends active schedules daily; generator must respect `isActive`; UI copy must match.  
- **Suggested fix:** Add scheduled job; gate generation on `schedule.isActive`; update Switch helper text.

### H2 — Extend assigns a random first ACTIVE bus, not the schedule’s bus

- **Severity:** High  
- **Category:** Business logic / fleet integrity  
- **Location:** `handleExtendTrips` → `buses.find(b => b.status === "ACTIVE")`  
- **Explanation:** Default bus is required at create but **not stored on `Schedule`** (by schema design: bus per Trip). Extend ignores which bus was used historically and picks fleet[0] ACTIVE.  
- **Why it is wrong:** Wrong capacity/layout/amenities on new trips; can assign a city bus to a long-haul schedule.  
- **Correct behavior:** Persist `preferredBusId` on Schedule **or** reuse most recent future trip’s busId; let operator pick bus on Extend.  
- **Suggested fix:** Add optional `Schedule.defaultBusId` or Extend dialog with bus picker defaulting to last trip bus.

### H3 — Edit drawer drops / cannot change default bus

- **Severity:** High  
- **Category:** Database ↔ UI / missing fields  
- **Location:** `handleEditClick` sets `defaultBusId: ""` always  
- **Explanation:** Calendar edit has no bus field; Extend is the only regeneration path and uses H2 logic.  
- **Correct behavior:** Show assigned preferred bus and allow update for future generation.  
- **Suggested fix:** Same as H2 persistence + edit UI.

### H4 — DRAFT / SUSPENDED routes can be scheduled

- **Severity:** High  
- **Category:** Business rules  
- **Location:** Wizard `RoutePickerStep` uses `routes.list` (excludes only ARCHIVED)  
- **Explanation:** Operators can publish schedules on DRAFT/SUSPENDED routes.  
- **Correct behavior:** Only ACTIVE routes (or warn + block publish for non-ACTIVE).  
- **Suggested fix:** Filter `status === "ACTIVE"` in picker; server-validate on create.

### H5 — No client permission gating on mutations

- **Severity:** High  
- **Category:** Security / UX  
- **Location:** Entire list + wizard; OPERATIONS has read-only schedules perms  
- **Explanation:** New / Edit / Delete / Extend / Exception / Fare save always visible; server enforces but UX is hostile and looks like bugs.  
- **Correct behavior:** Hide/disable actions via `can("schedules:create|update|delete")`.  
- **Suggested fix:** Wire `useStaffPermissions` like staff/sidebar pages.

### H6 — Fare matrix identity ignores seatClass + type (one row per segment)

- **Severity:** High  
- **Category:** Product / DB model mismatch  
- **Location:** `getFare(from,to)` keyed only by stop orders; Prisma `Fare` supports `seatClass` + `type` + validity windows  
- **Explanation:** Cannot price ECONOMY and VIP for the same segment; changing class overwrites the only row.  
- **Correct behavior:** Matrix keyed by (from, to, seatClass) or separate class tabs; allow multiple fare rows.  
- **Suggested fix:** Redesign fare draft key; add createFare API for missing combinations.

### H7 — Cannot add / remove fare segments after create

- **Severity:** High  
- **Category:** Missing workflows  
- **Location:** Edit drawer only `updateFare` on existing IDs; no addFare/deleteFare procedures  
- **Explanation:** Empty fare schedules (or incomplete matrices) cannot be repaired in edit UI.  
- **Correct behavior:** Add/remove fare rows; deactivate via `isActive`.  
- **Suggested fix:** New mutations + edit UI “Add segment.”

### H8 — Fare type/class selectors only work after a price exists

- **Severity:** High  
- **Category:** Broken flow  
- **Location:** PricingStep `<select>` handlers guarded by `if (fare)`  
- **Explanation:** Choosing Promo/VIP before entering price no-ops; defaults applied only when price set.  
- **Correct behavior:** Selecting type/class should create draft fare or enable independently.  
- **Suggested fix:** Upsert draft on any field change.

### H9 — Calendar can be saved with zero weekdays

- **Severity:** High  
- **Category:** Missing validation  
- **Location:** Zod `serviceCalendarSchema` / `updateCalendar`; create path  
- **Explanation:** No refine requiring ≥1 day true. Creates permanently empty generation.  
- **Correct behavior:** Reject all-false calendars.  
- **Suggested fix:** Zod `.refine` + UI disable Publish.

### H10 — `validUntil` ignored in preview calendar

- **Severity:** High  
- **Category:** Incorrect information  
- **Location:** `PreviewStep` / `getPreviewDates`  
- **Explanation:** End date never applied; preview overstates trips.  
- **Suggested fix:** Pass `validUntil` into preview helper.

### H11 — Exception CANCELLED vs booked trips (related to C3)

- **Severity:** High  
- **Category:** Workflow  
- **Location:** Exception UI offers CANCELLED freely  
- **Explanation:** No warning about existing bookings/holds before add.  
- **Suggested fix:** Preflight query trip booking counts for date; confirm dialog.

### H12 — Delete blocks entire schedule if any historical booking exists

- **Severity:** High  
- **Category:** Product completeness  
- **Location:** `delete` booking count on all trips  
- **Explanation:** Operators cannot remove obsolete templates after years of history.  
- **Correct behavior:** Soft-delete / archive schedule; keep trips.  
- **Suggested fix:** Prefer `isActive=false` + `archivedAt`; hard delete only empty schedules.

### H13 — Update calendar/basic does not regenerate or cancel obsolete future trips

- **Severity:** High  
- **Category:** Stale implementations  
- **Location:** `updateBasic` / `updateCalendar`; banner says future trips unaffected  
- **Explanation:** Changing Mon–Fri → Tue-only leaves Monday trips still bookable.  
- **Correct behavior:** Offer “Apply to future empty trips” regeneration/cleanup job.  
- **Suggested fix:** After calendar update, optionally delete unbooked future trips that no longer match and regenerate window.

### H14 — Search 5000 XOF fallback when fares missing

- **Severity:** High  
- **Category:** Downstream of schedules  
- **Location:** `search-service.ts`  
- **Explanation:** Makes incomplete schedule pricing silently “work” with wrong price.  
- **Suggested fix:** Exclude trips without matching active segment fare from search.

---

## 5. Medium Priority Issues

### M1 — Overfetch: list includes all fares for every schedule

- **Severity:** Medium  
- **Category:** Performance  
- **Location:** `schedules.list` include `fares`  
- **Explanation:** List cards only need route, calendar days, departureTime, isActive, trip count.  
- **Suggested fix:** Drop fares from list; fetch on get/edit.

### M2 — No pagination / filtering / search / sorting on list

- **Severity:** Medium  
- **Category:** Product / scalability  
- **Location:** List mode toolbar  
- **Explanation:** Only sorts by `departureTime asc` server-side. Large operators (many routes × times) get an unbounded card grid.  
- **Suggested fix:** Server pagination + filters (route, active, time) + search by name/route; nuqs for state.

### M3 — nuqs partial: wizard URL state incomplete / fragile

- **Severity:** Medium  
- **Category:** URL state  
- **Location:** `new`, `step`, `routeId` in URL; calendar/fares/name in React state only  
- **Explanation:** Refresh mid-wizard loses calendar/fares; `routeId` can reopen without fares; `maxStep` not persisted so step deep-links may be blocked. `resetWizard` sets `null` inconsistently.  
- **Suggested fix:** Persist essential wizard fields or reset all query keys on cancel; don’t deep-link Pricing without route detail.

### M4 — Edit drawer not in URL (non-shareable)

- **Severity:** Medium  
- **Category:** nuqs  
- **Location:** `editDrawerOpen` local state  
- **Explanation:** Cannot link to `?edit=<scheduleId>`.  
- **Suggested fix:** `parseAsString` edit id; open drawer from URL.

### M5 — Dirty-check on drawer close is incomplete

- **Severity:** Medium  
- **Category:** Workflow  
- **Location:** `onOpenChange` compares only name + departureTime  
- **Explanation:** Calendar/active/exception/fare edits discarded without warn.  
- **Suggested fix:** Broader dirty detection or formal form state.

### M6 — Fare edit uses `defaultValue` + blur debounce (stale UI)

- **Severity:** Medium  
- **Category:** UI ↔ backend  
- **Location:** `handleFarePriceChange`  
- **Explanation:** Uncontrolled inputs; parent `editFares` updates don’t re-sync; savingFareIds unused in UI; race if blur fires rapid changes.  
- **Suggested fix:** Controlled inputs; show saving indicator; invalidate `schedules.get` too.

### M7 — Fare `isActive`, `validFrom`, `validUntil` never exposed

- **Severity:** Medium  
- **Category:** DB features not exposed  
- **Location:** Prisma `Fare`; `updateFareSchema` allows `isActive`/`type` but UI only price  
- **Suggested fix:** Expose activate toggle + validity; edit type in drawer.

### M8 — Schedule `createdAt` / `updatedAt` never shown

- **Severity:** Medium  
- **Category:** Metadata  
- **Suggested fix:** Show in card footer or edit header for support/audit.

### M9 — Exceptions list formatting uses `toISOString().slice` (UTC)

- **Severity:** Medium  
- **Category:** Date formatting  
- **Location:** Exception list render  
- **Explanation:** With non-UTC clients could shift calendar day (CI is UTC+0 today, still fragile). Prefer app timezone helpers.  
- **Suggested fix:** Use `getCalendarDateKey` / shared formatter.

### M10 — Edit departure time is free-text, create uses `<input type="time">`

- **Severity:** Medium  
- **Category:** Validation UX  
- **Location:** Edit drawer vs CalendarStep  
- **Explanation:** Easy to enter invalid strings; Zod rejects only on save.  
- **Suggested fix:** Same time input control.

### M11 — `formatDate` helper unused; `formatTime` assumes well-formed HH:mm`

- **Severity:** Medium  
- **Category:** Edge cases  
- **Suggested fix:** Guard parse; remove dead code.

### M12 — Type/class selects are raw `<select>` without labels association

- **Severity:** Medium  
- **Category:** Accessibility  
- **Suggested fix:** Proper Label htmlFor / aria-label per row.

### M13 — Hover-only action buttons (Extend/Edit/Delete)

- **Severity:** Medium  
- **Category:** Accessibility / mobile  
- **Location:** `ScheduleCard` `opacity-0 group-hover`  
- **Explanation:** Touch devices / keyboard users struggle; actions hidden.  
- **Suggested fix:** Always visible on touch; focus-within opacity.

### M14 — Wizard step buttons not typed as `type="button"` in forms contexts

- **Severity:** Medium  
- **Category:** A11y / HTML  
- **Note:** Day toggles in edit form correctly use `type="button"`; create wizard day buttons lack it (ok outside form). Monitor if wrapped later.

### M15 — `recurrenceTypeEnum` in Zod unused; Prisma `RecurrenceType` unused by Schedule

- **Severity:** Medium  
- **Category:** Schema drift  
- **Location:** `packages/schemas/src/schedules.ts`, Prisma enum  
- **Explanation:** Dead abstraction vs boolean weekday calendar.  
- **Suggested fix:** Remove or implement presets (Daily/Weekdays) that map to booleans.

### M16 — No unique constraint on Fare segment identity

- **Severity:** Medium  
- **Category:** Database architecture  
- **Location:** Prisma `Fare`  
- **Explanation:** Duplicate (scheduleId, from, to, seatClass, type) possible via repeated creates.  
- **Suggested fix:** `@@unique([scheduleId, fromStopOrder, toStopOrder, seatClass, type])` or similar.

### M17 — `routeSnapshotJson: JSON.stringify(...)` into `Json` column

- **Severity:** Medium  
- **Category:** Data quality  
- **Location:** `trip-generator.ts`  
- **Explanation:** May double-encode depending on Prisma Json handling; complicates reads.  
- **Suggested fix:** Pass plain object.

### M18 — Waypoint terminal names missing on `schedules.get` route include

- **Severity:** Medium  
- **Category:** Underfetch for future UI  
- **Location:** `schedules.get` waypoints without `terminal` include  
- **Explanation:** Edit fare UI shows “Stop {n}” only — already poor; cannot improve without terminals.  
- **Suggested fix:** Include terminal+city on get; map stop orders to names in edit matrix.

---

## 6. Low Priority Issues

### L1 — Monolithic view file (~2100 lines, many components)

- **Severity:** Low (maintainability)  
- **Category:** Code organization  
- **Explanation:** Violates “one primary component per file” / staff-page composition pattern already used elsewhere.  
- **Suggested fix:** Split to `features/operator/components/schedules/*` + `lib/*`.

### L2 — Business logic embedded in view (stop building, preview dates, net calc)

- **Severity:** Low  
- **Category:** Code organization  
- **Suggested fix:** Move to `features/operator/lib/schedules/`.

### L3 — Manual `as any` casts on schedule detail

- **Severity:** Low  
- **Category:** Types  
- **Location:** `handleEditClick`  
- **Suggested fix:** Use `RouterOutputs["schedules"]["get"]`.

### L4 — Duplicate invalidation patterns (`pathFilter` vs `queryFilter`)

- **Severity:** Low  
- **Category:** TanStack Query  
- **Suggested fix:** Standardize on `pathFilter` for list + get keys.

### L5 — No optimistic updates

- **Severity:** Low  
- **Category:** Query UX  
- **Suggested fix:** Optional for isActive toggle / fare price.

### L6 — No `staleTime` tuning

- **Severity:** Low  
- **Category:** Performance  
- **Suggested fix:** Schedules change infrequently; set staleTime (e.g. 30s–60s).

### L7 — Success panel not persisted / not tied to schedule id

- **Severity:** Low  
- **Category:** UX state  
- **Suggested fix:** Toast + link only, or `?published=<id>`.

### L8 — AM/PM time display vs CI 24h operator norms

- **Severity:** Low  
- **Category:** Terminology  
- **Suggested fix:** Prefer 24h for operators (product decision).

### L9 — “Pink dot” copy assumes brand color

- **Severity:** Low  
- **Category:** Copy  
- **Suggested fix:** “Each marker represents…”

### L10 — Empty routes CTA uses ArrowRight as empty icon (odd semantics)

- **Severity:** Low  
- **Category:** Product polish (non-visual exception: affordance clarity)  
- **Suggested fix:** Use route/map icon if design system allows without redesigning layout.

### L11 — No bulk actions (activate/deactivate many, extend many)

- **Severity:** Low  
- **Category:** Missing features  
- **Suggested fix:** Post-MVP bulk toolbar.

### L12 — No export of schedule/fare matrix

- **Severity:** Low  
- **Category:** Missing features  

### L13 — No drill-down from card trip count to filtered trips board

- **Severity:** Low  
- **Category:** Navigation  
- **Suggested fix:** Link `trips?scheduleId=`.

### L14 — Keyboard: day chips not in radiogroup / toggle group pattern

- **Severity:** Low  
- **Category:** Accessibility  

### L15 — `Spinner` on publish only; no page-level error boundary messaging for query failures

- **Severity:** Low  
- **Category:** Error handling  

### L16 — Documentation: build-plan still shows Sprint 2.5 schedule tasks as pending while progress-tracker marks complete

- **Severity:** Low  
- **Category:** Documentation consistency  
- **Suggested fix:** Reconcile build-plan checkboxes.

---

## 7. Missing Features

| Feature | Why expected | Notes |
|---------|--------------|-------|
| Preferred / default bus persistence | Create requires bus; model comment says per-trip only | Need preferredBusId or equivalent |
| Rolling generation cron | Product + UI claim automatic extension | Missing entirely |
| EXTRA_SERVICE trip creation | Enum + UI | Stub only |
| MODIFIED overrides (time/bus) | Enum + UI | Stub only |
| Add/delete fares post-create | Incomplete matrices | Missing APIs |
| Multi seat-class pricing | Schema supports VIP/STANDARD/ECONOMY | UI one class/segment |
| Fare validity windows | Prisma fields | Not in UI |
| Fare deactivate | `isActive` | Not in UI |
| List filters (route, active, time) | Operator scale | Missing |
| Search schedules | By name/route/city | Missing |
| Sort controls | Only fixed departureTime | Missing |
| Pagination | Unbounded list | Missing |
| Permission-aware actions | IAM shipped | Missing on this page |
| Archive/retire workflow | vs hard delete | Missing |
| Apply calendar changes to future trips | Banner admits gap | Missing tool |
| Stop names in edit fare matrix | Create has names | Edit shows Stop N |
| Booking impact warnings | Exceptions/delete | Missing |
| Analytics (occupancy by schedule) | Project overview “business analytics” | Not on this page |
| Duplicate schedule | Common ops need | Missing |
| Clone fares from another schedule | Speed setup | Missing |

---

## 8. Database ↔ UI Inconsistencies

| DB field / concept | UI behavior | Verdict |
|--------------------|-------------|---------|
| `Schedule.name` | Optional create/edit | OK |
| `Schedule.departureTime` | Create+edit | OK (edit input weaker) |
| `Schedule.isActive` | Badge + switch | OK visually; **not enforced in generator** |
| `Schedule.createdAt/updatedAt` | Hidden | Gap |
| No `defaultBusId` on Schedule | Create requires bus; edit/extend invent bus | **Architectural mismatch** |
| `ServiceCalendar` weekdays + validity | Create+edit | OK; preview ignores until |
| `ServiceException` types | All shown | **EXTRA_SERVICE/MODIFIED inert** |
| `Fare.type/seatClass/price/validity/isActive` | Create partial; edit mostly price | **Major under-exposure** |
| `Fare` uniqueness | None | Risk |
| `Route.status` | Ignored in picker | Gap |
| `RouteWaypoint.stopOrder` semantics | UI remaps intermediates to `idx+1` | OK if routes always use 1..n (routes view does); fragile if data diverges |
| `Trip` statuses / gate / delay | Not on schedules page | OK (dispatch board) |
| `RecurrenceType` enum | Unused | Dead schema |
| Platform commission settings | Hardcoded 5% net | **Wrong** |

---

## 9. Backend ↔ UI Inconsistencies

| Procedure | UI usage | Issue |
|-----------|----------|-------|
| `list` | Suspense list | Overfetches fares; no filters |
| `get` | Edit open | Casts; missing terminal names on waypoints |
| `create` | Publish | Swallows generation errors; Zod/UI fare rule mismatch |
| `delete` | Confirm dialog | Copy ≠ behavior |
| `updateBasic` | Save | OK |
| `updateCalendar` | Save | No trip reconciliation |
| `updateFare` | Blur save | No type/class/isActive UI; schema allows them |
| `regenerateTrips` | Extend | Wrong bus selection; ignores isActive |
| `addException` | Edit form | Dangerous cancel delete; stub types |
| `removeException` | Remove button | Does **not** regenerate cancelled day’s trips |
| `routes.list` / `fleet.getBuses` | Always loaded | Permission crash for SUPPORT |

**Invalidations:** create/delete/regenerate/list-path mostly OK; updateBasic/calendar success invalidates list but edit local state may be stale if reopened without fetch; fare update invalidates list (heavy) not get.

---

## 10. Product Gaps

Relative to `context/project-overview.md` (“Schedule Management”, “Ticket & Pricing Management”):

1. Promotions / holiday surge / early bird are selectable but have **no date rules, inventory rules, or stacking policy** in UI or generator.  
2. VIP vs Economy pricing incomplete.  
3. No operator insight on upcoming generated coverage (“trips remaining in window”).  
4. No path from schedule → bookings/revenue for that template.  
5. Service exceptions incomplete vs “holidays, cancel, extra service” tracker claims.

---

## 11. Workflow Issues

```
Create happy path:
  Route → Calendar → Pricing (optional in UI) → Preview (wrong window) → Publish
    → DB schedule OK
    → trips maybe 0 (future validFrom / generation error / no days)
    → Success panel may lie or show 0

Edit path:
  Load get → edit calendar/time/active → Save
    → future trips unchanged (warned)
    → weekday removals leave orphan trips

Exception CANCELLED:
  Add → trips hard-deleted → bookings risk

Exception EXTRA/MODIFIED:
  Add → DB row only → no operational effect

Extend:
  Click → first ACTIVE bus → +14 days from today
    → may conflict with preferred capacity
```

**Impossible / inconsistent states:**

- Active schedule, 0 future trips (no cron).  
- Inactive schedule, Extend still works.  
- Fares empty but trips exist → search fallback price.  
- Preview dots outside generation window.

---

## 12. Performance Issues

1. List overfetch of all fares.  
2. Triple suspense dependency (schedules+routes+buses) blocks first paint for list-only use.  
3. Unvirtualized card grid.  
4. Fare save invalidates entire list.  
5. Route detail fetched on every `routeId` change without caching reuse beyond React Query defaults.  
6. N+1 risk inside generator (`findFirst` existing trip per day) — OK for 14 days, poor if window grows.  
7. `JSON.stringify` snapshot cost minor.

---

## 13. Query & Prefetch Audit

| Query | Prefetched? | Needed on list? | Notes |
|-------|-------------|-----------------|-------|
| `schedules.list` | Yes | Yes | Trim include |
| `routes.list` | Yes | No (wizard only) | Permission hazard |
| `fleet.getBuses` | Yes | No (wizard/extend) | Permission hazard |
| `routes.get` | No | On route select | OK; could prefetch on hover |
| `schedules.get` | No | On edit | OK; could prefetch on card hover |
| Next page trips | Link only | — | Could prefetch on success CTA |

**Missing prefetch opportunities:** hover prefetch `schedules.get`; wizard open prefetch buses/routes only when `can(create)`.

---

## 14. nuqs Audit

**Currently used:** `new` (boolean), `step` (enum), `routeId` (string).

| State | In URL? | Should be? | Why |
|-------|---------|------------|-----|
| Wizard open | Yes | Yes | Share/create deep link |
| Wizard step | Yes | Partial | Only with validated prerequisites |
| Selected route | Yes | Yes | Resume wizard |
| Calendar config | No | Optional | Long; sessionStorage alternative |
| Fares draft | No | Optional | Large |
| List filters/search/page | No | **Yes when added** | Shareable ops views |
| Edit drawer schedule id | No | **Yes** | Support deep links |
| Delete confirm | No | No | Ephemeral |
| Success banner | No | Optional | `published` id |

**Gap:** Filters/pagination/edit id absent; wizard incomplete persistence causes confusing reloads.

---

## 15. Zod Audit

| Schema | Status | Issue |
|--------|--------|-------|
| `createScheduleSchema` | Used | `fares.min(1)` conflicts with UI; no “≥1 weekday” refine; no ACTIVE route check |
| `serviceCalendarSchema` | Used | No day-required refine; `validUntil >= validFrom` not enforced |
| `updateScheduleBasicSchema` | Used | OK |
| `updateCalendarSchema` | Used | Same gaps |
| `updateFareSchema` | Used | UI doesn’t send type/isActive |
| `exceptionSchema` | Defined | Router inlines duplicate enum schema instead of reusing |
| `recurrenceTypeEnum` | Dead | Remove or use |
| Client-side Zod | Missing | Manual `parseInt`, ad-hoc checks in view |

**Recommendation:** Keep shared schemas in `packages/schemas`; add feature helpers under `features/operator/lib/schedules/validations.ts` for wizard step schemas composing package schemas — avoid duplicating enums in the router.

---

## 16. TanStack Query Audit

| Pattern | Assessment |
|---------|------------|
| `useSuspenseQuery` ×3 | Causes waterfall permission coupling; split |
| Mutations | Present for all write paths |
| Invalidation | Inconsistent completeness (get vs list) |
| Optimistic | None |
| `placeholderData` | None |
| Parallelism | Page prefetch Promise.all good |
| Duplicate fetch | Edit always `fetchQuery` get — fine |
| Error boundaries | Rely on default suspense error — poor staff UX |

---

## 17. Security Issues

1. **SUPPORT page break** via forced `routes:read` / `fleet:read` (C5).  
2. **Client shows unauthorized actions** — server blocks, but leaks capability surface and confuses audits.  
3. **Exception cancel delete** can destroy booked inventory (C3) — integrity/security of passenger funds adjacent.  
4. **Company scoping** on procedures generally correct (`companyId` checks).  
5. **removeException** checks company via join — OK.  
6. **No IDOR on fare** beyond schedule ownership — OK.  
7. **Trust:** default bus id accepted only if ACTIVE + company — OK on create/regenerate.  
8. **Sensitive data:** none exposed unusually on this page.

---

## 18. Accessibility Issues

1. Card actions hidden until hover.  
2. Raw selects without per-control labels in fare rows.  
3. Preview grid has good `role="grid"` — positive.  
4. Day toggles are buttons without `aria-pressed`.  
5. Delete icon button missing accessible name (“Delete schedule”).  
6. Drawer dirty confirm uses `window.confirm` — not focus-trapped gracefully.  
7. Time picker has sr-only text — good.  
8. Exception/status text uses raw enums (`CANCELLED`) — screen reader harsh; humanize.

---

## 19. Scalability Concerns

1. Unpaginated schedule list + full fare payloads.  
2. Trip generation loop with per-day existence query — needs batch/set when window grows (30–90 days).  
3. Manual Extend does not scale to many schedules (need cron + per-company job).  
4. Monolithic UI file slows safe iteration.  
5. Missing fare uniqueness invites duplicate pricing bugs under concurrent editors.  
6. Hard delete model fights long-lived marketplace data retention.

---

## 20. Recommended Fixes

### P0 (before any broad operator rollout)

1. Unify preview date logic with `generateTripsForSchedule`.  
2. Stop swallowing trip generation errors on create.  
3. Fix CANCELLED exception to never hard-delete booked trips.  
4. Align delete API + dialog (prefer soft deactivate).  
5. Decouple page load from `routes.list` / `fleet.getBuses`; fix SUPPORT.  
6. Require real fares in UI; remove search 5000 fallback.  
7. Remove or correctly compute Net (no `* 0.95`).  
8. Hide or implement EXTRA_SERVICE / MODIFIED.

### P1

1. Persist preferred bus; Extend/edit bus picker.  
2. Cron for rolling generation; honor `isActive`.  
3. Client permission gating.  
4. ACTIVE-only routes for scheduling.  
5. Calendar ≥1 day validation.  
6. Fare add/remove + multi seat class.  
7. Apply calendar changes to future empty trips.  
8. Stop names in edit fare matrix.

### P2

1. List filters/search/pagination + nuqs.  
2. Split components/lib.  
3. Trim list payload; tune query invalidation.  
4. Expose fare validity/isActive.  
5. Documentation reconciliation (build-plan vs progress-tracker).  
6. Unique fare constraint migration.

---

## 21. Final Checklist

| Check | Status |
|-------|--------|
| Create wizard matches generator rules | ❌ Fail (window mismatch) |
| Publish failure modes honest | ❌ Fail (swallowed errors) |
| Fares required & reflected in search | ❌ Fail |
| Financial copy accurate | ❌ Fail (`×0.95`) |
| Exceptions fully operational | ❌ Fail (2/3 types stub; cancel unsafe) |
| Delete semantics honest | ❌ Fail |
| IAM-safe page load | ❌ Fail (SUPPORT) |
| Action permission UX | ❌ Fail |
| Bus assignment deterministic | ❌ Fail (Extend) |
| Rolling trips automatic | ❌ Fail (copy only) |
| Calendar validation complete | ⚠️ Partial |
| Edit fare UX complete | ⚠️ Partial (price only) |
| Company scoping on APIs | ✅ Pass |
| Prefetch for list core data | ⚠️ Pass with over-prefetch |
| nuqs for wizard entry | ⚠️ Partial |
| Accessibility of primary flows | ⚠️ Partial |
| Code organization matches staff IAM pattern | ❌ Fail (monolith) |
| Docs match implementation | ❌ Drift |

**Release verdict:** **Do not ship** the schedules page to production-scale traffic until P0 items are resolved. Core CRUD scaffolding is real, but several paths produce silent empty inventory, incorrect commercial numbers, or destructive exception behavior.

---

## Appendix A — File Map

```
apps/web/app/dashboard/operator/(dashboard)/schedules/page.tsx
apps/web/features/operator/views/operator-schedules-view.tsx
apps/web/trpc/routers/schedules.ts
apps/web/lib/trip-generator.ts
apps/web/lib/timezone.ts
packages/schemas/src/schedules.ts
packages/schemas/src/permissions.ts
packages/db/prisma/schema.prisma  (Schedule domain)
apps/web/features/search/services/search-service.ts  (fare fallback)
```

## Appendix B — Enum Coverage Matrix

| Enum | In DB | In Zod | In Create UI | In Edit UI | Enforced in generator |
|------|-------|--------|--------------|------------|------------------------|
| Weekday booleans | ✅ | ✅ | ✅ | ✅ | ✅ |
| ExceptionType.CANCELLED | ✅ | ✅ | ✅ | ✅ | ✅ (skip) + hard delete |
| ExceptionType.EXTRA_SERVICE | ✅ | ✅ | ✅ | ✅ | ❌ |
| ExceptionType.MODIFIED | ✅ | ✅ | ✅ | ✅ | ❌ |
| ExceptionReason.* | ✅ | ✅ | ✅ | ✅ | N/A (metadata) |
| FareType.* | ✅ | ✅ | ✅ | ❌ (not editable) | N/A |
| SeatClass.* | ✅ | ✅ | ✅ (single) | ❌ | N/A |
| RecurrenceType.* | ✅ | ✅ | ❌ | ❌ | ❌ unused |
| RouteStatus | ✅ | ✅ | ❌ ignored | — | ❌ |
| Schedule.isActive | ✅ | ✅ | default true | ✅ switch | ❌ ignored |

---

*End of audit.*
