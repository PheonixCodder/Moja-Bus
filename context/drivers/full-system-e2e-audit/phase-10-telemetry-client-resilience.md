# Phase 10 — Telemetry Client Resilience

> **Closes:** F-TM-04, F-TM-05, F-TM-06 (all P2) · Evidence: `05-telemetry-and-maps.md`.
> **Status: ✅ CODE COMPLETE 2026-08-23** — executed together with Phase 09 (the flush trigger was WS-open-only; Option B would have silently broken offline draining). Gates green (`turbo typecheck`+`test` 19/19 · driver-app suite 10/10 · biome clean). Staging leg: one simulated 30-min outage with >100 queued pings drains fully; device QA on a hard-braking segment.

## Objective
The producer survives long trips and bad networks: offline backlog always drains, harsh-brake detection actually fires (and only fires on real events), token expiry self-heals without user action.

## Tasks
- [x] Chunk `flushOfflinePings` into ≤100-ping batches (`telemetry-core::chunkQueue`, server-parity with the ingest cap): sequential chunks, remainder preserved verbatim on any failure, per-chunk removal only after success. Rejected pings inside a 200 intentionally drop with their chunk (server-rejected = unfixable by retry). Cap-500 trims now log dropped counts.
- [x] Harsh braking — **D5 corrected during planning**: the audit's "widen window" fix was physically wrong (25 km/h over 6 s ≈ 1.16 m/s² = everyday bus-stop braking → fleet-wide false positives, −20/day cap reached by everyone). Shipped deceleration-severity logic instead (`telemetry-core::shouldFlagHarshBraking`):
      `drop ≥ 25 km/h (noise floor) AND drop/Δt ≥ 2.8 m/s² (industry band 2.5–3.4) AND Δt ≤ 8 s (survives one missed fix)`.
      Boundary-value unit tests encode the exact cases: real slam ✓, threshold edge ✓, bus-stop approach ✗.
- [x] On ingest 401 during an active run: call the assignment-checked re-mint once before clearing; only give up after re-mint fails. Architecturally clean via **callback injection** (`setTelemetryReauthHandler`) — `trips.tsx` registers a `queryClient.fetchQuery(trpc.drivers.getTelemetryToken)` handler at Start Run; the plain lib stays React-free/background-safe. Failure state surfaces in `TelemetryHealthState.needsReauth`. Live-ping path self-heals identically.
- [x] Unit tests: chunking math + order preservation, brake boundary matrix, backoff schedule/budget. *(Runner wired: driver-app `"test": "tsx --test"` — first mobile-package suite in turbo.)*

## Acceptance criteria
Simulated 30-min outage with >100 queued pings flushes completely *(staging leg)*; a ≥25 km/h drop that is genuinely harsh registers while routine braking does not (unit-proven); streaming continues past token expiry with no user interaction (re-mint path unit-shaped, staging leg confirms on-device).

## Dependencies
Phase 09 same-session (flush-trigger coupling). Server-side validation parity remains Phase 28's scope.
