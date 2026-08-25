# Phase 30 — Mobile Map Compliance & Cache Policy

> **Closes:** F-TM-15, F-TM-16, F-TM-17, F-TM-19 · Evidence: `05-telemetry-and-maps.md` findings + Mapbox matrix.
> bookingId passed as tripId behind tracking flag (`booking-detail.tsx:421-434`); Mapbox logo/attribution disabled both apps (`driver-navigation-map.tsx:75-76`, `traveler-tracking-map.tsx:83-84`), Leaflet attributionControl false (`route-map-preview.tsx:96`); route geometry cached forever + straight-line fallback silently rendered + `overview=full` cost (`lib/mapbox.ts` both apps); JS pin ^10.3.5 vs native 11.18.0.

## Objective
Maps are store-review compliant, caches honest, and the tracking flag can be enabled later without resurrecting a known bug.

## Tasks
- [ ] Resolve the real tripId server-side (booking payload gains `tripId`) before the flag ever ships ON; update the button param.
- [ ] Re-enable compact attribution/logo on both Mapbox maps; restore Leaflet attribution control.
- [ ] Cache policy: TTL route geometry (24 h) or key by route `updatedAt`; switch preview to `overview=simplified`; render straight-line fallback with an explicit "approximate path" indicator.
- [ ] Exact-pin `@rnmapbox/maps` JS to the version validated by an actual EAS build against native 11.18.0; record the pair here and in `context/drivers/library-docs.md`.

## Acceptance criteria
EAS build renders maps correctly with pinned pair; ToS-required attribution visible; flipping `EXPO_PUBLIC_LIVE_TRACKING_ENABLED` would pass a correct tripId.

## Verification
Release EAS build (both platforms) + attribution screenshot; cache-expiry unit test.
