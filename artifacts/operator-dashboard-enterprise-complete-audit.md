# Moja Ride Operator Dashboard — Enterprise-Complete Audit

**Date:** 2026-07-19  
**Scope:** Every operator page, feature surface, and operator-facing tRPC router  
**Bar requested:** Enterprise-complete · great UI · perfect query architecture · perfect composition · perfect time · every domain perfect  
**Constraint:** Audit only (no code changes in this pass)  
**Related prior work:** `artifacts/operator-dashboard-complete-engineering-audit.md` (money/inventory P0s) + remediation tracker (Phases 0–8)

---

## 1. Executive Verdict

**The operator dashboard is NOT enterprise-complete against the bar you set.**

| Dimension | Score vs “perfect” | One-line truth |
|-----------|--------------------|----------------|
| Money / inventory correctness (post-remediation) | Strong | Critical money bugs from the prior audit are largely fixed; still needs migration apply + QA + docs sync |
| Domain coverage (terminals→…→staff) | Good / uneven | Core workflows exist; depth and polish vary wildly by page |
| Query architecture (prefetch / suspense / mutation) | Mixed | Layout + some pages are solid; schedules prefetch mismatch; revenue still full-table; several monoliths mix patterns |
| Composition (`views/` / `components/` / `lib/`, 1 file = 1 component) | Fail on largest pages | Settings 1804 LOC, Routes 1475, Fleet 1170, Terminals 1076 — multi-component monoliths in single files |
| Time (Africa/Abidjan) | Fail “perfect” | Trips/search helpers are correct; Overview/Withdraw/Revenue currency charts still use `fr-CI` / browser-local clocks |
| Great UI | Not measured as redesign | Functional English UI exists; not a systematic UX/enterprise design system audit; clutter and mega-drawers remain |
| Staff IAM across routers | Strong with gaps | Most procedures gated; onboarding/shell/log procs lack fine-grained keys; bank reveal is OWNER-only but no step-up OTP |
| Docs fidelity (`payment_system_parts`) | Fail | Escrow parts still document direct balance mutation without ledger journal |

**Ship recommendation:** Treat as **staging-ready after migrations + QA**, not as marketplace-scale “enterprise-complete.” Do not claim perfect UI / query / composition / time until the Critical + High composition and time findings below are closed.

---

## 2. Surface Inventory (nothing skipped)

### 2.1 App routes

| Route | Page shell | Primary view | Prefetch |
|-------|------------|--------------|----------|
| `/dashboard/operator` | `(dashboard)/page.tsx` | `operator-dashboard-view.tsx` | `getOnboardingStatus`, `getDashboardMetrics` |
| `/dashboard/operator/trips` | `trips/page.tsx` | `operator-trips-view.tsx` | `trips.list` (omit debounced `q`) |
| `/dashboard/operator/bookings` | `bookings/page.tsx` | `operator-bookings-view.tsx` | `listBookings` |
| `/dashboard/operator/terminals` | `terminals/page.tsx` | `operator-terminals-view.tsx` | `terminals.list`, `routes.getCities` |
| `/dashboard/operator/routes` | `routes/page.tsx` | `operator-routes-view.tsx` | `routes.list`, `terminals.list(bookableOnly)` |
| `/dashboard/operator/schedules` | `schedules/page.tsx` | `operator-schedules-view.tsx` | `schedules.list({})` only — **does not match client filters** |
| `/dashboard/operator/fleet` | `fleet/page.tsx` | `operator-fleet-view.tsx` | **None** (IAM-safe by design) |
| `/dashboard/operator/revenue` | `revenue/page.tsx` | `operator-revenue-view.tsx` | analytics + snapshot (+ ledger if tab) |
| `/dashboard/operator/withdraw` | `withdraw/page.tsx` | `operator-withdraw-view.tsx` | snapshot + withdrawals list |
| `/dashboard/operator/staff` | `staff/page.tsx` | `operator-staff-view.tsx` | listStaff, invitations, activity, getMyRole |
| `/dashboard/operator/settings` | `settings/page.tsx` | `operator-settings-view.tsx` | `getSettings` |
| `/dashboard/operator/onboarding` | `onboarding/page.tsx` | `operator-onboarding-view.tsx` | cities (+ step data via client) |
| `/dashboard/operator/welcome` | `welcome/page.tsx` | inline welcome UI | hydrate only |
| Layout | `(dashboard)/layout.tsx` | sidebar + header | `getShellContext`, `getMyPermissions` |

