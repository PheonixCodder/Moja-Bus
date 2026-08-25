# Phase 13 — Roster Management Completeness

> **Closes:** F-OP-02 (P2), F-OP-04 (P2) · Evidence: `02-operator-admin-lifecycle.md` findings.
> Zero UI consumers for `updateDriver` (`drivers.ts:658-725`) / `deleteDriverAffiliation` (`:776-795`) — departed drivers immortal on rosters. Roster hardcodes `page:1, limit:50` (`operator-drivers-view.tsx:59-67`) despite server pagination (`drivers.ts:407-414`).

## Objective
Operators can manage the full driver lifecycle from the UI: correct details, and offboard departed drivers; rosters scale past 50 rows without silent loss.

## Tasks
- [ ] Passport page actions (permission-gated `drivers:update` / delete permission): Edit dialog (license fields, badge number, notes) calling `updateDriver`; Remove-from-roster confirm dialog calling `deleteDriverAffiliation`.
- [ ] Offboarding fires a `driver-affiliation-ended` notification to the driver via the outbox (mirror the exclusive-termination path).
- [ ] Roster pagination: adopt the marketplace accumulate/load-more pattern (or pager) using existing `totalPages`.
- [ ] Tests: offboard removes from `listDrivers`/`listAssignableDrivers`; edit persists; pagination accumulates correctly.

## Acceptance criteria
Operator can fix a license typo and remove a departed driver entirely through the UI; >50-driver company sees its whole roster.

## Dependencies
After Phase 06 (offboarding interplay with run-state convergence settled).
