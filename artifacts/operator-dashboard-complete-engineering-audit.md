# Moja Ride Operator Dashboard — Complete Engineering Audit

**Date:** 2026-07-19  
**Scope:** Full operator portal + public search purchase path  
**Constraint:** Design is finalized — this audit covers business logic, data, APIs, IAM, workflows, money integrity, and engineering quality only. No visual redesign recommendations.  
**Release bar:** Treat as “about to ship to millions of users.”

---

## 1. Executive Summary

The operator dashboard is **functionally rich and partially enterprise-ready** (Staff IAM, schedules stack, Abidjan timezone helpers, recent trips/bookings P0 work). It is **not release-ready at marketplace scale** because several money and inventory paths still violate invariants:

1. **Escrow release mutates balances without ledger entries** and is **not safely idempotent** under concurrent cron runs.
2. **CASH/VOUCHER cancellation does not claw back operator escrow net** — cancelled seats can later become withdrawable.
3. **`trips.updateStatus` can set `CANCELLED` without refunds** and without `trips:cancel`.
4. **Trip cancel is non-atomic** (trip cancelled before refunds); post-departure cancel force-cancels bookings with no money movement; **PENDING_PAYMENT holds survive**.
5. **Schedule calendar / MODIFIED exceptions do not reconcile trips** — stale inventory and duplicate departures are possible.
6. **Route create does not verify terminal company ownership** — cross-tenant terminal IDs can be wired in.
7. **Card booking confirmation lacks ledger idempotency** — double webhook risk.
8. **Bank account number updates can leave verified Paystack recipients pointing at old accounts**.
9. **Hold release / payment init lack ownership binding** — authenticated attackers can kill or target others’ holds.
10. **Large monolith views** (routes ~1475 LOC, settings ~1804, fleet ~1138, terminals ~1076) and several **nuqs/API mismatches** remain.

**Recently improved (do not re-open as if unfixed):** trips SUPPORT-safe fleet load, `scheduleId` deep-link, SQL bookings filters, `operator.cancelBooking` + guest WALLET disabled in UI, trip delay incremental clocks, login-required search callback. Those prior audit items are largely addressed; this document focuses on **remaining** and **cross-surface** risk.

**Verdict:** Block production scale-out until Critical money/inventory items are fixed. High items should clear before GA.

---

## 2. Scope Reviewed

| Area | Paths |
|------|--------|
| Pages | `apps/web/app/dashboard/operator/(dashboard)/**` (overview, trips, bookings, fleet, routes, schedules, terminals, staff, revenue, withdraw, settings) |
| Features | `apps/web/features/operator/**` (~94 files) |
| Search / purchase | `apps/web/app/search/page.tsx`, `features/search/**`, `trpc/routers/booking.ts`, auth callback helpers |
| tRPC | `trips`, `schedules`, `routes`, `fleet`, `terminals`, `staff`, `operator`, `booking`, `payments` |
| Libs | `timezone`, `trip-generator`, `schedule-trip-window`, `cancel-trip-with-refunds`, `trip-status`, `permissions`, financial services |
| Cron | `generate-trips`, `release-escrow`, `reconcile-payments` (and auth patterns) |
| Schema | `packages/db/prisma/schema.prisma` — Trip, Booking, Schedule, Fare, Bus, Company, Financial*, HoldGroup, Staff* |
| Schemas | `packages/schemas/src/**` (permissions, trips, schedules, fleet, operator-bookings, payments) |
| Docs | `docs/payment_system.md`, prior `artifacts/*audit*`, `context/*` |
| Prior audits | `artifacts/operator-trips-bookings-page-audit.md`, `operator-schedules-page-audit.md`, `FINAL_PAYMENT_SYSTEM_AUDIT.md` |

**View size snapshot (LOC):** settings 1804 · routes 1475 · fleet 1138 · terminals 1076 · dashboard 470 · schedules 485 · staff 373 · withdraw 320 · trips 236 · bookings 159 · revenue 78.

---

## 3. Critical Issues

### C1. Escrow release changes balances with no ledger journal
- **Severity:** Critical  
- **Category:** Money / Ledger integrity  
- **Location:** `apps/web/app/api/cron/release-escrow/route.ts`  
- **Explanation:** Cron decrements `reservedBalance` and increments `availableBalance`, then sets `clearedAt`, with no `FinancialTransaction` / `LedgerEntry`.  
- **Why wrong:** Breaks “every money movement is a balanced journal.” Operator ledger cannot explain escrow clearance.  
- **Correct behavior:** Post an `ESCROW_RELEASE` (or equivalent) via `AccountingEngine` under row lock, then clear bookings in the same transaction.  
- **Suggested fix:** Dedicated journal type that moves reserved→available without changing posted liability incorrectly; idempotency key per booking/hold group.

### C2. Concurrent release-escrow can double-credit available balance
- **Severity:** Critical  
- **Category:** Race / Money  
- **Location:** `release-escrow/route.ts`  
- **Explanation:** Selection uses `clearedAt: null` but updates are not conditional on still-null under lock. Overlapping cron runs can both credit.  
- **Why wrong:** Inflated available balance → over-withdrawal.  
- **Correct behavior:** `UPDATE … WHERE clearedAt IS NULL RETURNING id`; only move balances for returned rows.  
- **Suggested fix:** Conditional update + assert counts; advisory lock per company.

