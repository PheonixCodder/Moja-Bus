# 05 — Real-Time Telemetry Pipeline + Mapbox Usage Audit

> **Audit date:** 2026-08-22 · **Method:** full read of `apps/web/server/*`, ingest routes, scoring, crons, Docker/compose/Caddy/vercel configs, both mobile telemetry/mapbox libs and map consumers, web map views; repo-wide greps for subscribers/tokens/tokens-mint callers. Every claim cites `file:line`.
> **Scope:** producer (driver app) → WS gateway → HTTP fallback → validation → Redis → persistence → scoring → nightly reconcile → consumers (operator map, traveler tracking, driver HUD) + Mapbox usage on every surface.

---

## Flow traces

### 1. WS ingest (gateway path — code-complete, deployment-orphaned)

1. Driver taps "Start Run" → `drivers.startTrip` (`apps/web/trpc/routers/drivers.ts:1422-1486`). Assignment checked against `ctx.driver.id` (session-derived via `driverProcedure`, `trpc/init.ts:245-296`: better-auth session → `driverProfile.findUnique({ where: { userId } })`). On success returns `{ driverProfileId, telemetryToken: mintTelemetryDispatchToken(ctx.driver.id, input.tripId) }` (`drivers.ts:1479-1485`).
2. Token = stateless HMAC: `base64url({d, t?, exp}).base64url(sig)`, TTL **24 h**, secret = `TELEMETRY_TOKEN_SECRET` ?? `BETTER_AUTH_SECRET` (`lib/telemetry-token.ts:15-57`). Verification is local: length check + `timingSafeEqual` + exp check (`telemetry-token.ts:59-92`). **No server-side token→session mapping exists — identity is whatever is inside the signed claims.**
3. Client stores it: `setTelemetryAuthToken(res.telemetryToken)` then `startBackgroundLocationTracking(res.driverProfileId, tripId)` (`apps/driver-app/app/(tabs)/trips.tsx:73-75`). Token persisted to AsyncStorage (`driver_telemetry_auth_token`, `telemetry.ts:29-44`) so background-task restarts survive.
4. `connectTelemetrySocket` opens `EXPO_PUBLIC_WS_URL?driverId=X&tripId=Y&token=Z` (default `ws://localhost:3000/api/ws/telemetry`, `telemetry.ts:9-10, 95-99`).
5. Upgrade: `server.ts:18-28` routes `/api/ws/telemetry` and `/api/ws` to `telemetryGateway.handleUpgrade`. Under enforcement (`isTelemetryAuthEnforced()` = secret set **or** `NODE_ENV=production`, `telemetry-token.ts:25-27`) the token is verified **before** handshake; failure → raw `HTTP/1.1 401 Unauthorized` written to the socket and destroyed (`telemetry-ws.ts:107-116`). Success → `connection` handler re-verifies; still-invalid → `ws.close(4401, "Unauthorized")` (`telemetry-ws.ts:51-59`). **The dispatch token is REQUIRED whenever a secret exists — i.e., always in production, even if `TELEMETRY_TOKEN_SECRET` is unset (BETTER_AUTH_SECRET fallback).** Dev with no secrets fails open (query `driverId`/`companyId` trusted, `telemetry-ws.ts:62-65`).
6. Identity/room binding comes only from signed claims: `driverProfileId = claims.d`, room `trip:${claims.t ?? query.tripId}` (`telemetry-ws.ts:60-71`). A `company:{id}` room is joined **only** in the non-enforced dev path from query params — under enforcement `ws.companyId` is never set (→ F-TM-02).
7. Frames `{event:"telemetry:ping", data}` → `driverLocationPingSchema.safeParse` (cuid ids, lat/lon bounds, speedKmh 0–250, accuracy ≥0, `recordedAt` coerced date; `isOverspeed` accepted for schema compat only). Spoofed `driverProfileId` → `telemetry:rejected IDENTITY_MISMATCH`; wrong/missing tripId → `TRIP_MISMATCH` / silently stamped from claims (`telemetry-ws.ts:175-187`).
8. `validateTelemetryPing(parsed, ws.lastPing)` — cross-frame jump gate per connection. Fail → `telemetry:anomalous {reason}` and **drop** (`telemetry-ws.ts:190-194`). Pass → queue + broadcast `telemetry:update` to `trip:{id}` room + `redisPub.publish('trip:{id}:telemetry')`; company room + `operator:{companyId}:fleet` publish **only if `ws.companyId` set** (`telemetry-ws.ts:221-229` → dead under enforcement). Ack `telemetry:ack` sent.
9. Heartbeat ping/pong every 30 s, dead sockets terminated (`telemetry-ws.ts:90-100`). Client reconnects after 5 s on close (`telemetry.ts:116-127`).

