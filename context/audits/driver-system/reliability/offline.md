# Reliability Audit: Offline Architecture & Local Persistence

## 1. Offline Data Stores & Caching

1. **Boarding Scans**: `driver_offline_scans_queue` in `AsyncStorage`.
2. **GPS Pings**: `driver_offline_pings_queue` in `AsyncStorage` (capped at 500 fixes).
3. **Route Directions**: `mapbox_route_{tripId}` in `AsyncStorage`.
4. **Registration Draft**: `driver-registration-store` in `AsyncStorage`.

---

## 2. Identified Offline Vulnerabilities

### 2.1 Unbounded Telemetry Drop on Long Highway Dead Zones
* **Location**: `apps/driver-app/lib/telemetry-core.ts#L60-L75`.
* **Issue**: On rural highway routes through national parks with no signal for 2 hours, 1,440 pings are generated. `OFFLINE_QUEUE_CAP = 500` silently drops the oldest 940 pings, losing speed and waypoint history.
* **Fix**: Increase offline cap to 2,000 pings with disk compression or adaptive downsampling.