### C3. CASH/VOUCHER cancel does not claw back operator escrow net
- **Severity:** Critical  
- **Category:** Money / Refunds  
- **Location:** `apps/web/features/payments/services/cancellation-service.ts` (CASH/VOUCHER branch)  
- **Explanation:** WALLET path debits operator net (`releaseFromReserve`). CASH/VOUCHER only reverses commission (platform↔operator) and never debits `proportionalOperatorNet`. Guest trip-cancel defaults to CASH.  
- **Why wrong:** Cancelled seats leave net in reserved; after arrival cron, operator can withdraw for cancelled inventory.  
- **Correct behavior:** Always reverse operator net; separately record offline reimbursement liability/expense for CASH/VOUCHER.  
- **Suggested fix:** Unified clawback; CASH credits a payable/clearing account, not “leave net in receivable.”

### C4. `trips.updateStatus` can CANCELLED without refunds or `trips:cancel`
- **Severity:** Critical  
- **Category:** Security / Money / Status machine  
- **Location:** `apps/web/trpc/routers/trips.ts` → `updateStatus`; `apps/web/lib/trip-status.ts`  
- **Explanation:** Input accepts full `tripStatusEnum` including `CANCELLED`. Graph allows SCHEDULED/BOARDING/DELAYED → CANCELLED. Only `trips:update` is required; `cancelTripWithRefunds` is never called.  
- **Why wrong:** API clients (or future UI) can cancel trips with zero refunds and bypass `trips:cancel`.  
- **Correct behavior:** Reject `CANCELLED` in `updateStatus`; only `trips.cancel` cancels.  
- **Suggested fix:** Exclude `CANCELLED`/`DELAYED` from `updateStatus` input; route cancel exclusively through refund helper.

### C5. Trip cancel is non-atomic; post-departure force-cancels without money; holds survive
- **Severity:** Critical  
- **Category:** Money / Inventory / Race  
- **Location:** `apps/web/lib/cancel-trip-with-refunds.ts`; `CancellationService` departure guard  
- **Explanation:** Trip set `CANCELLED` first; refund loop may fail after departure (`departureDate <= now`) then force booking `CANCELLED` with no ledger. Only `CONFIRMED` bookings are selected — `PENDING_PAYMENT` holds remain. Spoofs `userRole: "ADMIN"`.  
- **Why wrong:** Tickets/holds vs trip status diverge; unpaid cancellations; inventory leak.  
- **Correct behavior:** Block trip cancel after departure **or** force-refund path; expire holds; atomic two-phase cancel.  
- **Suggested fix:** Pre-check departure; cancel/expire holds; dedicated internal cancel API with real actor; transaction or `CANCELLING` state.

### C6. Card booking confirmation lacks ledger idempotency
- **Severity:** Critical  
- **Category:** Race / Double-post  
- **Location:** `apps/web/features/payments/services/booking-confirmation-service.ts` (`confirmFromPayment`)  
- **Explanation:** Wallet path uses idempotency keys + optimistic status updates; card/webhook path is weaker.  
- **Why wrong:** Parallel webhook + verify can double-post `BOOKING` journals.  
- **Correct behavior:** Same `updateMany` guard + stable `idempotencyKey` as wallet.  
- **Suggested fix:** Mirror wallet confirm; treat unique violations as success.

### C7. AccountingEngine solvency ignores reserved when `releaseFromReserve`
- **Severity:** Critical  
- **Category:** Escrow / Refunds  
- **Location:** `packages/db/src/services/AccountingEngine.ts`  
- **Explanation:** Checks `availableBalance + delta` even when debit should consume reserved.  
- **Why wrong:** Legitimate pre-departure refunds fail when available is low but reserved is sufficient.  
- **Correct behavior:** Branch invariant on `releaseFromReserve`.  
- **Suggested fix:** Load reserved under `FOR UPDATE`; validate reserved bucket for reserve releases.

### C8. Bank update can keep verified Paystack recipient for old account
- **Severity:** Critical  
- **Category:** Payouts / Security  
- **Location:** `apps/web/trpc/routers/operator.ts` → `updateBank`; `requestWithdrawal`  
- **Explanation:** Changing account number encrypts new digits but may leave `isVerified` + `paystackTransferRecipientCode` intact.  
- **Why wrong:** Withdrawals send to old recipient while UI shows new last4.  
- **Correct behavior:** On number/bank change: clear verification + recipient; require re-verify before payout.  
- **Suggested fix:** Reset fields in `updateBank`; block withdraw until recipient matches current account.

### C9. Duplicate trips under concurrent generation (no unique constraint)
- **Severity:** Critical  
- **Category:** Data integrity / Race  
- **Location:** `schema.prisma` `Trip`; `trip-generator.ts`; `api/cron/generate-trips`  
- **Explanation:** Uniqueness only in-memory; no `@@unique([scheduleId, departureDate])`.  
- **Why wrong:** Cron + regenerate race → duplicate inventory.  
- **Correct behavior:** DB unique + upsert/conflict no-op.  
- **Suggested fix:** Migration + catch P2002.