### 2. HTTP ingest (the only path that can actually run in prod today)

1. `POST /api/v1/telemetry/ping`. Enforcement → `Authorization: Bearer <token>` parsed (`route.ts:21-25`); invalid/missing → `{success:false,error:"Unauthorized"}` **401** (`route.ts:26-31`). No-auth accepted in dev-no-secret mode only.
2. Body: single ping or `{pings:[...]}` — `z.array(driverLocationPingSchema).min(1).max(100)` (`route.ts:12-14, 37-39`). >100 pings → ZodError → 400.
3. Per ping: `driverProfileId !== claims.d` or tripId mismatch → counted `unauthorized` (dropped, not persisted); claims.t stamps missing tripId (`route.ts:48-60`). **Arbitrary driver IDs are rejected, not rewritten.**
4. `validateTelemetryPing(ping)` — **no previous-ping argument** → Gate 4 (haversine jump) never runs on this path (`route.ts:62`). Invalid → `rejected++`, dropped.
5. Accepted pings → `persistPingBatch` **directly, synchronously** (`route.ts:75-84`). DB failure → 503 "Persistence unavailable" so the driver app keeps its offline queue. Success → per-ping `redisPub.publish('trip:{id}:telemetry')` (`route.ts:86-104`; no operator channel — companyId unknown here). Response `{processed, persisted, rejected, unauthorized}`.

### 3. Persistence + intraday scoring (`server/telemetry-flush.ts`)

1. WS path buffers into module-level `PING_BUFFER`; flush at ≥50 pings or 5 s timer (`telemetry-flush.ts:17-38`). HTTP path bypasses the buffer entirely (P2-11 fix landed).
2. `persistPingBatch`: per ping `derivePingAnomaly` — **overspeed recomputed server-side** as `speedKmh > 110` (client `isOverspeed` ignored, `lib/driver-scoring.ts:61-71`); harsh braking trusted from client flag. Mapped reasons: `OVERSPEED` (−5), `HARSH_BRAKING` (−10), everything else informational (`driver-scoring.ts:30-40`).
3. Single `$transaction`: (a) pre-insert snapshot of today's anomaly rows per affected driver to compute prior penalty (UTC start-of-day, `telemetry-flush.ts:93-120`); (b) `createMany` into `driver_location_ping` (**no battery columns anywhere**, schema.prisma:2375-2398); (c) per-driver `UPDATE "driver_profile" SET "safetyScore" = GREATEST(0, "safetyScore" - N)` with `allowance = max(0, 20 − priorPenalty)` — the −20/day UTC cap holds across batches (`telemetry-flush.ts:128-141`).
4. Outside the tx: latest ping per driver → `driverProfile.last{Latitude,Longitude,Heading,SpeedKmh}, lastPingAt` update + `redisPub.hset('driver:{id}:live', {...})` (`telemetry-flush.ts:144-171`). **No TTL is ever set; nothing in the repo ever reads this hash** (F-TM-08).
5. Buffer flush failure → batch restored to front of buffer (long-lived-process assumption, `telemetry-flush.ts:181-193`).

