# Phase 31 — Driver App Data Honesty

> **Closes:** F-DV-11, F-DV-14 (P3) + four unnumbered observations · Evidence: `04-driver-trip-execution.md` + `10-cross-cutting-observations.md`.
> Earnings: hardcoded ×50 XOF/min, `take:30` caps the week bucket, open shift pays 0 (`drivers.ts:1855-1896`); urgent-dispatch ack doesn't exist server-side, modal re-fires every poll; departureTime returned as pre-formatted fr-FR string. Unnumbered: odometer inputs accepted then discarded; `broadcastTripAnnouncement` echo stub; `getMyTrips ALL` returns CANCELLED trips.

## Objective
Driver-facing numbers and feeds tell the truth: earnings math is bounded correctly with a configurable rate, urgent dispatch acks server-side, dead inputs either work or disappear.

## Tasks
- [ ] Earnings: SQL aggregates over unbounded windows (today/week), open shift accrues live minutes; extract rate to env/settings (documented placeholder until pay-rate model ships); keep "placeholder" labeling in UI per comms scope.
- [ ] Urgent dispatch: persist acknowledgements (column or table) so acks survive reinstalls/re-logins; return ISO departure timestamps; client parses locale-independently.
- [ ] Unnumbered cleanup: remove discarded odometer fields from schema+client OR implement storage (decide); delete or implement `broadcastTripAnnouncement`; exclude CANCELLED from ALL filter.

## Acceptance criteria
Earnings windows correct across >30-shift drivers; acknowledged dispatch never re-fires on a fresh install; zero accepted-but-discarded inputs remain in driver schemas.

## Dependencies
Phases 12/14/17 land first (adjacent status/eligibility code). Pay-rate model remains roadmap — this phase only makes the placeholder honest and bounded.