### C10. Trip generator does not scope bus to schedule company
- **Severity:** Critical  
- **Category:** Tenant isolation  
- **Location:** `apps/web/lib/trip-generator.ts` bus `findFirst`  
- **Explanation:** Bus lookup by id/status only — not `companyId`.  
- **Why wrong:** Wrong/corrupted `preferredBusId` can attach another company’s bus.  
- **Correct behavior:** `bus.companyId === schedule.companyId`.  
- **Suggested fix:** Add company filter; reject mismatch.

### C11. MODIFIED exceptions / calendar edits leave stale trips
- **Severity:** Critical  
- **Category:** Schedule lifecycle  
- **Location:** `trpc/routers/schedules.ts` `addException`, `updateCalendar`, `updateBasic`  
- **Explanation:** MODIFIED regenerates without pruning old-time trips; calendar/departureTime updates do not reconcile.  
- **Why wrong:** Dual departures or trips that no longer match calendar.  
- **Correct behavior:** Reconcile future window on every calendar/time/exception change.  
- **Suggested fix:** Call shared `reconcileFutureTrips` after mutations; prune/cancel mismatched day trips.

### C12. Route create/update does not verify terminal ownership
- **Severity:** Critical  
- **Category:** Tenant isolation / Data integrity  
- **Location:** `trpc/routers/routes.ts`  
- **Explanation:** Only checks origin ≠ dest; no company/`isTerminal`/`isActive` checks.  
- **Why wrong:** Cross-company or non-terminal locations can enter bookable routes.  
- **Correct behavior:** All terminal IDs must belong to `ctx.companyId` and be bookable terminals.  
- **Suggested fix:** Batch-load terminals; reject mismatches.

---

## 4. High Priority Issues

### H1. `releaseHold` / payment init lack hold ownership
- **Severity:** High  
- **Category:** Security  
- **Location:** `trpc/routers/booking.ts` `releaseHold`, `initiatePayment`, `checkoutWithWallet`  
- **Explanation:** Hold ID alone; no `holdGroup.userId === ctx.user.id`.  
- **Why wrong:** Authenticated users can kill or pay against others’ holds.  
- **Correct behavior:** `assertHoldOwnedBy` on every hold mutation.  
- **Suggested fix:** Central ownership check in hold/payment services.

### H2. Escrow stuck when `ARRIVED` without `actualArrival`
- **Severity:** High  
- **Category:** Escrow / Ops  
- **Location:** `release-escrow/route.ts`; `trips.updateStatus`  
- **Explanation:** Cron requires `actualArrival < now-24h`. Missing timestamp → forever reserved.  
- **Why wrong:** Operators cannot withdraw earned revenue.  
- **Correct behavior:** Require `actualArrival` on ARRIVED (already set in happy path); alert ARRIVED+null; fallback SLA.  
- **Suggested fix:** Enforce non-null; ops dashboard for stuck escrow.

### H3. Escrow fallback uses gross `farePaidSum` when snapshot missing
- **Severity:** High  
- **Category:** Commissions  
- **Location:** `release-escrow/route.ts`  
- **Explanation:** Missing snapshot → release fare gross as “net.”  
- **Why wrong:** Over-release by commission amount.  
- **Correct behavior:** Fail closed; alert; never use gross as net.  
- **Suggested fix:** Skip + metrics; backfill snapshots.

### H4. Withdraw posts ledger success before Paystack ack; catch never reverses
- **Severity:** High  
- **Category:** Withdrawals / Docs drift  
- **Location:** `operator.ts` `requestWithdrawal`; `docs/payment_system.md`  
- **Explanation:** Commits debit then calls Paystack; on catch marks `PENDING`/`networkError` for all errors; docs claim immediate reversal on hard reject. Metadata overwrite drops `requestedBy`.  
- **Why wrong:** Funds limbo; docs lie; audit trail broken.  
- **Correct behavior:** State machine PENDING_TRANSFER; reverse definitive rejects; merge metadata.  
- **Suggested fix:** Classify Paystack errors; merge JSON metadata; align docs.

### H5. Withdraw UI escrow = `posted − available` not `liveReservedBalance`
- **Severity:** High  
- **Category:** Incorrect information  
- **Location:** `operator-withdraw-view.tsx`  
- **Explanation:** Derives escrow locally instead of server reserved.  
- **Why wrong:** Lies when buckets desync.  
- **Correct behavior:** Show `liveReservedBalance`.  
- **Suggested fix:** Use snapshot fields; warn if `posted ≠ available + reserved`.

### H6. `trips.list` `q` applied after pagination
- **Severity:** High  
- **Category:** Search / Pagination  
- **Location:** `trpc/routers/trips.ts` `list`  
- **Explanation:** SQL skip/take then in-memory filter; totals become page-local.  
- **Why wrong:** Missing matches, empty pages, wrong counts.  
- **Correct behavior:** Push `q` into Prisma `where`.  
- **Suggested fix:** OR on route cities / plate / id with ILIKE.

### H7. `assignBus` no status guard + TOCTOU
- **Severity:** High  
- **Category:** Business rules / Race  
- **Location:** `trips.ts` `assignBus`  
- **Explanation:** Can swap bus on DEPARTED/ARRIVED/CANCELLED; compatibility check outside transaction.  
- **Why wrong:** Corrupts history; seat remap races.  
- **Correct behavior:** Allow only SCHEDULED/BOARDING/DELAYED; lock inside transaction.  
- **Suggested fix:** Status assert + `FOR UPDATE`.

