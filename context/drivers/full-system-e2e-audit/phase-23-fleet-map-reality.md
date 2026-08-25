# Phase 23 — Fleet Map Reality

> **Closes:** F-OP-01 (P2), F-TM-12 (P3) · Evidence: `02-operator-admin-lifecycle.md` F-OP-01; `05-telemetry-and-maps.md` F-TM-12.
> **Status: ✅ CODE COMPLETE 2026-08-23** — Option A executed as a POLL-FED real map (WS stays dormant per Phase 09-B; the audit's conditional "wire telemetry:update only if hosted AND Phase 11 landed" resolves to keep the 10 s poll with honest labeling). Gates green (19/19 · web 447 · driver-app 10 · schemas 86 · biome clean). Staging leg: dispatcher sees buses at correct Abidjan coordinates on the testing server.

## Objective
Dispatchers can geographically locate their active buses on a real map — no simulated visuals on an operational surface.

## Tasks
- [x] Simulated radar grid DELETED from `operator-fleet-map-view.tsx`; header copy now states "refreshed every 10 seconds" instead of implying streaming.
- [x] New `components/fleet-live-map.tsx`: react-leaflet MapContainer, CARTO dark tiles (attribution intact), one marker per ON_TRIP/ON_DUTY driver with coordinates, popup = name · plate · status · speed · last-ping time. Consumed via `dynamic(..., { ssr: false })` following the in-house admin-route-drawer pattern.
- [x] **Three-state freshness (D2 corrected during challenge)**: fresh ≤5 min (full color: rose=ON_TRIP, sky=ON_DUTY) · stale 5 min–24 h (grey, dimmed) · **>24 h hidden entirely** — a dead coordinate row is not live fleet, and hiding beats the ghost-marker class Phase 06 removed from data. Roster list shares the same filter so counts never disagree with pins.
- [x] Selected vehicle: roster click + marker click both select; HUD bar shows plate/speed/heading/last-ping + passport link.
- [ ] WS-consumption upgrade remains revival-gated (Phase 09/11) — the map component is the swap point.

## Acceptance criteria
No simulated geo visuals remain ✓ (radar deleted); dispatchers can geographically locate buses ✓ via poll-fed markers *(staging leg pending)*.
