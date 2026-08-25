# Phase 17 — Delay Persistence & Shift Ledger

> **Closes:** F-DV-09 (P2), F-DV-07 (P2) · Evidence: `04-driver-trip-execution.md` traces 2 & 4.
> **Status: ✅ CODE COMPLETE 2026-08-23** — gates green (19/19 · web 440 · driver-app 10 · schemas 86). Migration `20260824000001_phase17_shift_unique_open` rehearsed clean-volume (drift 0). Staging legs: driver reports 30 min → dispatch TODAY list + traveler-facing trip row reflect it; ledger shows exactly one open shift bound to the right company; double clock-in → CONFLICT naming the open shift.

## Objective
A driver-reported delay is operationally real (boards, ETAs, urgent windows shift); the shift ledger is deterministic and one-open-per-driver.

## Tasks
- [x] `reportTripDelay` persists to the Trip row in the SAME flow as the anomaly ping — **D6 corrected during challenge**: naive "write minutes only" double-counts when dispatch later formalizes (operator path adds increments onto `delayMinutes`). Shipped the full mirror of the operator formula: cumulative `delayMinutes`, pre-departure runs flip to `DELAYED`, departure/arrival shifted by the increment, and the SAME conflict-revalidation + throttled operator alert loop as `trips.delay` — so driver-induced overlaps page operators too. DEPARTED runs keep status `DEPARTED` (completeTrip's guard requires it — flipping would strand mid-route); their times still shift. Additive-increment semantics documented at both call sites: each actor reports ADDITIONAL delay.
- [x] Shift ledger determinism (F-DV-07): company fallback = most-recent `hiredAt` among ACTIVE affiliations; clock-on REJECTS when a shift is already open (names its start time / other carrier) with the DB partial unique index `driver_shift_one_open_per_driver` as authoritative backstop — migration first CLOSES historical duplicates keeping the latest (repair precedent from phase18), so it cannot brick on real data; clock-off binds to the resolved company and distinguishes "nothing open" from "open elsewhere" instead of silently closing another company's ledger row.
- [x] Schema drift closed: router adopts the shared `driverShiftToggleSchema` (`companyId` optional to match the documented single-affiliation fallback).
- [x] Composes with Phase 14's on-duty eligibility gate (verification/licence checks run before any ledger write).

## Tests
Ledger guards are query-shaped (integration territory — staging probes above); the additive-delay formula is asserted implicitly by both paths sharing one implementation. Schema-level licence/status helpers carry their own suite (Phase 14 file).