### H8. Check-in ignores trip status; token lookup global then FORBIDDEN
- **Severity:** High  
- **Category:** Business rules / Tenancy  
- **Location:** `operator-booking-service.ts` `checkIn`  
- **Explanation:** No BOARDING gate; token/reference resolved globally.  
- **Why wrong:** Check-in on cancelled trips; cross-tenant existence oracle.  
- **Correct behavior:** Require trip BOARDING (policy); scope by `companyId` first.  
- **Suggested fix:** Status check + company-scoped lookup.

### H9. Staff role demotion keeps elevated `permissions[]`
- **Severity:** High  
- **Category:** IAM  
- **Location:** `trpc/routers/staff.ts` `updateRole`  
- **Explanation:** Demote ADMIN→SUPPORT without reset keeps old grants.  
- **Why wrong:** Privilege retention.  
- **Correct behavior:** Reset to template or intersect on role change.  
- **Suggested fix:** Default `resetPermissions: true`.

### H10. ADMIN template missing `withdrawals:create`
- **Severity:** High  
- **Category:** IAM  
- **Location:** `packages/schemas/src/permissions.ts`  
- **Explanation:** ADMIN has view only.  
- **Why wrong:** Company admins cannot payout unless custom grant.  
- **Correct behavior:** Include create or document OWNER-only.  
- **Suggested fix:** Add key or document explicitly.

### H11. Fleet page unconditional prefetch crashes non-`fleet:read` roles
- **Severity:** High  
- **Category:** IAM / Loading  
- **Location:** `fleet/page.tsx`; `operator-fleet-view.tsx` suspense queries  
- **Explanation:** Prefetches buses/layouts/permissions; SUPPORT navigating via URL gets FORBIDDEN.  
- **Why wrong:** Same class of bug fixed on trips/schedules.  
- **Correct behavior:** Gate prefetch/queries by permission; soft empty state.  
- **Suggested fix:** Mirror schedules pattern.

### H12. Fare uniqueness blocks date-windowed prices; deactivate can remove last full-route fare
- **Severity:** High  
- **Category:** Fare rules  
- **Location:** `schema.prisma` Fare unique; `schedules.ts` `addFare`/`deactivateFare`  
- **Explanation:** Unique ignores validity windows; deactivate has no last-fare guard.  
- **Why wrong:** Cannot schedule promo windows; schedule becomes unsellable while trips exist.  
- **Correct behavior:** Non-overlap rules; block last full-route deactivate.  
- **Suggested fix:** Schema/app overlap checks + deactivate guard.

### H13. Preferred bus inactive still selected by cron; regenerate override not persisted
- **Severity:** High  
- **Category:** preferredBus  
- **Location:** `fleet.updateBus`; `generate-trips` cron; `schedules.regenerateTrips`  
- **Explanation:** Inactive bus leaves `preferredBusId`; cron fails per schedule; override bus only used for one run.  
- **Why wrong:** Silent trip drought.  
- **Correct behavior:** Clear preferred on non-ACTIVE; persist override; filter ACTIVE preferred in cron.  
- **Suggested fix:** `updateMany` null preferred; cron join ACTIVE bus.

### H14. Terminals cities require `routes:read`
- **Severity:** High  
- **Category:** IAM  
- **Location:** `operator-terminals-view.tsx`; `routes.getCities`  
- **Explanation:** City picker gated on routes permission.  
- **Why wrong:** Terminals staff without routes cannot add terminals.  
- **Correct behavior:** Cities with `terminals:read` or shared geo catalog.  
- **Suggested fix:** Move `getCities` or loosen permission.

### H15. Revenue analytics UTC buckets + full-table load + refund undercount
- **Severity:** High  
- **Category:** Analytics / Timezone / Performance  
- **Location:** `operator.getRevenueAnalytics`  
- **Explanation:** Day keys via UTC ISO; loads all confirmed bookings in range; refunds use `entries[0]` only. KPIs from snapshots mixed with live ledger balances.  
- **Why wrong:** Wrong “today,” timeouts, understated refunds, inconsistent cards.  
- **Correct behavior:** Abidjan keys; SQL aggregates; sum all debit entries; label sales vs ledger.  
- **Suggested fix:** `getCalendarDateKey`; groupBy; ledger-based KPIs.

### H16. Cron auth only in `production` NODE_ENV
- **Severity:** High  
- **Category:** Security  
- **Location:** `release-escrow`, `reconcile-payments`, `generate-trips`  
- **Explanation:** Bearer check skipped when not production.  
- **Why wrong:** Preview/staging open crons.  
- **Correct behavior:** Require secret whenever set / all deployed envs.  
- **Suggested fix:** Fail closed if secret missing in deployed environments.

### H17. Search/booking formatters use `fr-FR` + UTC
- **Severity:** High  
- **Category:** Incorrect information / Language rule  
- **Location:** `features/search/lib/format.ts` (also used by bookings UI)  
- **Explanation:** French locale number/time; `timeZone: "UTC"`. Product rule: English UI; app TZ Abidjan.  
- **Why wrong:** Wrong clocks and non-English formatting on operator bookings.  
- **Correct behavior:** `en-US` + `Africa/Abidjan`.  
- **Suggested fix:** Shared formatter from `lib/timezone` / trips format helpers.