### 4. Nightly reconcile (`app/api/cron/reconcile-driver-stats/route.ts`, scheduled 02:30)

1. `assertCronAuthorized` — Bearer `CRON_SECRET`, fail-closed in prod.
2. Penalties: raw SQL sums per driver and per `date_trunc('day', recordedAt)` over `isAnomaly AND reason IN ('OVERSPEED','HARSH_BRAKING')`; lifetime = Σ min(20, per-day) (`route.ts:33-81`).
3. Distance: `Σ route.distanceKm` over `trip_driver_assignment ⋈ trip (ARRIVED) ⋈ schedule ⋈ route` (`route.ts:85-99`) — **full-route km credited per assignment**, so RELIEF/partial-segment assignments overcount (F-TM-18).
4. Ratings: `AVG(driverRating), COUNT(*)` over reviews where both non-null (`route.ts:102-121`) — overall/bus/punctuality excluded by design.
5. Clean streak: ARRIVED trips ordered desc; a trip is "dirty" if ANY anomaly ping exists for it; streak stops at first dirty; credit `floor(streak/10) × 1` (`route.ts:124-157`). **Trips with zero pings count as clean** — pre-telemetry history inflates credit.
6. Update: `averageRating = avg ?? existing ?? 5.0`, `totalReviews`, `totalDistanceKm`, `safetyScore = clamp(100 − lifetimePenalty + credit, 0, 100)` (`route.ts:174-195`). Drivers absent from all four maps are **untouched** — curated legacy values survive.

### 5. Consumption — who renders live positions today

- Repo-wide grep for subscribers of `trip:{id}:telemetry` / `operator:{companyId}:fleet`: **zero subscribers**. `redisSub` is provisioned and never used; documented deliberately in `server/telemetry-redis.ts:3-13`.
- `getLivePositions` callers: exactly one — `features/operator/views/operator-fleet-map-view.tsx:26-29`, tRPC query polled every 10 s. Reads `driverProfile.last*` columns for `ON_TRIP/ON_DUTY` drivers with non-null coords (`drivers.ts:827-867`), company-scoped via `operatorCompanyProcedure` + `requirePermission("drivers:read")`.
- The operator "Live Fleet Telemetry Map" renders **no real map**: right pane is a CSS radial-dot grid explicitly commented "Simulated Dark Geo Map Grid" with a rotating radar pin and lat/lng printed as text (`operator-fleet-map-view.tsx:137-192`). No WS subscription anywhere in `apps/web`.
- Traveler tracking screen is an honest status card ("Le suivi en direct arrive bientôt") showing the passed reference — no map, no simulation (`app/tracking/[tripId].tsx:6-61`).
- Web passenger surfaces: static Leaflet/OSM route previews only (`route-map-preview.tsx` via `booking-route-map.tsx`) — no live positions, no Mapbox on web at all.

### 6. Traveler "Track Live Bus" entry (remediation 18.4 state)

- Button in `features/booking/screens/booking-detail.tsx:421-434` is wrapped in `process.env["EXPO_PUBLIC_LIVE_TRACKING_ENABLED"] === "true"`. `.env.example:15-17` ships it `false` with the comment "Set to true only after the WS consumer ships". **Hidden by default — remediated.**
- Latent bug preserved behind the flag: it pushes `/tracking/${booking.seats?.[0]?.bookingId || bookingReference}` — a **bookingId, not tripId** (`:428`). Flipping the flag without fixing this resurrects the wrong-ID bug (F-TM-15).
- Tickets/bookings tabs: no tracking links. The old simulation component (`traveler-tracking-map.tsx`) still exists with full Mapbox rendering but **no screen imports it** (orphaned).

---

## Verified-working strengths