Sidebar covers all dashboard pages (Overview, Trips, Bookings, Terminals, Routes, Schedules, Fleet, Revenue, Withdraw, Staff, Settings). Onboarding/welcome are outside sidebar (correct). Command palette (`operator-search-dialog.tsx`) lists the same destinations but is **static nav search only** — not entity search (MF).

### 2.2 Operator-facing routers

| Router | Role |
|--------|------|
| `fleet.ts` | Buses, layouts, seats |
| `routes.ts` | Routes, cities |
| `terminals.ts` | Locations / terminals |
| `schedules.ts` | Schedules, fares, exceptions, reconcile |
| `trips.ts` | Dispatch lifecycle |
| `staff.ts` | IAM, invites, ownership |
| `operator.ts` | Shell, settings, bank, bookings, revenue, withdraw, onboarding, metrics |
| `booking.ts` / `search.ts` | Passenger purchase path intersecting operator inventory |
| `invitation.ts` | Staff invite accept (operator-adjacent) |

### 2.3 Composition LOC hotspots (evidence)

| Lines | File | Verdict |
|------:|------|---------|
| 1804 | `views/operator-settings-view.tsx` | **Critical monolith** — entire settings product in one file |
| 1475 | `views/operator-routes-view.tsx` | **Critical monolith** — cards, DnD form, dialogs, map, delete all co-located |
| 1170 | `views/operator-fleet-view.tsx` | **Critical monolith** — multiple panels + cards defined in-file |
| 1076 | `views/operator-terminals-view.tsx` | **Critical monolith** |
| 871 | `components/layout-builder-sheet.tsx` | High — should be multi-step components |
| 735 | `components/schedules/schedule-edit-drawer.tsx` | High |
| 629 | `components/trips/manifest-drawer.tsx` | High |
| 554 | `components/add-bus-modal.tsx` | Medium–High |
| 493 | `views/operator-schedules-view.tsx` | Borderline (orchestration OK if drawers stay extracted) |
| 470 | `views/operator-dashboard-view.tsx` | Medium |
| ≤373 | staff / trips / bookings / revenue pieces | Closer to target |

**Domains with proper `lib/*-search-params.ts`:** bookings, trips, schedules, staff, revenue.  
**Missing dedicated nuqs/validation libs:** fleet, routes, terminals (ad-hoc `useQueryState` in views), settings (tab enum only), withdraw (`withdrawPage` only), overview.

---

## 3. Cross-Cutting Findings

### 3.1 Query architecture — not perfect

**What works**
- Layout prefetches shell + permissions (sidebar Suspense-friendly).
- Bookings: page prefetch + `useSuspenseQuery` in `BookingsList` + Suspense boundary in view.
- Revenue page: parses nuqs cache, prefetches analytics/snapshot/ledger.
- Fleet: deliberately **no** RSC prefetch → avoids SUPPORT `FORBIDDEN` crash (correct IAM-aware pattern).
- Trips: omits debounced `q` from server prefetch (avoids hydration flicker).

