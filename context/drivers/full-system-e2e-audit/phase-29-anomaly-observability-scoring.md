# Phase 29 — Anomaly Observability & Scoring Semantics

> **Closes:** F-TM-13 (P3), F-TM-14 (P3), F-TM-18 (P3) · Evidence: `05-telemetry-and-maps.md`.
> Zero structured ingest logging (code-standards requires driverId/tripId/accuracy/deltaSeconds metadata); accuracy gate drops pings entirely so urban-canyon stretches vanish and zero-ping trips count "clean" (`telemetry-validator.ts:62-67`, reconcile `route.ts:131-136`); reconcile edge cases — full-route km for RELIEF/partial assignments (`:85-99`), dead `totalPenaltyByDriver`, unlocked prior-penalty read (`telemetry-flush.ts:105-120`).

## Objective
Every anomaly decision leaves a forensic trail; history stays complete without polluting scores; stats math matches operational reality.

## Tasks
- [ ] Structured log (or OTel span via existing instrumentation) per rejected/anomalous batch with driverId, tripId, accuracy, deltaSeconds, reason.
- [ ] Persist >50 m-accuracy pings flagged `isAnomaly=true, anomalyReason="LOW_ACCURACY"` (unscored — penalty map default 0); exclude from last-position/ETA updates; reconcile's clean-trip rule becomes "has ≥1 ping AND zero penalized anomalies".
- [ ] Reconcile: scale distance by assignment segment fraction when startStopOrder/endStopOrder set; delete dead variable; serialize intraday prior-penalty read (row lock or daily-counter table).
- [ ] Render client telemetry health (`getActiveTelemetryHealth`) on the profile tab while touching this area.

## Acceptance criteria
Disputes answerable from logs; urban runs keep continuous history with correct scoring; distance credits match segments driven.

## Dependencies
Phase 10/11 (client+gateway behavior settled). Reconcile changes must re-run against staging data before/after to show deltas.
