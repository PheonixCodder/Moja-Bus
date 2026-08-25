# Phase 28 — Telemetry State & Validation Parity

> **Closes:** F-TM-07, F-TM-08, F-TM-09 · Evidence: `05-telemetry-and-maps.md`.
> Haversine jump gate is WS-only (`route.ts:62` vs `telemetry-ws.ts:190`) so teleport sequences pass over HTTP — the only prod path; Redis live-state write-only: GEOADD dead code, no TTL, no readers (`telemetry-redis.ts`, `telemetry-flush.ts:163-170`); silent mock downgrade at boot (`:74-81`) and compose passes NO REDIS_URL at all.

## Objective
Both ingest paths enforce identical validation, and the Redis layer either does its documented job or stops pretending.

## Tasks
- [ ] Shared jump gate: use `driver:{id}:live` hash (or a small last-ping record) as previous point for HTTP batches; chain pings within a batch sequentially.
- [ ] Decide Redis live-state fate: implement (GEOADD + EXPIRE 75 s + reader used by proximity/last-position lookups) or delete the write. Recommend implementing minimal TTL'd hash now — it's also the Phase-29 jump-gate store.
- [ ] compose.yml passes `REDIS_URL` to the web service; boot behavior: retry with backoff instead of permanent silent mock swap; loud startup banner stating active backend (redis|memory).
- [ ] Tests: teleport batch over HTTP rejected; TTL present; boot banner assertions.

## Acceptance criteria
Identical validation outcomes for identical ping sequences regardless of transport; Redis story explicit in code and deployment.

## Dependencies
Phase 09 (hosting posture). Coordinates with Phase 37 (REDIS_URL env documentation lands there or here — avoid double-touching compose).