### H18. Schedules `routeId` nuqs unused; trips `startDate`/`endDate` unused
- **Severity:** High  
- **Category:** nuqs  
- **Location:** `schedule-search-params.ts`; `trip-search-params.ts`; views  
- **Explanation:** Parsers/API exist; views don’t wire.  
- **Why wrong:** Shareable URLs lie.  
- **Correct behavior:** Wire or remove.  
- **Suggested fix:** Pass into list inputs + toolbar.

### H19. Exception `ServiceException` no unique `(scheduleId, date)`; removeException incomplete
- **Severity:** High  
- **Category:** Exceptions  
- **Location:** schema + `schedules.addException`/`removeException`  
- **Explanation:** App-level duplicate check; removing EXTRA/MODIFIED doesn’t prune trips.  
- **Why wrong:** Ghost trips / conflicting exceptions.  
- **Correct behavior:** DB unique; always reconcile on remove.  
- **Suggested fix:** Migration + reconcile call.

### H20. createBus ignores shared schema; busType vs layout mismatch
- **Severity:** High  
- **Category:** Validation / Fleet  
- **Location:** `fleet.ts` `createBus`  
- **Explanation:** Weaker inline Zod; client `busTypeId` not forced to template type.  
- **Why wrong:** Bad plates/years; mismatched layouts.  
- **Correct behavior:** `createBusSchema`; set type from template.  
- **Suggested fix:** Use `@moja/schemas` + template.busTypeId.

### H21. Invitation returns raw `inviteUrl` to client
- **Severity:** High  
- **Category:** Security  
- **Location:** `staff.ts` `createInvitation`  
- **Explanation:** Token in API response.  
- **Why wrong:** Leaks via logs/devtools.  
- **Correct behavior:** Email-only delivery.  
- **Suggested fix:** Omit URL outside non-prod.

### H22. Partial calendar update can clear all weekdays
- **Severity:** High  
- **Category:** Schedule generation  
- **Location:** `updateCalendarSchema` / `updateCalendar`  
- **Explanation:** Zod only rejects all-false in one payload; merge can zero days.  
- **Why wrong:** Active schedule with no operating days.  
- **Correct behavior:** Validate merged calendar ≥1 day.  
- **Suggested fix:** Load-merge-validate.

### H23. Terminal deactivate does not protect linked routes
- **Severity:** High  
- **Category:** Terminals  
- **Location:** `terminals.ts` `update`  
- **Explanation:** Can set inactive/non-terminal while used on routes.  
- **Why wrong:** Broken bookable graph.  
- **Correct behavior:** Same linkage guards as delete.  
- **Suggested fix:** Block or cascade-suspend routes.

### H24. Wallet pre-check outside posting transaction (TOCTOU)
- **Severity:** High  
- **Category:** Race  
- **Location:** `booking-confirmation-service.ts` `confirmFromWallet`  
- **Explanation:** Balance read before transaction.  
- **Why wrong:** Parallel checkouts can double-spend.  
- **Correct behavior:** Trust engine lock only.  
- **Suggested fix:** Drop pre-check or re-read under lock.

### H25. `Number(bigint)` on financial balances
- **Severity:** High  
- **Category:** Precision  
- **Location:** `getAccountSnapshot`, withdraw/revenue UIs  
- **Explanation:** Converts BigInt via `Number`.  
- **Why wrong:** Silent precision loss above 2^53−1.  
- **Correct behavior:** String integers end-to-end.  
- **Suggested fix:** Serialize as string; format in UI.

---

## 5. Medium Priority Issues

| ID | Title | Location | Summary |
|----|-------|----------|---------|
| M1 | Gate/notes cannot clear to null | `manifest-drawer.tsx` | `draft \|\| trip.gate` prevents clear |
| M2 | Trip status chips count current page only | `operator-trips-view.tsx` | Misleading header stats |
| M3 | `updateStatus(DELAYED)` without minutes | `trips.updateStatus` | Status DELAYED without clock shift |
| M4 | Delay concurrency double-shifts | `trips.delay` | No lock on cumulative minutes |
| M5 | `boardedAt`/`completedAt` never written | schema Booking | Dead lifecycle fields |
| M6 | `routeSnapshotJson` may be double-encoded string | `trips.create` | Prefer plain Json object |
| M7 | Assign bus matches seat by label only | `assignBus` | Ambiguous labels / class mismatch |
| M8 | Proportional refund remainder race | `cancellation-service` | Concurrent cancels in hold group |
| M9 | Bookings nuqs `status`/`tripId` no UI | `booking-search-params` | Stranded empty filters |
| M10 | Trips prefetch `q` vs client debounce mismatch | `trips/page.tsx` | Extra fetch flicker |
| M11 | Fleet/layouts overfetch seat graphs | `fleet.ts` | Schedules wizard pulls full buses |
| M12 | Schedule create trips outside transaction | `schedules.create` | Schedule persists if gen fails |
| M13 | Waypoint stopOrder can collide with dest order | routes/schedules types | Normalize 1..N-1 |
| M14 | `updateFare` allows price 0 | schemas | Align min with create |
| M15 | Retired schedule booked trips still sellable | search + retire | Product decision needed |
| M16 | `reconcile-payments` fakes `charge.success` | cron | Prefer verify-then-branch API |
| M17 | Reveal bank with only OWNER + company:view | `revealBankAccount` | No step-up auth |
| M18 | Multi-seat Math.round remainder dust | cancel + release | Persist per-seat net |
| M19 | ActivityLog metadata often stringified | staff activity | Pass Json objects |
| M20 | Dual revenue parsers (`revenue-params` vs `revenue-search-params`) | operator/lib | Dead/duplicate config |
| M21 | FINANCE cannot read bookings | ROLE_TEMPLATES | Blind to disputes |
| M22 | OPERATIONS lacks `trips:cancel` | ROLE_TEMPLATES | Document or grant |
| M23 | Manifest mixes holds + confirmed | `trips.get` / drawer | Split sections |
| M24 | Soft-remove staff `transferredAssignments: 0` | `removeStaff` | Dead field |
| M25 | Novu delay payloads use UTC | `trips.ts` | Use Abidjan |
| M26 | Schedule UI date parse local browser | schedule-search-params | Use Abidjan day |
| M27 | getDashboardMetrics exposes bus counts without fleet:read | `getDashboardMetrics` | Aggregate leak vs IAM |
| M28 | Search resume offer staleness | offer-card + createHold | Revalidate price/version |