**Failures / High issues**

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| Q1 | **High** | Schedules page always prefetches `schedules.list({})` while client applies `q` / `routeId` / `isActive` / pagination via nuqs → wasted fetch + possible flash of wrong first page | `schedules/page.tsx` vs `operator-schedules-view.tsx` `useQueryStates` |
| Q2 | **High** | `getRevenueAnalytics` loads **all** confirmed bookings in range with deep includes, aggregates in JS — will not scale | `operator.ts` ~1416–1439 |
| Q3 | **Medium** | Settings mixes `useSuspenseQuery(getSettings)` with separate `useQuery(listBankAccounts)` without page prefetch of banks → waterfall / double round-trip | `operator-settings-view.tsx` ~71–77; settings page only prefetches `getSettings` |
| Q4 | **Medium** | Routes/terminals prefetch lists but mega-views still fetch details/cities/maps on interaction with inconsistent Suspense boundaries | routes/terminals pages + views |
| Q5 | **Medium** | Overview dashboard metrics + departures: time formatting not Abidjan; occupancy links dump to `/trips` without trip id | `operator-dashboard-view.tsx` ~252–312 |
| Q6 | **Low** | Command palette does not use tRPC at all; cannot find a booking/trip/staff by query | `operator-search-dialog.tsx` |
| Q7 | **Low** | CSV exports use `fetchQuery` from click handlers (OK) but bookings export capped by Zod list `limit` max 100 | schema + export wiring |

**Pattern scorecard**

| Pattern | Adopted where | Missing where |
|---------|---------------|---------------|
| RSC `prefetch` + `HydrateClient` | layout, overview, trips, bookings, revenue, withdraw, staff, routes, terminals, settings | fleet (intentional); schedules wrong input |
| `useSuspenseQuery` for primary list | bookings list, revenue, trips (partial), staff (partial) | fleet/terminals/routes often hybrid |
| `useMutation` + invalidate | generally present | inconsistent pathFilter vs broad invalidate |
| Permission-gated prefetch | fleet none; dashboard metrics uses `requireAnyPermission` | schedules/routes/terminals will 403 SUPPORT on RSC if they lack read keys |

### 3.2 Composition — not perfect

| ID | Severity | Finding |
|----|----------|---------|
| C1 | **Critical** | Settings / Routes / Fleet / Terminals violate “one component per file” and thin-view rules |
| C2 | **High** | Routes view defines `RouteCard`, `SortableWaypoint`, `RouteFormDrawer`, `DeleteRouteDialog`, `SuccessPanel` in the same file (~161–1411) |
| C3 | **High** | Fleet view defines `StatCard`, `BusCard`, layout cards, `LayoutsPanel`, `SeatMapFetcher` in-file |
| C4 | **Medium** | Schedules/Trips/Staff are the **reference** architecture (split components + lib parsers) — not yet applied to older domains |
| C5 | **Medium** | No shared operator design primitives for list toolbars / empty states / filter chips (copy-paste across pages) |

### 3.3 Time — not perfect

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| T1 | **High** | Overview “Today’s Dispatch” uses `toLocaleTimeString("fr-CI")` **without** `timeZone: Africa/Abidjan` → operator may see wrong hour | `operator-dashboard-view.tsx` ~252–256 |
| T2 | **High** | Withdraw history uses `toLocaleDateString("en-US")` without Abidjan TZ | `operator-withdraw-view.tsx` ~302 |
| T3 | **Medium** | Currency helpers / charts use `fr-CI` / `fr-FR` NumberFormat — amounts OK, but conflicts with “English UI” + inconsistent with `en-US` trip formatters | `lib/currency.ts`, revenue chart, withdraw cards |
| T4 | **Medium** | Schedule preview uses `toLocaleDateString(undefined, …)` → **browser locale** | `preview-step.tsx` ~126 |
| T5 | **Low** | Staff invite expiry labels use en-US without explicit Abidjan (usually fine for date-only) | `lib/staff.ts` |
| T6 | **OK** | Trips format helpers correctly pin `APP_TIMEZONE` | `lib/trips/format.ts` |
| T7 | **OK** | Public search formatters use `en-US` + `Africa/Abidjan` | `features/search/lib/format.ts` |
| T8 | **OK** | Bookings rows reuse search `formatDepartureTime` (Abidjan) | `booking-row.tsx` |

### 3.4 UI quality — not “great UI” certified

This audit does **not** redesign. Against a high bar:

