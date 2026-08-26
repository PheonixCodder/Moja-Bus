# 11 — Live Fleet Telemetry Map (operator)

> Audit date: 2026-08-26 · Sources: `apps/web/app/[locale]/dashboard/operator/(dashboard)/drivers/map/page.tsx`, `features/operator/views/operator-fleet-map-view.tsx` (273 l), `features/operator/components/fleet-live-map.tsx` (136 l).

## 1. Page shell

`map/page.tsx` is a thin server wrapper: metadata ("Live Fleet Telemetry Map | Moja Operator") + `<HydrateClient><OperatorFleetMapView/></HydrateClient>`. All logic client-side.

## 2. Data feed — the single poll

`useQuery(trpc.drivers.getLivePositions.queryOptions(), { refetchInterval: 10000 })` (`operator-fleet-map-view.tsx:39-42`). That query (see 02) returns ON_TRIP/ON_DUTY, actively-affiliated drivers with non-null last coords: last lat/lng/heading/speedKmh/lastPingAt + currentTrip {id, serviceType, status, bus plate}. **No WebSocket, no SSE, no subscription** — the UI copy honestly states "refreshed every 10 seconds" (Phase 23 D2 ruling removed the streaming pretense). A local 30 s ticking clock (`now`) re-renders freshness dimming between polls; manual Refresh button.

Dead-coordinate hygiene: rows with no `lastPingAt` or ping older than 24 h are filtered from BOTH map and roster before render (`:50-56`) — dispatchers never chase ghosts.

## 3. Map rendering (`fleet-live-map.tsx`)

- react-leaflet `MapContainer`, CARTO dark basemap tiles (`dark_all`), OSM/CARTO attribution, canvas renderer, centered Abidjan `[5.3599,-4.0083]` zoom 12, dynamic `ssr:false` import (Leaflet window dependency).
- One `Marker` per vehicle via `L.divIcon`: colored dot — ON_TRIP rose `#e11d48`, ON_DUTY sky `#38bdf8`, stale zinc `#71717a` at 45% opacity; selected gets emerald ring + larger size.
- Freshness classifier `vehicleFreshness`: fresh ≤5 min / stale 5 min–24 h / dead >24 h (hidden upstream).
- Popup: name, plate, status, speed, last-ping time.

## 4. Selection HUD

Left roster list (avatar, name+status badge, plate, speed/"Stationary") synced bidirectionally with map marker clicks. For the selected driver: top HUD card (driver name, bus plate, Speed km/h in emerald, Heading° in cyan), bottom bar (last-ping time + "Driver Passport" deep link to `/dashboard/operator/drivers/[id]`). Empty state when nothing live.

## 5. What it deliberately does NOT show (verified absences)

- No route polyline of the active trip (route geometry isn't even stored — routes have waypoints as terminals only, no path geometry).
- No trip progress along stops, no per-stop ETAs, no delay overlay.
- No historical trail/playback (pings are persisted but no replay API exists).
- No clustering (fine at CI fleet sizes), no geofence/off-route alerts (overview promised them; never built — gap register).
- No urban-vs-intercity differentiation on the map beyond `serviceType` riding unused inside the payload.
- Operator fleet channel publish over WS is dormant (HTTP ingest publishes only the trip channel); when WS revives this component "swaps to push updates under the same props contract" (in-code note).

## 6. Honest assessment

For v1 this is exactly what the data supports: a 10-second-polled last-known-position board with staleness discipline and zero simulation. The Phase-23 rewrite deleted a fake radar that had been misrepresenting capability — current labeling is truthful. The ceiling is data-shape, not UI: until pings stream to consumers (WS revival) and route geometry/ETA exist, this cannot become true tracking. Everything needed server-side for revival (tokens with company claims, channels, flush parity) already ships dormant.
