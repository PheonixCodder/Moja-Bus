# 12 — Passenger Surfaces & the Live-Tracking Gap

> Audit date: 2026-08-26 · Sources: `apps/traveler-app/**`, `apps/web/app/[locale]/dashboard/(passenger)/**`, `passenger.ts`/`booking.ts`/`search.ts` routers.

## 1. What passengers see today about a trip's progress

| Signal | Where | Source |
|---|---|---|
| Trip status SCHEDULED/BOARDING/DEPARTED/ARRIVED/DELAYED/CANCELLED | booking detail/cards, tickets | `booking-read-service` / `getMyBookings` (static row values; no polling loop — refresh is pull-to-fetch/navigation) |
| `delayMinutes`, shifted departureDate, `estimatedArrival` | booking detail + TRIP_DELAYED notices | trip row updated by operator formalization or driver `reportTripDelay` |
| Delay & cancellation NOTIFICATIONS | Novu push/inbox → tap routes to booking detail (`lib/notification-routes.ts:33` passenger-trip-delayed; `_layout.tsx:163` handles `trip-delayed`) | durable outbox fan-out from delay/cancel flows |
| Review prompts post-trip | launch prompt + inbox (`getPendingReviews`) | finalizeTripArrival review-request workflow |
| Static route map with stops | booking detail (`booking-route-map`), Leaflet over terminal coords | tripStops — geometry only, no vehicle |

## 2. The live-tracking surface that EXISTS but is OFF

- Entry: confirmed bookings show **"Track Live Bus in Realtime"** button ONLY when `EXPO_PUBLIC_LIVE_TRACKING_ENABLED === "true"` (default unset ⇒ hidden) — `booking-detail.tsx:478-494`. Pushes `/tracking/{tripId}` (trip id, not booking id — F-TM-15 fix).
- Screen: `app/tracking/[tripId].tsx` is a deliberate **honest status screen** ("tracking coming soon" copy + trip ref chip). Zero simulation — Phase 18 P1-5/P2-13 ruling.
- Ready-but-unwired consumer: `features/tracking/components/traveler-tracking-map.tsx` (266 l) has **zero importers** — an orphan component awaiting the real feed (props include terminals + positions shape).
- Verified absences: no passenger query returns driver position (grep `lastLatitude|getLivePositions|telemetry` across web passenger features + `(passenger)` pages = empty; `passenger.ts` procedures are profile/bookings/reviews/wallet/refunds only); traveler-app consumes nothing from DriverLocationPing.

## 3. Why it's off (recorded decisions)

Phase 09 ratified Option B: HTTP-only telemetry v1; the WS gateway is dormant, no subscriber credentials exist for consumers, and simulated tracking was banned (P1-5) after the Phase-23 radar deletion on the operator side. The remaining work to flip passengers ON is explicitly itemized: host gateway (or add an authenticated polling endpoint), design passenger authorization (proof-of-booking for tripId), wire the orphan map component, then flag on.

## 4. Fastest honest path to passenger tracking (audit recommendation)

1. Short-term (no WS): public-ish authenticated poll `passenger.getTripTracking({tripId})` gated by holding a CONFIRMED booking on that trip; returns last* fields (+ freshness) from the same cache operators use. The tracking screen + orphan map render it at a 10 s cadence — parity with the operator map, zero new infrastructure.
2. Medium: revive WS gateway with passenger room ACL derived from a signed claim minted against a booking (mirrors dispatch-token pattern), Caddy upgrade passthrough.
3. ETA honesty rules already established (no fabricated ETAs, approximate-route chips) must carry over verbatim.

## 5. Urban vs intercity from the passenger side

Search is level-aware (city/municipality/quarter combos) and filters/snapshots `serviceType`; urban labels render as quarter-level ("Cocody – Riviera 3"), intercity as "Abidjan (Cocody)" convention; intermediate-stop boarding works via tripStops. Passengers have no explicit INTERCITY/URBAN toggle beyond place selection — serviceType is implicit in what they search (see 13).

## 6. Gaps

1. No passenger-facing delay/status POLLING even without GPS (a 60 s getMyBookings refresh would make DELAYED visible without notification).
2. Tracking button copy promises "Realtime" while the destination screen says coming-soon when flag on — acceptable while flagged off, but the string should be softened before any partial enablement.
3. Web passenger dashboard has no tracking entry point at all (mobile-only surface planned).
4. No "bus approaching my stop" proximity notification concept yet (needs ping stream + stop geofences).