---

## 6. Low Priority Issues

| ID | Title | Notes |
|----|-------|-------|
| L1 | Trip `get` heavy seats+bookings | Acceptable for manifest; split later |
| L2 | Check-in race mostly idempotent | Prefer conditional `updateMany` |
| L3 | Trip cancel Novu amount may overstate | Use refund result amount |
| L4 | Settings/notifications section incomplete | Verify vs schema |
| L5 | Operator search dialog coverage gaps | Incomplete entity navigation |
| L6 | Missing export CSV on bookings/revenue | Product expectation |
| L7 | Missing bulk check-in / bulk cancel | Ops scale |
| L8 | Accessibility: combobox/drawer labels incomplete | Functional a11y |
| L9 | Missing skeletons on several pages (`fallback={null}`) | Error/loading UX |
| L10 | context docs partially stale vs post-trips-P0 | Update after fixes |
| L11 | Reviews model unused in operator UI | DB feature not exposed |
| L12 | TripStop actualArrival/Departure unused | Ops tracking incomplete |
| L13 | SeatStatus enum vs TripSeat.isActive duality | Clarify inventory model |
| L14 | Onboarding “bank complete” without recipient | UX state machine |
| L15 | `withdrawPage` 0-index confusion | Off-by-one risk in mind |

---

## 7. Missing Features

Operators reasonably expect:

1. **Stuck escrow / failed refund queue** (ops workbench).  
2. **Export** bookings, ledger, payouts (CSV).  
3. **Date-range controls** on trips (parsers exist, UI missing).  
4. **Route filter** on schedules (parser exists).  
5. **Status filter chips** on bookings UI (`status`/`tripId` in URL only).  
6. **Audit trail UI** for bank reveal, withdrawals, trip cancels (DB logs exist partially).  
7. **Preferred bus health** warning when bus inactive / schedule without preferred.  
8. **Reconcile schedule** button after route structural edits.  
9. **Passenger contact / reissue ticket** from booking detail.  
10. **Occupancy heatmaps / no-show rates** (data partially present via check-in).  
11. **Dual-control large CASH refunds**.  
12. **Step-up auth for bank reveal / large withdrawals**.  
13. **Search: price lock / offer version** after login resume.  
14. **Mark no-show / boardedAt** workflow.  
15. **Company verification status** surfaced on withdraw when bank unverified.

---

## 8. Database ↔ UI Inconsistencies

| DB field / enum | UI / API behavior |
|-----------------|-------------------|
| `Booking.boardedAt`, `completedAt` | Never written by operator flows |
| `Booking.clearedAt` | Not shown; only cron-driven |
| `Trip.gate`, `notes`, `delayMinutes` | Now in manifest (good); list still light |
| `Trip.actualDeparture` / `actualArrival` | Set on status; not displayed prominently |
| `Trip.busId` required in schema | UI treats assign as optional; generator requires preferred bus |
| `Fare.validFrom` / `validUntil` | Largely unused due to unique constraint |
| `ServiceException.overrideDepartureTime` | MODIFIED path incomplete reconcile |
| `Review` | No operator response UI |
| `TripStop.actual*` | Unused |
| `Operator.permissions[]` | Can diverge from role template after demotion |
| `BankAccount.isVerified` + recipient | Can desync after `updateBank` |
| `FinancialAccount.reserved/available/posted` | Withdraw UI may invent escrow |
| `SeatStatus` vs `TripSeat.isActive` | Dual models; UI mostly uses booking overlap |
| `HoldGroupStatus` | Not surfaced on bookings list |
| `CompanyStatus` / verification | Partially in settings; weak on withdraw |

---

## 9. Backend ↔ UI Inconsistencies

| Surface | Issue |
|---------|--------|
| Trips list | Returns paginated object; header stats still page-local |
| Trips cancel | Returns `refundResults`; UI toasts partial failures (good) — still non-atomic backend |
| Bookings cancel | Now `operator.cancelBooking` (good); passenger path still `payments.cancelBooking` |
| Schedules list | `routeId` API unused by UI |
| Fleet | Full seat graphs on list |
| Revenue | Snapshot KPIs ≠ ledger balances |
| Withdraw | Escrow derivation client-side |
| Search format | Shared French/UTC formatter on operator bookings |
| Metrics | Bus counts without fleet permission |
| Staff invite | Returns invite URL |

