# 04 — Driver Trip Execution, Telemetry & Maps Audit

> Start Run → Live HUD → Scanner/Manifest → Complete → Telemetry pipeline → Maps → Earnings

---

## Trips Tab — **WIRED**

- `getMyTrips` junction-driven; TODAY/UPCOMING/COMPLETED windows server-side; 30s refetchInterval (Phase 12).
- **P0-1 — telemetry identity broken**: `handleStartTrip` (`trips.tsx:63-71`) calls `startBackgroundLocationTracking(driverProfileId ?? "drv_active", tripId)` and **the only call site (`trips.tsx:280`) passes no `driverProfileId`** — every background ping persists under the phantom driver `"drv_active"`. One-line fix (thread `ctx.driver.id` via trip payload or profile query), but it orphans the entire tracking stack until fixed.

## Live Trip Screen — **BROKEN in two places**

- Mapbox navigation map renders correctly in isolation (camera follow, route casing/line layers, terminal annotations, heading puck) but is **fed mock data** by `live.tsx`; Directions fetch + AsyncStorage cache + straight-line fallback are solid (`lib/mapbox.ts:31-116`).
- Speed HUD / GPS gauge / next-stop ETA are mock-driven.
- **P0-2 — "Complete Run" is a no-op**: `handleEndTrip` (`live.tsx:72-76`) only calls `stopBackgroundLocationTracking()` and flips local state. It never invokes `drivers.completeTrip`, so trips never reach ARRIVED from the app — no review-request trigger, no escrow-release eligibility, driver stranded ON_TRIP.
- Delay modal collects reason/minutes locally; `handleReportDelay` (`live.tsx:78-82`) only clears local state — **the delay is never submitted** to `reportTripDelay`.

## Scanner & Manifest — **WIRED** (offline sync missing)

- Camera barcode → `checkInPassenger` with three-state feedback (cleared / already-boarded / invalid) + haptics; backend validates signed ticket tokens and guards double boarding.
- Manual check-in by booking reference works from the manifest screen with tap-to-call.
- **MISSING capability**: `batchSyncCheckIns` exists server-side for rural network drops but **no UI ever queues scans offline or flushes them** — a scanner dead-zone silently fails check-ins.

## Telemetry Pipeline — **BROKEN at both ends**

Client:
- Background task via expo-task-manager with adaptive intervals (5s moving / 30s stationary); overspeed (>110 km/h) and harsh-braking (≥25 km/h drop ≤3s) detected on-device and included in the WS payload (`telemetry.ts:141-146,179-189`) ✓
- **P0-1**: identity always `"drv_active"` (above).
- Offline queue (AsyncStorage, cap ~500) + HTTP fallback exist and flush on reconnect.

Server:
- Validation gates correct on both paths (geo bounds / ≤50 m accuracy / ≤200 km/h / haversine jump ≤220 km/h) — `telemetry-validator.ts`.
- Phase-13 normalization solid: overspeed recomputed server-side from `speedKmh`, mapped reasons, daily-capped score decrements inside one transaction, buffer restore on DB failure (`telemetry-flush.ts`).
- **Auth hole**: the WS gateway performs **zero upgrade-handshake validation** — `driverId`/`companyId`/`tripId` trusted from query params; the HTTP ingest route accepts arbitrary driver IDs unauthenticated. GPS spoofing → safety-score poisoning until closed (P0-grade security).
- **Deployment gap**: the gateway runs only under manual `tsx server.ts`; Vercel can't host it and the Dockerfile's Next standalone build excludes it — real-time tracking is dev-only today; production would run on the unauthenticated HTTP fallback alone.
- Serverless hazard: module-level buffer + timer flush can lose pings when the HTTP route's invocation ends before flush.

## Maps Configuration

- Both apps use `@rnmapbox/maps` dark-v11 with plugin config; token via `EXPO_PUBLIC_MAPBOX_TOKEN` with a silent dummy-token fallback (mobile apps ship **no `.env.example`**, P3).
- Traveler tracking screen exists but is a simulation — see [05](05-passenger-journey-tracking-reviews.md).

## Earnings & Shifts — **WIRED mechanics, placeholder math**

- Shift ledger: open/close with elapsed minutes, company binding, latest-open lookup (`drivers.ts:1362-1448`) — sound.
- `getMyEarnings` multiplies shift minutes by a **hardcoded ×50 XOF/min** ("Standard XOF compensation formula", `drivers.ts:1473-1474`). There is no pay-rate source anywhere; earnings figures are cosmetic until a rate model exists (operator-set per-affiliation rate or platform minimum wage table).
- ⚠️ Two raw `<div>` elements crash this very screen on Android (**P0-5**, `earnings.tsx:89,96`).

## Urgent Dispatch — **WIRED** (with scope note)

- `UrgentDispatchGate` polls `getMyUrgentDispatches` every 60s (departs <2h, PRIMARY/RELIEF roles — CONDUCTOR intentionally excluded); AsyncStorage per-trip acks prevent re-fire; full-screen modal with countdown, haptics/audio.
- Decline/auto-timeout is client-side dismissal only — no server action, by design (assignment authority stays with the operator).
- Deep-links wired in NotificationHandler for `trip-assigned`/`trip-unassigned` types.