| ID | Severity | Finding |
|----|----------|---------|
| U1 | **High** | Mega-forms (route builder, settings, layout builder) create cognitive overload — many concerns, one scroll surface |
| U2 | **Medium** | Overview departure CTA always goes to generic Dispatch, not deep-linked trip/manifest |
| U3 | **Medium** | Search dialog is nav-only; title “Active Trips” vs sidebar “Dispatch Board” naming drift |
| U4 | **Medium** | Inconsistent empty/error/loading skeletons across domains (revenue has skeletons; fleet/terminals more ad-hoc) |
| U5 | **Low** | English copy appears generally compliant; French shows up via `fr-CI`/`fr-FR` **number** locales (not prose) |
| U6 | **MF** | No heatmaps, reviews, bulk ops, stuck-escrow workbench (explicitly deferred earlier) |

### 3.5 IAM / security across routers

**Generally good:** fleet, routes, terminals, schedules, trips, staff mutations, revenue/withdraw/bookings on `operator.ts` use `requirePermission` / `requireAnyPermission` / `requireOwner`.

| ID | Severity | Finding |
|----|----------|---------|
| S1 | **Medium** | `operator` onboarding procs (`getOnboardingStatus`, `completeOnboarding`, `saveOnboardingStep`, `validateSlug`, `logOnboardingEvent`, `getShellContext`) have **no** fine-grained permission keys — any company operator member can hit them | `operator.ts` |
| S2 | **Medium** | Bank reveal is OWNER-only + audit log — **no step-up OTP** (known deferred MF) | `revealBankAccount` |
| S3 | **Low** | Settings UI line rendering `account.accountNumber` depends on mask helper; reveal path is separate — verify no accidental unmask in list payload in QA |
| S4 | **OK** | Fleet page no-prefetch for SUPPORT | intentional |
| S5 | **OK** | Role demotion resets to template; invite URL omitted in production (prior remediation) |

### 3.6 Docs drift (`payment_system_parts`)

| ID | Severity | Finding |
|----|----------|---------|
| D1 | **High** | `06-escrow.md` + `17-implementation/crons/release-escrow.md` + `17-ledger.md` still say escrow is a **direct** balance update and the intentional exception to AccountingEngine |
| D2 | **High** | Code posts `ESCROW_RELEASE` journal with `releaseFromReserve`, fail-closed without snapshot, `clearedAt` after journal | `release-escrow/route.ts`, `lib/escrow-release.ts` |
| D3 | **Medium** | Top-level `docs/payment_system.md` §23 was updated; **parts tree was not** — two sources of truth |

---

## 4. Per-Domain Audit

### 4.1 Overview (`/dashboard/operator`)

| Axis | Grade | Notes |
|------|-------|-------|
| UI | C | Useful KPIs + departures; card-heavy; weak deep links |
| Query | B | Prefetch onboarding + metrics |
| Composition | C | ~470 LOC single view |
| Time | **D** | `fr-CI` local clock on departures |
| Domain | B | Metrics permission-aware; fleet counts gated |

**Must-fix:** T1 departure timezone; deep-link trip IDs.

### 4.2 Terminals

| Axis | Grade | Notes |
|------|-------|-------|
| UI | **D** | Dense KPIs; **French placeholders** (English rule violation) |
| Query | **F** | Prefetch list+cities with **no IAM gate** → FINANCE/SUPPORT FORBIDDEN |
| Composition | **F** | 1076 LOC monolith; zod module unused |
| Time | C− | Operating hours wall-clock with no Abidjan contract |
| Domain | **D** | Deactivate-with-routes guarded; **`isTerminal` demotion while linked is not** |

### 4.3 Routes

| Axis | Grade | Notes |
|------|-------|-------|
| UI | C | Map + DnD powerful; hover-only actions; Leaflet via unpkg CDN |
| Query | **F** | Prefetch `terminals.list` without IAM — breaks FINANCE (has routes:read, not terminals:read) |
| Composition | **F** | 1475 LOC monolith |
| Time | C | Offset minutes OK; future-trip guards use naive `now` |
| Domain | **D** | Ownership checked; **API allows non-bookable/inactive terminals**; optimistic delete fragile |