---

## 10. Product Gaps

- No end-to-end **exception → inventory → passenger communication** guarantee for MODIFIED.  
- No **escrow SLA** product copy when trips never marked ARRIVED.  
- **FINANCE** role cannot see bookings for disputes.  
- **SUPPORT** can cancel bookings (refund money) but cannot dispatch — may be intentional; document.  
- Retire schedule vs remaining sellable inventory undefined.  
- Guest CASH refund is “accounting theater” without payable tracking / cashier workflow.  
- No operator **dispute / chargeback** surface.

---

## 11. Workflow Issues

1. Schedule calendar change → trips not updated → search shows wrong days.  
2. MODIFIED exception → old + new trips.  
3. Cancel trip after departure → cancelled tickets, no refund.  
4. Cancel trip with open holds → pay after cancel.  
5. Bank edit → payout to old recipient.  
6. Mark ARRIVED without ensuring `actualArrival` path (covered in happy path) but missed → escrow forever.  
7. Role demotion → still privileged.  
8. Login resume search → stale offer possible.  
9. Fleet bus set MAINTENANCE → schedules keep generating failures.  
10. Withdraw Paystack timeout → permanent lock until manual reconcile.

---

## 12. Performance Issues

| Issue | Location |
|-------|----------|
| Revenue analytics loads all bookings in range | `getRevenueAnalytics` |
| Fleet list includes layouts/seats | `getBuses` / layout endpoints |
| Schedules wizard pulls full `getBuses` | `operator-schedules-view` |
| Routes/terminals/settings monoliths | large client bundles / hard maintain |
| Trips `q` post-filter | wasted pages |
| Manifest loads full seat map always | `trips.get` |
| Dashboard metrics recent bookings + today trips heavy includes | `getDashboardMetrics` |
| No list virtualization on long trip/booking lists | UI |

---

## 13. Query & Prefetch Audit

| Page | Prefetch today | Gaps / risks |
|------|----------------|--------------|
| Layout | shell + permissions | Good |
| Overview | onboarding + metrics | Duplicate fetch of onboarding for redirect |
| Trips | list with URL params | Prefetch `q` vs debounce mismatch; no fleet (good) |
| Bookings | list with URL params | Good; Suspense keyed |
| Fleet | all fleet queries | Crashes without `fleet:read` |
| Schedules | list | Align with URL; lazy fleet/routes (mostly) |
| Revenue | often client-only | Prefetch analytics+snapshot with URL dates |
| Withdraw | often client-only | Prefetch snapshot + withdrawals page |
| Staff | mixed | Prefetch members for active tab |
| Routes/Terminals/Settings | weak | Prefetch list queries with URL filters |

**Related entity prefetch:** opening manifest should prefetch `trips.get`; booking detail prefetch `getBooking`; schedule edit prefetch schedule get.

---

## 14. nuqs Audit

| Page | Uses nuqs? | Gaps |
|------|------------|------|
| Trips | Yes | `startDate`/`endDate` unused |
| Bookings | Yes | `status`/`tripId` no controls; `detail=scan` magic |
| Schedules | Yes | `routeId` unused |
| Staff | Yes | Solid |
| Fleet | Partial | No page pagination in URL |
| Routes | Partial | search/edit/open; no page/sort |
| Terminals | Partial | search/type/drawer; no page |
| Revenue | Yes | Dual parser files; timezone of defaults |
| Withdraw | Page only | No status filter |
| Settings | Section enum | Good |
| Search | Yes (`bookingOfferId`) | Offer versioning missing |

---

## 15. Zod Audit

| Issue | Location |
|-------|----------|
| Fleet `createBus` inline weaker than `createBusSchema` | `fleet.ts` |
| `updateFare` min 0 vs create min 1 | `schedules` schemas |
| `updateStatus` accepts CANCELLED | `trips` router |
| Feature validations split: some in `packages/schemas`, some in `features/*/lib/validations` | staff, terminal |
| Revenue dates via nuqs ISO defaults at module load | sticky “today” at deploy time risk |
| Recommendation | Prefer `@moja/schemas` for API; `features/<x>/lib` for form-only UI schemas that compose package schemas |

---

## 16. TanStack Query Audit

| Pattern | Assessment |
|---------|------------|
| Suspense for primary lists | Good on trips/bookings/schedules/revenue |
| Conditional `useQuery` for secondary | Good on trips fleet; incomplete on fleet page itself |
| Invalidations | Generally pathFilter; withdraw uses manual refetch |
| Optimistic updates | Rare — acceptable for money mutations |
| Waterfalls | Overview double-fetches onboarding; revenue analytics+balances parallel (good) |
| Cache keys | Debounced search can diverge from prefetch |
| Duplicate fetching | Layout permissions + page permissions |

---

## 17. Security Issues

