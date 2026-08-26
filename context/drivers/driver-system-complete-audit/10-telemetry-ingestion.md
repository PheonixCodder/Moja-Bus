# 10 — Telemetry Ingestion Pipeline (GPS pings)

> Audit date: 2026-08-26 · Sources: `apps/web/server/{telemetry-ws,telemetry-flush,telemetry-prev-point,telemetry-redis,telemetry-validator}.ts`, `apps/web/app/api/v1/telemetry/ping/route.ts`, `apps/web/lib/{telemetry-token,telemetry-throttle,telemetry-observability,driver-scoring}.ts`, `apps/driver-app/lib/telemetry*.ts`.

## 1. Deployment posture (the honest one)

**v1 transport is HTTP-only.** The WS gateway exists, is fully implemented, and is DORMANT: no deploy artifact starts the custom server that hosts it and the driver app dials WS only when `EXPO_PUBLIC_WS_URL` is set (header comment, `telemetry-ws.ts:1-15`). Revival checklist recorded in-code: runner-ws image stage, Caddy upgrade passthrough, OPERATOR subscriber credentials design, env flip. Redis is pub/sub-only today (`telemetry-redis.ts`): in-memory mock is the official single-instance posture; REDIS_URL/KV_URL switches to real Redis with bounded boot retries (250/500/1000 ms) then a LOUD permanent downgrade; backend surfaces in `/api/health?full=1`. GEOADD/proximity search was deleted (write-arm removal, F-TM-08) — proximity search is roadmap.

## 2. Identity & authorization (P1-4)

- `drivers.startTrip` response carries `{driverProfileId, telemetryToken}` where the token = short-lived HMAC dispatch token minted by `mintTelemetryDispatchTokenWithCompany(driverId, {tripId, companyId})` (`drivers.ts:1774-1787`; `lib/telemetry-token.ts`). Signed claims `d` (driver), `t` (trip), `c` (company) — room ACL derives from claims, never client params (F-TM-02).
- `drivers.getTelemetryToken` re-mints for app restarts/resume runs (`drivers.ts:1790-1832`); suspended drivers cannot call it (init.ts denylist).
- Enforcement toggle `isTelemetryAuthEnforced()`: under enforcement, HTTP requires `Authorization: Bearer <token>` → 401 otherwise (`ping/route.ts:44-58`); WS verifies at upgrade (401 destroy, `telemetry-ws.ts:152-175`) and pins identity/rooms from claims. Spoofed payload ids are REJECTED not rewritten (route `:114-129`; WS `:251-279`: IDENTITY_MISMATCH / TRIP_MISMATCH).

## 3. HTTP ingest — `/api/v1/telemetry/ping` (production path)

`ping/route.ts`, POST:
1. Tier-1 IP pre-gate BEFORE auth work (fixed-window coarse reject; F-IN-15) → 429 + Retry-After.
2. Token verify (enforced mode) → claims.
3. Tier-2 per-driver ceiling keyed on VERIFIED identity (not IP — NAT fairness; ~12/min cadence assumption, drain bursts ≤5 posts) → 429.
4. Body: single ping or `{pings: [1..100]}` batch (offline drain).
5. Per ping: claim identity checks → `validateTelemetryPing(ping, previousFor(driver))` → accept/reject counters.
6. Accepted batch persisted SYNCHRONOUSLY via `persistPingBatch` (serverless-safe, P2-11); DB failure → 503 so the app keeps its offline queue.
7. Per accepted trip-ping: Redis publish to `trip:{tripId}:telemetry` ONLY (operator fleet channel intentionally WS-scoped — per-ping company lookup would sit on the hot path; tokens already carry `c` for revisit).

## 4. Validation gates (`telemetry-validator.ts`)