### 4.4 Fleet

| Axis | Grade | Notes |
|------|-------|-------|
| UI | C+ | Stats + layouts; soft-delete copy claims permanent destroy |
| Query | **B+** | **Best pattern** — no RSC prefetch + client `fleet:read` gate |
| Composition | **F** | 1170 + layout-builder 871 + add-bus 554 |
| Time | B | Thin surface |
| Domain | C+ | Schema/busType match OK; no pagination; plate update uniqueness weak |

### 4.5 Schedules

| Axis | Grade | Notes |
|------|-------|-------|
| UI | B− | Wizard + edit drawer; preferred-bus warning; hover-only card actions hurt a11y |
| Query | **C** | Prefetch `{}` vs filtered client; no Suspense; weak invalidation to trips |
| Composition | B− | Best domain split; edit drawer still ~765 LOC monolith |
| Time | **D** | Generator Abidjan OK; `parseLocalDate` / preview calendar are **browser-local** |
| Domain | B− | Reconcile/fare guards strong; **create commits schedule then generates trips outside txn** |

### 4.6 Trips (Dispatch)

| Axis | Grade | Notes |
|------|-------|-------|
| UI | B | Cards + manifesto; page-local KPI counts misleading |
| Query | B+ | Prefetch list; IAM-gated fleet query; cancel should invalidate bookings |
| Composition | B− | `components/trips/*` good; manifest ~655 LOC |
| Time | B− | Format helpers Abidjan; create/filter `new Date(string)` ambiguous |
| Domain | **C** | IAM strong; **non-atomic cancel/refund**; **delay mutates departureDate vs unique** |

### 4.7 Bookings

| Axis | Grade | Notes |
|------|-------|-------|
| UI | B− | Filters/scanner/CSV; card list not dense table; phone PII in list |
| Query | **A−** | Prefetch + Suspense; remount key churn; export capped at 100 |
| Composition | B | Row/list/drawer split; procs still in `operator.ts` monolith |
| Time | **A−** | Via search formatters + service day bounds |
| Domain | B− | Check-in strong; **`COMPLETED` filter dead** (only `completedAt` written); `ticketToken` on get |

### 4.8 Revenue

| Axis | Grade | Notes |
|------|-------|-------|
| UI | B− | Charts + ledger + CSV; header Export is a **dead control** |
| Query | **C** | Good prefetch UX; **bad** analytics query cost (Q2) |
| Composition | B | `components/revenue/*` |
| Time | **D+** | Abidjan day keys server-side; nuqs defaults use local `startOfMonth`; chart `fr-FR` |
| Domain | **C−** | `netRevenueXOF` does **not** subtract `refundsIssuedXOF` but UI labels “Net Earnings”; route refund counts placeholder 0 |

**Must-fix:** Correct net KPI; SQL aggregates; Abidjan date defaults; wire/remove Export.

### 4.9 Withdraw

| Axis | Grade | Notes |
|------|-------|-------|
| UI | C+ | Bank-not-verified banner; **claims 24h cooldown the API does not enforce**; invents fee `100` when metadata missing |
| Query | C | Prefetch snapshot + list; settings not prefetched → waterfall |
| Composition | C | Single ~355 LOC view |
| Time | **D** | fr-CI money + local date history |
| Domain | C | Strong FOR UPDATE / Paystack split; snapshot gated only on `revenue:view` (blocks withdrawals-only grants) |

### 4.10 Settings

| Axis | Grade | Notes |
|------|-------|-------|
| UI | C | Full company cockpit but overwhelming |
| Query | C | Partial prefetch; bank list secondary query |
| Composition | **F** | 1804 LOC single file — worst offender |
| Time | C | Uses `date-fns` format in places |
| Domain | B | Masked banks; OWNER reveal; documents; notifications embed |

**Must-fix:** Split into `components/settings/{profile,bank,documents,verification,notifications}-section.tsx` + thin view.