1. Hold release / payment without ownership (H1).  
2. `updateStatus`→CANCELLED bypass (C4).  
3. Cross-tenant check-in token oracle (H8).  
4. Trip generator bus without company scope (C10).  
5. Route terminals without company scope (C12).  
6. Cron unauthenticated outside production (H16).  
7. Invite URL returned to client (H21).  
8. Bank reveal without step-up (M17).  
9. Bank update keeps Paystack recipient (C8).  
10. Role demotion privilege retention (H9).  
11. `cancelTripWithRefunds` spoofs ADMIN (C5).  
12. Staff with `bookings:update` can CASH-cancel without clawback (C3).  
13. Platform ADMIN user role can access `operatorCompanyProcedure` if they have an operator profile — verify intended.  

---

## 18. Accessibility Issues (functional)

- Manifest / cancel dialogs: ensure focus trap and labelled reason fields (partially present).  
- Combobox bus assign: verify accessible name when value empty.  
- Trip cards are expand buttons — ensure keyboard and `aria-expanded` (present on trips card).  
- Charts (revenue) need text alternatives / data tables (ledger tab helps).  
- Scan ticket flow: camera permission errors need announced live regions.  
- Color-only status dots need text (badges mostly present).  

---

## 19. Scalability Concerns

1. Revenue `findMany` all bookings — will time out.  
2. Fleet seat graph payloads — large fleets.  
3. Monolith client components — slow HMR and large JS.  
4. Trip/booking lists without virtualization.  
5. Cron batch 500 escrow without true idempotency — dangerous under scale-out of cron workers.  
6. No unique trip constraint — duplicates under load.  
7. In-memory search filters (`trips.q`) — wrong under pagination at scale.  
8. Single default bank for payouts — multi-account companies unsupported.  
9. Novu loops per booking on trip cancel — rate limits.  
10. Permission checks per procedure good; missing centralized audit log for money mutations.

---

## 20. Recommended Fixes

### P0 (block release)
1. Escrow cron: ledger + conditional `clearedAt` + reserved clawback correctness (C1, C2, H3).  
2. Cancellation: claw back operator net for all channels (C3).  
3. Block `updateStatus`→CANCELLED; harden `cancelTripWithRefunds` (holds, departure, atomicity) (C4, C5).  
4. Card confirm idempotency (C6).  
5. AccountingEngine reserved solvency (C7).  
6. Bank update clears verification/recipient (C8).  
7. Trip unique constraint + generator company-scoped bus (C9, C10).  
8. Schedule reconcile on calendar/MODIFIED (C11).  
9. Route terminal ownership checks (C12).  
10. Hold ownership on release/pay (H1).

### P1 (GA)
- AssignBus guards, check-in trip/company scope, staff demotion reset, fleet SUPPORT-safe page, fare last-full-route guard, preferred bus lifecycle, revenue Abidjan+aggregates, cron auth everywhere, English/Abidjan formatters, wire unused nuqs, withdraw escrow display + Paystack error classification.

### P2 (scale / quality)
- Split monolith views (routes/fleet/terminals/settings), slim fleet list APIs, exports, stuck-funds ops UI, offer versioning, virtualization, docs/code sync for payment_system.

---

## 21. Final Checklist

- [ ] Escrow release writes ledger + is idempotent under concurrency  
- [ ] CASH/VOUCHER cancel reverses operator net  
- [ ] No CANCELLED via `updateStatus`  
- [ ] Trip cancel atomic; expires holds; blocks/handles post-departure  
- [ ] Card booking confirm idempotent  
- [ ] Reserved-balance refunds succeed when available low  
- [ ] Bank edits invalidate Paystack recipient  
- [ ] `@@unique([scheduleId, departureDate])`  
- [ ] Generator/cron bus company + ACTIVE scoped  
- [ ] Calendar/MODIFIED/exception remove reconcile trips  
- [ ] Routes validate terminal ownership  
- [ ] Hold mutations ownership-checked  
- [ ] Fleet/revenue/withdraw pages permission-safe + correct money display  
- [ ] Trips `q` and schedules `routeId` wired correctly  
- [ ] Formatters English + Abidjan  
- [ ] Cron auth fail-closed in all deployed envs  
- [ ] Role demotion resets permissions  
- [ ] Docs (`payment_system.md`) match code  
- [ ] Monolith views split plan scheduled  
- [ ] Manual QA matrix: SUPPORT trips/bookings, FINANCE revenue/withdraw, OPERATIONS dispatch, OWNER bank change + payout, schedule MODIFIED, trip cancel with guest+registered, escrow after ARRIVED  

---

## Appendix A — Severity tally (this audit)

| Severity | Approx count |
|----------|-------------:|
| Critical | 12 |
| High | 25 |
| Medium | 28 |
| Low | 15 |
| Missing features | 15 |

## Appendix B — Related prior artifacts

- `artifacts/operator-trips-bookings-page-audit.md` — many P0s **partially remediated** 2026-07-19; remaining items listed above supersede stale Criticals (SUPPORT fleet, scheduleId, bookings memory filter, IAM cancel).  
- `artifacts/operator-schedules-page-audit.md` — schedules enterprise work landed; **reconcile/MODIFIED/calendar** issues remain.  
- `artifacts/FINAL_PAYMENT_SYSTEM_AUDIT.md` — escrow/ledger themes recur; treat this doc as current for operator-facing money risk.

## Appendix C — Explicit non-goals

No recommendations to change spacing, typography, color, card chrome, or visual hierarchy. Where UI is mentioned, it is only because it **blocks correct ops** (wrong numbers, missing filters wired in URL, permission crashes, uncleared fields).
