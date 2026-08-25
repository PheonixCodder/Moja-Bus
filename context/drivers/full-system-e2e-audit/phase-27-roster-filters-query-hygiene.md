# Phase 27 — Roster Filters & Query Hygiene

> **Closes:** F-OP-14 (P3), F-OP-15 (P3) · Evidence: `02-operator-admin-lifecycle.md` findings.
> N+1 conflict query per roster driver per combobox open (`drivers.ts:2607-2634`), unordered `take:50` conflict scan (`driver-assignment.ts:115`) + `take:5` urgent feed (`:2659-2669`); status dropdown omits SUSPENDED, verificationStatus/employmentType filters unexposed (`operator-drivers-view.tsx:164-171`), `canAssign` advertises `drivers:assign` while the mutation enforces `trips:update`.
> **Status: ✅ CODE COMPLETE 2026-08-25** — gates green (schemas tsc · web tsc · turbo test 9/9, web **461/461** incl. new 11-case conflict-core suite). Staging legs: combobox open stays O(1) queries on a large roster; identical inputs → identical ineligible-reason lists; SUSPENDED filter reachable; dispatcher holding only trips:update sees the combobox ENABLED.

## Objective
Dispatch surfaces are fast on large rosters and deterministic; roster filters expose what the server supports; capability keys stop lying.

## Tasks
- [x] `listAssignableDrivers`: fetch all candidate assignments once and compute overlaps in-process (batch, no N+1).
      *(ONE batched query over the whole roster inside the same ±16 h window; overlaps computed per driver in-process through the NEW pure core `findTripConflict`, extracted so the single-driver path (`getDriverTripConflict`, still used by delay revalidation) and the batch path share ONE math source — the divergence trap named during planning, closed by construction. RIDE-ALONG FIX: `licenseExpiryDate` was missing from the drivers select, so Phase 14's licence-valid-through-run half of `licenseOk` silently passed everyone on this surface; now selected.)*
- [x] Deterministic `orderBy` on the ±16 h candidate scan and the urgent-dispatch take.
      *(Both conflict queries order `[trip.departureDate asc, id asc]` — which conflict wins a multi-overlap scan is no longer heap-order-dependent; urgent feed ordered soonest-departure-first with id tiebreaker.)*
- [x] Expose SUSPENDED + verificationStatus + employmentType filters in the roster UI.
      *(SUSPENDED option in status dropdown; new Verification and Contract Type selects wired into listDrivers' already-supported server params; filterKey extended so accumulate-pagination resets on change.)*
- [x] Align `getPermissions.canAssign` with actual enforcement (`trips:update`) or implement `drivers:assign` checks consistently — pick one, document.
      *(canAssign re-backed to `trips:update` — the enforced key — fixing the active UX bug where dispatchers holding trips:update were greyed out of assignment they could perform. Documented at the call site.)*

## Tests
`lib/__tests__/driver-assignment.test.ts` (11 cases, wired into web runner): interval derivation (arrival / distance-fallback / static-default), buffer semantics both sides (hard overlap · inside-buffer block · cleared-past-buffer), legacy null-arrival fallback, label chain (city pair → route name → plate → French default), first-overlap-wins caller-order determinism, empty-list null. The suite pins the SHARED core, so single-driver and batch paths are regression-guarded together.

## Acceptance criteria
Combobox open is O(1) queries regardless of roster size (query-count test); identical inputs yield identical ineligible-reason lists; all server filters reachable from UI.