### 4.11 Staff

| Axis | Grade | Notes |
|------|-------|-------|
| UI | B+ | Matrix, invites, activity |
| Query | B+ | Parallel prefetch |
| Composition | **A−** | Reference implementation |
| Time | B | en-US labels |
| Domain | **A−** | Templates, grant subset, ownership transfer OTP, activity Json |

**Gaps:** Activity UI may still need richer metadata display; resend invite prod URL omitted (good).

### 4.12 Onboarding + Welcome

| Axis | Grade | Notes |
|------|-------|-------|
| UI | B | Multi-step |
| Query | B | Cities prefetch |
| Composition | B | Step components under `components/onboarding/` |
| Domain | B | Status machine; bank encryption |

**Gaps:** Onboarding procs not permission-scoped (S1) — usually OK for OWNER-only companies early, weaker for multi-staff mid-onboarding.

### 4.13 Search / booking intersection (operator-relevant)

| Axis | Grade | Notes |
|------|-------|-------|
| Passenger search formatters | A− | en-US + Abidjan |
| Hold ownership | B+ | Assert on release/pay/wallet |
| Inactive schedule / non-bookable trip | B+ | Hardened in remediation |
| Operator command palette | D | Not real search |

---

## 5. Router Procedure Completeness (permission skim)

| Router | Procedures | Permission coverage |
|--------|------------|---------------------|
| `fleet.ts` | getBusTypes, getPermissions, layouts, buses, CRUD, seats, custom layouts | All sensitive ops gated; `getPermissions` returns capability flags (OK) |
| `routes.ts` | list, getCities, get, create, update, delete | Gated; getCities any of routes/terminals read |
| `terminals.ts` | list, create, update, delete | Gated |
| `schedules.ts` | list/get/create/retire/delete/update*/reconcile/fares/exceptions/regenerate | Gated |
| `trips.ts` | create/list/get/assignBus/delay/cancel/updateStatus/notes/gate | Gated; cancel uses `trips:cancel` |
| `staff.ts` | permissions, CRUD staff, invites, ownership, activity, catalog | Gated / OWNER |
| `operator.ts` | onboarding*, shell, settings*, bank*, bookings*, revenue*, withdraw* | Settings/money gated; **onboarding/shell/log weaker** |

---

## 6. What Is Already Strong (do not regress)

1. Staff IAM architecture + split UI  
2. Schedules enterprise stack (window helper, cron generate-trips, reconcile, preferred bus)  
3. Trips dispatch composition + Abidjan format helpers  
4. Bookings Suspense list + check-in service tests  
5. Post-remediation money path: escrow journal, clawback, card idempotency, withdraw reserved UI  
6. IAM-aware fleet non-prefetch  
7. English product copy (prose) generally clean  

---

## 7. Priority Remediation Matrix (to reach the bar)

### P0 — Must close before calling “enterprise-complete”

1. **Transactional trip cancel** — do not mark `CANCELLED` before refunds succeed (`cancel-trip-with-refunds.ts`)  
2. **Delay must not mutate `departureDate`** into `@@unique([scheduleId, departureDate])` collisions  
3. **Atomic schedule create** — trip generation failure must not leave orphan schedules  
4. **Revenue “Net Earnings” must subtract period refunds** (or rename KPI) — `netRevenueXOF` currently ignores `refundsIssuedXOF`  
5. **Enforce or remove** the Withdraw UI’s “once every 24 hours” claim — backend does not enforce cooldown  
6. **Stop inventing** missing withdrawal fees (default `100` XOF) — fail closed / show “—”  
7. **Rewrite revenue analytics** to DB aggregates / bounded queries (Q2)  
8. **Compose** Settings / Routes / Fleet / Terminals into `components/{domain}/*` + thin views (C1–C3)  
9. **Abidjan everywhere for operator calendars** — replace `parseLocalDate` / preview week math / Overview clocks / revenue `startOfMonth` / trip create date parse  
10. **Sync `docs/payment_system_parts` escrow** with journaled release (D1–D2)  
11. **Schedules prefetch** from parsed `scheduleSearchParamsCache` + Suspense (Q1)  
12. Apply all pending Prisma migrations + run audit QA matrix  

