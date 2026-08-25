# Phase 12 — Driver HUD Ground Truth

> **Closes:** F-TM-11 (P2) · Evidence: `05-telemetry-and-maps.md` F-TM-11; `live.tsx:74-79/:99-109/:256-262/:313-315/:327`.
> Simulated random-walk speed/heading drives puck, camera and overspeed banner while labeled "Live Telemetry Active"; ETA hardcoded "24 mins"; "5s Dynamic" static despite fixed intervals.

## Objective
The live screen shows what the sensors say. No simulated motion anywhere on an operational surface.

## Tasks
- [ ] Foreground subscription: `Location.watchPositionAsync` (high accuracy) feeding `currentLocation` state while the screen is mounted (background task continues independently).
- [ ] Overspeed banner + speedometer read the real stream; heading drives puck rotation.
- [ ] Replace hardcoded ETA: derive from Mapbox Directions `durationSeconds` (already fetched w/ traffic-less estimate) to next stop, or show "—" when unknown. Never fabricate minutes.
- [ ] Adaptive-mode label reflects reality until Phase 10/28 implement true adaptive intervals (either label "Fixed 5 s" honestly or implement switching — pick honest label now).
- [ ] Remove the simulation interval entirely.

## Acceptance criteria
Phone on a desk shows ~0 km/h; walking shows walking pace; no random-walk code remains in the file.

## Verification
Manual device QA on a real drive segment + code grep (no `Math.random()` in live.tsx).
