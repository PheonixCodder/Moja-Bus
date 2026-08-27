# Mapbox & Telemetry — Moja Ride Integration Guide

**Services**: Mapbox GL (web), Leaflet + OpenStreetMap CARTO tiles (web fleet map), React Native Maps (mobile), Custom Telemetry Ingest Server (GPS pings)

---

## 1. Architecture Overview

```
Driver App (GPS) ──HTTP POST──▶ /api/v1/telemetry/ping  (apps/web/server/telemetry-ws.ts)
                                         │
                              Validate JWT token (driver claim)
                                         │
                              Persist LocationPing to DB + Redis pub/sub
                                         │
Operator Fleet Map (web) ─── Polls /trpc/fleet.getLiveLocations every 30s
```

---

## 2. Telemetry Token Authentication

Driver app GPS pings are authenticated with a **short-lived JWT** — distinct from Better Auth sessions.

- Minted via `mintTelemetryToken({ userId, companyId, tripId })` server-side.
- Token carries `{ u: userId, c: companyId, t: tripId }` claims.
- Tokens are refreshed automatically when the driver starts a trip (re-minted in `startTrip` procedure).
- Client re-mint is triggered by a 401 response via `setTelemetryReauthHandler`.

---

## 3. Web Fleet Map (Leaflet)

The operator fleet map (`apps/web/features/fleet/components/fleet-live-map.tsx`) uses:
- **CARTO Dark Matter tile set** — Do NOT use raw OSM tiles (attribution rules + no CORS guarantee).
- Driver markers use a 3-tier freshness display:
  - **Fresh** (≤5 min): Full opacity marker.
  - **Dimmed** (≤24h): Reduced opacity.
  - **Hidden** (>24h): Removed from map.
- Map component is SSR-disabled (`dynamic(() => import(...), { ssr: false })`).

---

## 4. Mobile Map (Driver App)

Driver app live trip HUD shows real GPS position via `expo-location`:
- Uses `Location.watchPositionAsync` with `accuracy: Location.Accuracy.High`.
- Pings are flushed in batches of ≤100 per HTTP call.
- GPS simulator (`LocationSimulator`) is deleted — HUD shows "—" until first real GPS fix.

---

## 5. Traveler Tracking Map

`apps/traveler-app/features/tracking/components/traveler-tracking-map.tsx` — Passenger-facing live bus position tracker:
- Polls `passenger.getTripTracking` via tRPC every 30s.
- Requires booking must be in CONFIRMED or BOARDING state.

---

## 6. Key Invariants
- Do NOT expose driver GPS coordinates without an authenticated operator or passenger with an active booking on that trip.
- Map attribution (`attributionControl: true`) must remain enabled on all Leaflet instances to comply with OSM & CARTO licensing.
- `DriverLocationPing` records have no retention job yet — this is a known P3 gap.
