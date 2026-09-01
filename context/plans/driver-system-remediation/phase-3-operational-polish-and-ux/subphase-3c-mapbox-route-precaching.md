# Subphase 3C: Mapbox Offline Route Geometry Pre-Caching

## 1. Problem Statement & Findings Addressed

* **Finding Addressed**: `DRV-P2-11 (Mapbox Route Pre-Caching & Dead-Zone Routing)`.
* **Current Defect**: Mapbox route directions are only requested at the moment the driver taps "Start Run". If the departure terminal has poor mobile connectivity, the live map fails to load route lines.

---

## 2. Architecture & Scope of Changes

1. When the driver views an assigned trip in `trips-view.tsx` on Wi-Fi or LTE, pre-fetch Mapbox Directions and cache the GeoJSON line in `AsyncStorage` under `mapbox_route_{tripId}`.
2. When launching `live-view.tsx`, read the cached GeoJSON immediately before attempting network requests.

---

## 3. Implementation Steps & File Checklist

- [ ] Update `apps/driver-app/lib/mapbox.ts` with `prefetchAndCacheRouteDirections(stops, tripId)`.
- [ ] Call prefetch inside `trips-view.tsx` when assigned departures load.
- [ ] Ensure `live-view.tsx` mounts immediately with cached route geometry even in airplane mode.

---

## 4. Verification & Testing Criteria

* [ ] View upcoming trip on driver app while online.
* [ ] Switch phone to Airplane Mode (Offline).
* [ ] Tap "Start Run" $\rightarrow$ verify live map immediately renders the full turn-by-turn route geometry.
