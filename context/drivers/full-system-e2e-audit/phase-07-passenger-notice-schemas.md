# Phase 07 — Passenger Notice Schema Repairs

> **Closes:** F-NF-01, F-NF-02 (both P1) · Evidence: `08-notifications-novu-outbox.md` inventory + findings.
> **Status: ✅ CODE COMPLETE 2026-08-23** — all rulings D1–D7 executed; gates green (`turbo typecheck`+`test` 18/18 · web **422/422** incl. 9-case contract suite · biome clean on touched files). Staging probes pending: cancel → email+inApp+push received; operator delay → passengers notified; second incremental delay re-notifies in its next hour bucket.

## Objective
The two flagship passenger notices actually deliver. Plus a contract-test harness so enqueue payloads and workflow Zod schemas can never silently diverge again (the failure mode is invisible: row marked SENT at trigger acceptance).

## Rulings executed (user-ratified 2026-08-23)
D1(b) formalize refundStatus · D2(b) pass refundChannel and branch copy fully · D3(b) both delay paths move onto the outbox · D4 hourly transactionId bucketing · D5 municipality fields declared optional · D6 schemas extracted as named consts + contract harness (2 workflows now, extensible) · D7 SENT semantics documented, not changed.

- [x] Fix `passenger-trip-cancelled` payload: send `bookingReference`, unconditional numeric `refundAmountXOF` (0 when refund failed), schema-add `refundStatus` enum (+ optional `refundChannel`).
      *(Schema extracted to exported `passengerTripCancelledPayloadSchema`; template copy now branches truthfully — wallet credit vs manual CASH settlement vs failed-refund "our team will process" line replaces the unconditional "credited to your wallet" lie.)*
- [x] Fix operator-path `passenger-trip-delayed`: add `bookingReference` + `reportedBy:"OPERATOR"`; switch to hourly-bucketed transactionId like the driver path.
      *(Both delay paths now enqueue via the shared outbox helper `enqueuePassengerTripDelayed` (`outbox/commercial.ts`, type `TRIP_DELAYED`), replacing direct `novu.trigger` + `.catch(()=>{})` — gains durability, retry/backoff, dead-letter visibility, and the hourly bucket `passenger-trip-delayed-{operator|driver}-{tripId}-{bookingId}-{YYYY-MM-DDTHH}`.)*
- [x] Build a contract test pairing producer payloads against the workflow's `payloadSchema` (`features/notifications/__tests__/payload-contracts.test.ts`; wired into web test list).
      *(9 cases: 6 real-producer samples across both workflows incl. guest/CASH/failed-refund shapes + 3 audit-defect regression tripwires asserting the exact F-NF-01/F-NF-02 defect shapes can never validate again. Extending = export schema const + add a row.)*
- [x] Bonus (ratified with plan): cancelled fan-out moved INSIDE the cancel transaction (`cancel-trip-with-refunds.ts`) — closes this surface's F-PS-14 crash window; payload construction uses per-booking channel (guest WALLET→CASH fallback preserved).
- [x] D7 documented at the SENT marking site in `process.ts`: SENT = accepted-by-Novu; content validity is the contract harness's job.

## Deliberately out of scope
- Driver conflict-alert `.catch()` sites and remaining post-commit fan-outs (F-PS-14 full sweep) — separate session; pattern to copy now exists twice.
- Municipality rendering in templates (fields declared; copy unchanged).

## Acceptance criteria
Both notices render on all three channels; contract tests green; no SENT-with-parse-failure possible for these two workflows. *(Code-level ✅; channel delivery = staging probes above.)*

## Dependencies
None beyond Phase 00; precedes Phase 08/20/21 which touch the same notification tree.