1. **Ingest authenticated on both paths, before any state mutation** — upgrade-time rejection (`telemetry-ws.ts:107-116`), 401 on HTTP (`route.ts:26-31`), identity enforced from HMAC claims with `timingSafeEqual` and expiry (`telemetry-token.ts:71-88`). Spoofed `driverProfileId`/`tripId` rejected, not rewritten, on both paths. Production without any secret rejects everything (fail-closed) so misconfiguration is loud.
2. **Token minting is authorization-checked**: both `startTrip` and `getTelemetryToken` verify the `tripDriverAssignment` for the session's own driver id before minting (`drivers.ts:1425-1437, 1503-1515`); transition guard prevents restarting ARRIVED/CANCELLED runs (`drivers.ts:1450-1457`).
3. **Server-authoritative anomaly normalization** — overspeed recomputed from `speedKmh`; client flag never trusted for it (`driver-scoring.ts:61-71`).
4. **Daily-capped penalty ledger inside one transaction**, pre-insert snapshot so the −20/day cap holds across batches without double-counting (`telemetry-flush.ts:90-141`).
5. **HTTP path is serverless-safe**: direct synchronous persist, 503 on DB failure so the client's offline queue retains pings (`route.ts:71-84`) — P2-11 genuinely fixed.
6. **Validator shared and strict**: bounds / 50 m accuracy / 200 km/h / 220 km/h haversine jump with correct great-circle math and `max(1, elapsed)` guard (`telemetry-validator.ts:43-109`).
7. **Client offline queue** with 500-cap, Bearer-attached batch flush on WS open, correct 401 semantics (token cleared → next Start Run re-mints; 400/503 keep queue intact) (`telemetry.ts:255-262, 275-277`).
8. **Honest consumer UX**: traveler tracking de-simulated and flag-gated off; driver live screen comments acknowledge simulated HUD (`live.tsx:96`).
9. **Fanout gap documented, not hidden** (`telemetry-redis.ts:3-13`).
10. **Phantom battery columns gone** from schema.
11. **Reconcile cron auth-guarded, idempotent, self-healing**, history-free drivers untouched.
12. **Permissions surface complete for the producer**: iOS `UIBackgroundModes:["location",...]` + usage strings, Android `ACCESS_BACKGROUND_LOCATION` + `FOREGROUND_SERVICE(_LOCATION)` + `WAKE_LOCK`, `showsBackgroundLocationIndicator: true`, FG-service notification config; traveler app correctly has **no** location permissions (consumer-only).
13. **ioredis object-form `hset` verified valid** against built source — the `driver:{id}:live` write works on real Redis, not just the mock.

---

## Findings