### P0.5 — Authz / product honesty / bookings

13. **Page-level permission redirects** (sidebar hide ≠ route guard)  
14. **Filter command palette** by `useStaffPermissions`  
15. **Gate Overview check-in** on `bookings:update`  
16. **`removeStaff` must revoke sessions**  
17. **`getAccountSnapshot`** should accept `withdrawals:view` OR `revenue:view`  
18. Wire or remove dead Revenue header Export + unused settings bank/reveal mutations  
19. **Booking `COMPLETED` filter** — write status on ARRIVED or remove/map via `completedAt`  
20. **CSV export** — raise/stream limit; stop toasting false completeness at 100 rows  
21. Split `schedule-edit-drawer` / `manifest-drawer`; extract bookings procs from `operator.ts` monolith  
22. Invalidate `trips.list` + `listBookings` after schedule exception cancel / trip cancel  
23. `cancelTripWithRefunds` should enforce `companyId` inside the helper (defense in depth)  
24. **Routes/Terminals IAM-blind RSC prefetch** — mirror Fleet (no prefetch / client gate before Suspense); FINANCE/SUPPORT currently FORBIDDEN on hydrate  
25. **Route create/update must require `isTerminal && isActive`** terminals; block demoting `isTerminal` while linked to routes  
26. **Remove French placeholders** in terminals/onboarding address fields  
27. Fleet `getBuses` pagination; plate uniqueness on `updateBus`; honest soft-delete copy  
28. Withdraw page should prefetch `getSettings` (avoid Suspense waterfall)  

### P1 — Enterprise hardening

7. Unify currency formatting policy (drop ad-hoc `fr-CI`/`fr-FR` or document XOF style)  
8. Settings bank list prefetch; reduce query waterfalls  
9. Split layout-builder + manifest drawer  
10. Overview deep-links to trip manifest  
11. Onboarding permission policy for multi-staff  
12. Entity search in command palette (or rename to “Jump to”)  

### P2 — Excellence / deferred product

13. Step-up OTP for bank reveal  
14. Dual-control CASH, heatmaps, reviews, bulk ops  
15. Shared operator list-toolbar primitive  
16. Monolith split for add-bus-modal  

---

## 8. Final Answer to the Bar

| Claim | Answer |
|-------|--------|
| Enterprise-complete? | **No** |
| Great UI? | **Not certified** — functional, inconsistent density, mega-forms |
| Perfect query architecture? | **No** — schedules prefetch mismatch, revenue O(n) load, settings waterfalls |
| Perfect composition? | **No** — four view files >1000 LOC |
| Perfect time? | **No** — Overview/Withdraw/preview locale bugs remain |
| Every domain perfect? | **No** — Staff/Schedules/Trips/Bookings lead; Settings/Routes/Fleet/Terminals lag |

**Honest positioning:** After Phases 0–8 remediation, the dashboard is a **serious operational product with fixed money/inventory landmines**. It is **not** yet the “perfect enterprise” system described in your bar. The shortest path to that bar is **composition + time + revenue scale + docs sync**, not another round of random feature adds.

---

## 10. Multi-agent audit consolidation (2026-07-19)

Four parallel auditors covered (1) fleet/routes/terminals, (2) schedules/trips/bookings, (3) overview/revenue/withdraw/settings/staff, (4) cross-cuts. Shared conclusion: **not enterprise-complete**. Strongest pockets: Staff UI, Fleet IAM prefetch pattern, Trips/Bookings Abidjan formatters, post-remediation money IAM on procedures. Systemic failures: god-file composition, finance KPI/policy honesty, non-atomic cancel, routes/terminals blind prefetch, browser-local calendars, escrow parts docs drift.

Full detail remains in the sections above; P0 matrix is the single backlog to close the bar.