Rejects ONLY physically-impossible signals (Phase 28 contract change):
- Gate 1: global lat/lng bounds.
- Gate 2: instantaneous `speedKmh > 200`.
- Gate 3: Haversine jump velocity vs previous GOOD reference > 220 km/h ("teleportation filter").
Poor accuracy NO LONGER rejects: it is stamped LOW_ACCURACY downstream, persisted unscored, excluded from last-position and reference candidacy (urban-canyon history survives).

Reference-point rule (anti-evasion, `telemetry-prev-point.ts`): every ping jump-checks against the last good reference, but only fixes with `accuracyMeters ≤ MAX_PING_ACCURACY_METERS` may BECOME references — faking poor accuracy cannot slip a teleport past the gate. Store of truth = `DriverProfile.last*` columns; HTTP reads through once per batch and chains in-batch; WS seeds its connection cache at connect.

## 5. Persistence & scoring (`telemetry-flush.ts`)

`persistPingBatch(pings)` in ONE transaction:
1. Classify anomalies via `derivePingAnomaly` (single authority, F-TM-14): LOW_ACCURACY precedence over overspeed; overspeed recomputed SERVER-side from speedKmh; harsh braking from the client detector (deceleration-severity rule: ≥25 km/h AND ≥2.8 m/s² AND Δt≤8 s — Phase 10 D5 correction).
2. Penalty budget: affected driver rows locked `FOR UPDATE` in sorted-id order (deadlock hygiene, F-TM-18); prior same-day OVERSPEED/HARSH_BRAKING penalties summed; allowance = −20/day cap minus prior; applicable penalty applied via GREATEST(0, score−Δ).
   Penalties (driver-scoring): overspeed −5, harsh braking −10.
3. Bulk `createMany` (LOW_ACCURACY rows included for history completeness).
4. Post-tx: structured observability line `telemetry_anomalies_stamped` (disputes answerable from logs).
5. Last-position updates OUTSIDE the tx for good-reference fixes only: newest fix per driver → `lastLatitude/Longitude/Heading/SpeedKmh/PingAt`.

WS path additionally buffers via `queueTelemetryPing` (batch 50 / flush 5 s, restore-on-failure) — safe because the gateway host is long-lived; HTTP bypasses the buffer entirely.

WS accepted frames broadcast `telemetry:update` to `trip:{t}` room + `company:{c}` room + Redis channels `trip:{t}:telemetry`, `operator:{c}:fleet`.

## 6. Client side (`apps/driver-app/lib/telemetry.ts` + `telemetry-core.ts`)

Details in the driver-app module (14), summary here: expo-location foreground/background task, adaptive cadence, offline AsyncStorage queue drained ≤100/batch with remainder preserved, 401 self-heal re-mint, WS attempted only when `EXPO_PUBLIC_WS_URL` set with 5×exp-backoff per segment, health flag `needsReauth`. Zombie-telemetry stop on SUSPENDED (Phase 06).

## 7. Consumers TODAY

- `drivers.getLivePositions` (operator fleet map, 10 s poll) ← `DriverProfile.last*`.
- `getDriverAnalytics` anomaly lists ← flagged pings.
- Nightly `reconcile-driver-stats` recomputes distance/safety aggregates from pings (segment-fair city-chain ratio × road km).
- Passenger surfaces consume NOTHING from this pipeline yet (see 12-passenger-tracking).

## 8. Gaps (detail in 17-gap-register.md)

1. No consumer subscribes to the pub/sub channels; real-time fan-out is dead code until the WS revival ships an operator/passenger subscriber credential design.
2. No ETA/ETA-engine anywhere; no route-adherence/off-route detection despite overview promises.
3. No ping retention/TTL job — table grows unbounded (~12×60×8 ≈ 5.8k rows/driver-day worst case while streaming).
4. HTTP path publishes trip channel per accepted ping even though zero subscribers exist (cheap but pointless until revival; fine).
5. `tripsCompleted` on shifts never incremented by completion flow (shift stats lag; reconcile covers driver-level totals only).
