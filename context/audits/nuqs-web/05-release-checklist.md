# ✅ 05 - Release Checklist: Quality Gates & Probes

Execute this checklist before closing this audit and marking `SCRUM-10` ("Fix Nuqs bugs in the complete web app across all pages") as complete.

---

## 🧪 Probe A: Build & Typechecks
- [x] Running `pnpm --filter=web typecheck` succeeds with 0 errors.
- [x] No server-side components import types or functions from `"nuqs"` (all use `"nuqs/server"`).
- [x] No client components import from `"nuqs/server"` (only shared schema files in `lib/` do).
- [x] Zero TypeScript errors related to parser definitions or schema mappings.

---

## 🧪 Probe B: Hydration & Server Prefetch
- [x] **Schedules Page**: `scheduleSearchParamsCache.parse(await searchParams)` wired to `trpc.schedules.list.queryOptions`. SSR HTML matches filtered state.
- [x] **Staff Page**: `staffSearchParamsCache.parse(await searchParams)` wired to `trpc.staff.listStaff.queryOptions`. Direct load of `?tab=invitations` hydrates without flickering.
- [x] **Settlements Page**: `SearchParams` imported as type from `"nuqs/server"`. Table loads page directly on SSR.
- [x] **Routes Page**: `routeSearchParamsCache.parse(await searchParams)` wired to `trpc.routes.list.queryOptions({ showArchived })`.
- [x] **Drivers Page**: `driverSearchParamsCache.parse(await searchParams)` wired to `trpc.drivers.listDrivers.queryOptions`.
- [x] **Fleet Page**: `fleetSearchParamsCache.parse(await searchParams)` prefetches buses, bus types, and custom layouts.

---

## 🧪 Probe C: URL State & Input Debounce
- [x] **Bookings Search**: Rapid typing buffered locally and debounced 300ms before calling `setParams({ q })`.
- [x] **Admin Users Search**: Deprecated `{ defaultValue }` upgraded to `parseAsString.withDefault("")`; debounced 300ms.
- [x] **Terminals Filter**: Local search buffer with 300ms debounce prevents keystroke flooding; URL updates seamlessly.
- [x] **Sent Offers Tabs**: Replaced `<Link>` navigation with `setParams({ status: tab.value })`.
- [x] **Routes, Drivers, Fleet**: Search and filters synchronized with URL via `useQueryStates`; state persists across refresh.
- [x] **Admin Activity Logs**: 4 separate `useQueryState` unified into `adminActivityLogsParamsSchema` with 300ms debouncing.

---

## 🏁 Sign-Off Criteria
When all probes pass:
1. Update `context/progress-tracker.md`.
2. Transition `SCRUM-10` to `Done` in Jira.
3. Delete `context/audits/nuqs-web/` per repository audit protocol (`context/audits/README.md`).