| ID | Sev | Finding | Evidence | Fix sketch |
|---|---|---|---|---|
| **F-TM-01** | **P1** | WS gateway hosted by NO production artifact — Dockerfile runs Next standalone (`CMD ["node","apps/web/server.js"]`, Dockerfile:129; standalone excludes custom `server.ts`), `dev:ws`/`start:ws` scripts never invoked by compose/vercel/Caddy chain. Every prod deploy silently runs HTTP-only ingest; ~800-line gateway + room fanout + per-connection jump gate are dead code in prod. *(Prior P1-5: NOT FIXED, mitigated)* | Dockerfile:129; apps/web/package.json:7,10; vercel.json; compose.yml:47-112 | Bundle `server.ts` into a `runner-ws` stage/image as the documented single-instance deploy target, OR officially accept HTTP-only v1 and stop client's futile reconnect loop (see F-TM-10) |
| **F-TM-02** | **P2** | Operator fleet channel never published under enforcement — `ws.companyId` set only in non-enforced dev branch (`telemetry-ws.ts:62-65`); both in-process company broadcast and `publish('operator:{companyId}:fleet')` (:226-229) skipped in prod; HTTP path has no companyId either | telemetry-ws.ts:62-65, 226-229; route.ts:86-104 | Add `c` claim at token mint (from active affiliation) or resolve once at connect |
| **F-TM-03** | **P2** | Any authenticated driver can subscribe to arbitrary rooms (`subscribe` message → `joinRoom` with zero authorization, telemetry-ws.ts:138-143) → cross-tenant live position disclosure (coords, speeds, plates) of any trip/company | telemetry-ws.ts:138-143, 242-248 | Allow only rooms implied by claims (`trip:${claims.t}`), derive company rooms server-side, reject others |
| **F-TM-04** | **P2** | Offline queue flush permanently wedges >100 pings — client posts whole queue (cap 500) but server caps batch at 100 → 400; client handles only 401/success, so a 400 retries forever on every WS open while cap-500 silently drops oldest | driver-app telemetry.ts:230, 255-268 vs route.ts:13 | Chunk flushes ≤100 client-side; trim on repeated failure |
| **F-TM-05** | **P2** | Harsh-brake detection can never fire — needs Δt ≤3 s for ≥25 km/h drop but fixes arrive ~5 s apart (`timeInterval:5000`, latest-only forwarding) | telemetry.ts:172-175, 293-299, 328-330 | Widen window to ≥ cadence (≤6 s) or compute deceleration across consecutive fixes |
| **F-TM-06** | **P2** | `getTelemetryToken` re-mint endpoint is dead code (zero client callers); with 24 h token TTL, streaming past 24 h degrades to silent 401-drops with no UI signal until next manual Start Run | drivers.ts:1492-1522; grep: no callers; telemetry-token.ts:15 | On 401 call getTelemetryToken before clearing; surface re-auth needed in health UI |
| **F-TM-11** | **P2** | Driver live screen shows simulated motion while claiming "Live Telemetry Active": fixed Abidjan start @68 km/h random-walked every 2 s drives Mapbox puck + camera + overspeed banner; ETA hardcoded "24 mins"; real background stream consumed by nothing on-screen | live.tsx:74-79, 99-109, 256-262, 313-315, 327 | `Location.watchPositionAsync` foreground subscription or render last persisted ping via lightweight query |
| F-TM-07 | P3 | Haversine jump gate is WS-only; HTTP batches not sequentially validated → teleport sequences pass on the only prod path; per-ping state resets per serverless instance | route.ts:62 vs telemetry-ws.ts:190 | Track last-ping per driver in Redis (`driver:{id}:live` already stores lat/lng) |
| F-TM-08 | P3 | Redis live-state write-only: GEOADD dead code (mock-only), `driver:{id}:live` has no TTL and no readers; reference architecture's geo index unimplemented | telemetry-redis.ts:22-26; telemetry-flush.ts:163-170 | Implement (GEOADD + EXPIRE 75 + proximity reader) or delete the write |
| F-TM-09 | P3 | Silent Redis→mock downgrade at boot after `connect()` warn; **compose.yml passes no REDIS_URL to web service at all** → Docker always runs in-memory mock | telemetry-redis.ts:74-81; compose.yml env block | Add REDIS_URL to compose; fail/retry instead of permanent mock swap |
| F-TM-10 | P3 | Client reconnect loop hammers nonexistent endpoint every 5 s indefinitely when WS unreachable in prod (default localhost URL; prod topology HTTP-only) | telemetry.ts:9-10, 116-127 | Exponential backoff w/ cap, or disable WS unless EXPO_PUBLIC_WS_URL set |
| F-TM-12 | P3 | Operator fleet view: 10 s-stale poll + CSS dot grid labeled "Simulated Dark Geo Map Grid"; "Real-time GPS tracking" copy overstates | operator-fleet-map-view.tsx:26-29, 137-192 | react-leaflet markers on lastLat/Lng; wire telemetry:update once gateway hosted |
| F-TM-13 | P3 | No structured ingest logging anywhere (accepted/rejected/anomalous never logged w/ driverId/tripId/accuracy/deltaSeconds — code-standards requirement); client `getActiveTelemetryHealth()` has zero UI consumers | server/*.ts console sites; telemetry.ts:71-73 | Structured log/OTel span per anomaly; render health on profile tab |
| F-TM-14 | P3 | Accuracy gate rejects-and-drops rather than flags-and-persists — urban-canyon stretches vanish from history/streak analytics; a zero-ping trip then counts as *clean* in reconcile | telemetry-validator.ts:62-67; route.ts:131-136 | Persist low-accuracy pings flagged `LOW_ACCURACY` unscored; exclude from ETA |
| F-TM-15 | P3 | Latent bookingId-as-tripId wiring behind tracking flag (`booking.seats[0].bookingId` pushed as tripId) | booking-detail.tsx:421-434 | Resolve real tripId server-side before enabling flag |
| F-TM-16 | P3 | Mapbox logo+attribution disabled on both mobile maps; Leaflet attributionControl=false (OSM string present on tile layer) — ToS/ODbL compliance risk before store review | driver-navigation-map.tsx:75-76; traveler-tracking-map.tsx:83-84; route-map-preview.tsx:96,100 | Re-enable compact attribution |
| F-TM-17 | P3 | Route geometry cached forever (no TTL/invalidation); straight-line fallback rendered silently with distance/duration 0; `overview=full` most expensive tier for a 256 px preview | lib/mapbox.ts both apps :37-128 | overview=simplified; TTL cache or key by route updatedAt |
| F-TM-18 | P3 | Reconcile edge cases: full-route km credited to RELIEF/partial assignments; zero-ping trips count clean; dead `totalPenaltyByDriver` var; intraday prior-penalty read unlocked (bounded overshoot, nightly-healed) | reconcile route.ts:60-64, 85-99, 131-136; telemetry-flush.ts:105-120 | Segment-fraction distance; require ≥1 ping for clean; counter table or row lock |
| F-TM-19 | P3 | `@rnmapbox/maps` JS pin ^10.3.5 vs native pin 11.18.0 — caret JS range over hard native pin must be validated by an actual EAS build before release | package.json ×2 vs app.json plugin config ×2 | Exact-pin validated pair; record in context/ |

---

## Mapbox usage matrix

| Surface | SDK | Style | Token env | Dummy-token fallback | Directions | Cache | Native pin | Missing-token UX |
|---|---|---|---|---|---|---|---|---|
| Driver app | `@rnmapbox/maps` ^10.3.5 | dark-v11 | `EXPO_PUBLIC_MAPBOX_TOKEN` | dummy string always substituted; prod `console.error` only — **P2-14 partially fixed** (loud log, not fail-hard) | driving `overview=full`, straight-line fallback | route cache only, no TTL | plugin 11.18.0 | broken tiles + Directions 401s; no UI gate on `MAPBOX_TOKEN_CONFIGURED` |
| Traveler app | `@rnmapbox/maps` ^10.3.5 | dark-v11 — **map component orphaned** (tracking screen mapless today) | same | identical to driver | same helper, `moja_traveler_route_` prefix | same, no TTL | plugin 11.18.0 | n/a while screen mapless |
| Web (operator + passenger) | **No Mapbox** — Leaflet 1.9.4 + OSM tiles, static route previews only; operator fleet view has no map at all | OSM tiles | none | n/a | none (straight polylines) | none | n/a | n/a |

---

## Prior-findings scorecard (this domain)

| Prior ID | State |
|---|---|
| P0-1 phantom `"drv_active"` | ✅ FIXED — identity threaded via startTrip response |
| P1-4 unauthenticated ingest | ✅ FIXED — HMAC dispatch token enforced both paths (fail-closed in prod) |
| P1-5 WS hosting | ❌ NOT FIXED (mitigated: HTTP fallback works, consumer UX gated) — F-TM-01 |
| P2-10 fanout relay | ⚠️ OPEN BY DESIGN — documented single-instance assumption |
| P2-11 serverless flush | ✅ FIXED — direct synchronous write on HTTP path |
| P2-14 .env.example / Mapbox dummy | 🟡 PARTIAL — examples exist; prod logs loudly but still substitutes dummy token |

**Severity roll-up:** P1×1 · P2×6 · P3×12.
