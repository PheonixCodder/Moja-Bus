# Phase 06 — Driver Run-State Lifecycle

> **Closes:** F-DV-04 (P1) · Evidence: `04-driver-trip-execution.md` trace 2 + F-DV-04.
> `currentTripId` written only at `drivers.ts:1472/:1574`; `completeTrip` refuses non-DEPARTED (`:1551-1559`); operator cancel path (`cancel-trip-with-refunds.ts`) and admin verifyDriver SUSPEND never clear driver state; `init.ts:286-291` blocks ALL driver calls when suspended.

## Objective
No driver can be stranded ON_TRIP by events outside their control: trip cancellation, reassignment, and verification suspension all converge the driver's operational state; suspended drivers keep a read-only surface instead of a hard wall.

## Tasks
- [x] Trip CANCELLED (operator path) and any assignment removal for a DEPARTED trip: in the same transaction, clear `currentTripId` and set status AVAILABLE (or OFFLINE if no open shift). *(Implemented in `lib/driver-run-state.ts` `convergeDriversAfterRunEnd`, called inside the `cancelTripWithRefunds` tx — single choke point covering trips.cancel + schedule reconcile + service-exception cancel. Keyed on `currentTripId = tripId` so ALL roles converge.)*
- [x] ~~`unassignDriver`: same convergence when target trip is DEPARTED~~ **DECISION:** keep refused post-departure; cancellation is the single post-departure lever (documented at the guard in `trips.ts`). Mid-run unassign would duplicate refund/manifest/telemetry teardown the cancel flow already owns.
- [x] Admin/operator SUSPENDED: close any open shift, clear currentTripId, set status SUSPENDED. *(Implemented via `suspendDriverOperationalState` in both `admin.verifyDriver` and operator `drivers.verifyDriver`, same tx as the verification flip. REJECT gets the same convergence; APPROVE preserves a live run instead of stomping it. Marketplace SUSPEND deliberately out of scope — different flag, F-DV-15 policy.)*
- [x] Soften `driverProcedure` for SUSPENDED: allow reads; block mutations with a clear message. *(Type-aware middleware in `init.ts`: queries pass while suspended, mutations refused; denylist keeps `getTelemetryToken` + `getMyUrgentDispatches` sealed. `getMyVerificationStatus` was already reachable via protectedProcedure.)*
- [ ] Tests: cancel-mid-run → driver AVAILABLE, TODAY list clean, `getLivePositions` ghost gone; suspend-mid-run → read-only surface. *(Unit suite landed: `lib/__tests__/driver-run-state.test.ts` — 7 green. Router-level repros remain staging probes per checklist F-DV-04.)*

## Scope additions beyond original text (ratified)
- **Operator ARRIVED converges driver state** (`trips.updateStatus`) — verified stranding vector V2 missing from the audit text; shares `convergeDriversAfterRunEnd` with cancel/complete paths and grants `totalTripsCompleted` parity.
- **`completeTrip` post-run status now shift-aware** (`resolvePostRunStatus`) so driver-closed and dispatch-closed runs land identically.
- **Driver-app client**: `live.tsx` stops zombie background telemetry when the run vanishes server-side; `register/status.tsx` gained a SUSPENDED surface (was falling into "under review" copy).

## Acceptance criteria
Audit repros fail closed: cancelled DEPARTED trips leave zero stranded drivers; live positions show no ghosts; suspended account can see but not touch.

## Dependencies
After Phase 00. Coordinates with Phase 14 (eligibility gates) — different procedures, safe to sequence either order, but 06 first.
