# Driver Operations Domain — Comprehensive Gap Register

This register catalogs all **48 findings** identified across the Moja Ride Driver Operations Domain, ranked strictly by severity tier (`P0` through `P4`).

---

## 1. Blocker Issues (P0 Findings)

| Finding ID | Title & Core Defect | Category | Affected Subsystem | Files & APIs | Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`DRV-P0-01`** | **Conductor Pre-Trip Boarding Deadlock**<br/>Mobile app locks camera scanner and manifest boarding behind active run status (`Trip.status === "DEPARTED"`), preventing conductors from scanning tickets at terminal gates before departure. | `WORKFLOW` / `UX` | Boarding & Conductors | `apps/driver-app/features/trips/screens/trips-view.tsx`, `apps/web/features/driver/services/driver-check-in-service.ts` | Conductors cannot board passengers at the gate prior to scheduled departure. |
| **`DRV-P0-02`** | **High-Frequency Telemetry Row-Lock Contention**<br/>`persistPingBatch` acquires Postgres row-level locks on `driver_profile` on every 5-second GPS batch, creating transaction pool exhaustion under 500+ active buses. | `PERFORMANCE` / `CONCURRENCY` | Telemetry & GPS | `apps/web/server/telemetry-flush.ts#L105-L135`, `apps/web/app/api/v1/telemetry/ping/route.ts` | Database connection pool exhaustion and API timeouts on high-frequency tracking. |
| **`DRV-P0-03`** | **Clock Skew Lockout on Urgent Dispatch Acknowledgment**<br/>Mobile urgent dispatch gate calculates 2-hour window using device-local `new Date().getTime()`. Skew $>10$m suppresses acknowledgment mutation and locks drivers out of trip views. | `BUG` / `RELIABILITY` | Dispatch & Mobile | `apps/driver-app/features/dispatch/components/urgent-dispatch-modal.tsx#L45-L60`, `UrgentDispatchGate.tsx` | Drivers on uncalibrated Android devices cannot acknowledge or open urgent runs. |
| **`DRV-P0-04`** | **Missing Physical Relief Driver Handover Protocol**<br/>No runtime tRPC mutation or mobile UI exists for a relief driver to take over active driving control mid-trip, leaving relief drivers in perpetual standby. | `MISSING` / `WORKFLOW` | Crew & Reliefs | `apps/web/trpc/routers/drivers.ts`, `apps/driver-app/features/live/screens/live-view.tsx` | Relief drivers cannot legally switch to primary driving control during long-haul runs. |

---

## 2. Critical Issues (P1 Findings)

| Finding ID | Title & Core Defect | Category | Affected Subsystem | Files & APIs | Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`DRV-P1-01`** | **Zero-Ping Completed Trips Exploit in Safety Streak Algorithm**<br/>Nightly stats reconcile cron awards clean streak recovery points (+1 pt / 10 clean trips) without validating if telemetry was active, allowing drivers to disable GPS to farm perfect safety scores. | `LOGIC` / `SECURITY` | Safety Scoring | `apps/web/lib/telemetry-reconcile.ts#L180-L215`, `apps/web/lib/driver-scoring.ts` | Safety score system can be gamed by turning off GPS tracking. |
| **`DRV-P1-02`** | **Stale Offline Boarding Overwrite on Concurrent Crew Scans**<br/>If two crew members scan the same passenger ticket while offline and sync at different times, the second sync overwrites the first `boardedAt` timestamp without a concurrency conflict check. | `DATA INTEGRITY` | Boarding & Offline | `apps/web/features/driver/services/driver-check-in-service.ts#L150-L195` | Audit timestamps corrupted during concurrent offline boarding flushes. |
| **`DRV-P1-03`** | **In-Flight Run Clock-Out Race via Multiple Device Sessions**<br/>`drivers.toggleShift(onDuty: false)` checks `driver.currentTripId === null`, but does not acquire a `FOR UPDATE` lock on `DriverProfile`, allowing concurrent requests to close shifts while a trip start is committing. | `CONCURRENCY` | Shifts & Run State | `apps/web/trpc/routers/drivers.ts#L2670-L2720` | Driver shifts prematurely closed while trip is actively departing. |
| **`DRV-P1-04`** | **Missing Break / Mandated Rest Tracking on Intercity Runs**<br/>`DriverStatus` defines `RESTING`, but no API or mobile UI exists for drivers to log mandatory 30-minute rest stops on routes $>4$ hours. | `MISSING` / `COMPLIANCE` | Shifts & Intercity | `packages/schemas/src/drivers.ts`, `apps/driver-app/features/live/screens/live-view.tsx` | Non-compliance with commercial transport labor rest mandates. |
| **`DRV-P1-05`** | **Unbounded Offline Telemetry Queue Drop Without Operator Notice**<br/>`driver_offline_pings_queue` drops oldest fixes when reaching `OFFLINE_QUEUE_CAP = 500` without notifying the operator that telemetry data was lost. | `RELIABILITY` | Telemetry & Mobile | `apps/driver-app/lib/telemetry-core.ts#L45-L75` | Silent telemetry gaps and unobservable vehicle tracking in prolonged dead zones. |
| **`DRV-P1-06`** | **Missing Passenger Manifest Seat Reassignment Trigger**<br/>Mobile manifest allows manual boarding, but provides no capability to record seat swaps when passengers request accommodations. | `PRODUCT GAP` / `UX` | Manifest & Crew | `apps/driver-app/features/trips/screens/manifest-view.tsx` | Discrepancy between actual bus seating and passenger booking records. |
| **`DRV-P1-07`** | **Missing Vehicle Breakdown Emergency Protocol**<br/>In-flight delay reporting captures delays, but lacks an urgent "Vehicle Breakdown / Replacement Needed" workflow to trigger emergency bus dispatch. | `PRODUCT GAP` | Operations & Trips | `apps/driver-app/features/live/components/delay-modal.tsx` | Breakdown emergencies treated as ordinary traffic delays. |
| **`DRV-P1-08`** | **Unverified Driver Read Mutation Authorization Bypass**<br/>`driverProcedure` middleware denies `startTrip` and `toggleShift` for unverified drivers, but permits calling `reportTripDelay` on arbitrary trips if assigned. | `AUTHORIZATION` | Security & IAM | `apps/web/trpc/init.ts#L323-L350` | Unverified drivers can alter operational trip status via direct RPC invocation. |
| **`DRV-P1-09`** | **Driver Profile Image Upload Bypasses Private S3 Namespace Guard**<br/>`driver-selfie` storage purpose uploads to user profile image without registering in `DriverProfile.medicalDocUrl` / `licenseFrontUrl` verification structures. | `SECURITY` / `DATA` | Documents & Storage | `apps/web/features/driver/lib/driver-doc-access.ts#L20-L30` | Inconsistent document provenance during admin verification audit. |

---

## 3. Major Issues (P2 Findings)

* **`DRV-P2-01`**: `drivers:assign` IAM permission key is catalog-only and unenforced across procedures.
* **`DRV-P2-02`**: `telemetry:stream` IAM permission key is dead code; authorization relies exclusively on HMAC tokens.
* **`DRV-P2-03`**: Dormant WebSocket telemetry transport on mobile with no backend gateway deployed.
* **`DRV-P2-04`**: Legacy affiliations missing `payRateXOF` default to estimated 50 XOF/min fallback.
* **`DRV-P2-05`**: 180-day telemetry pruning causes lifetime driver safety penalties to roll off over time.
* **`DRV-P2-06`**: Missing push notification when operator rejects driver compliance verification.
* **`DRV-P2-07`**: Ambiguous binding error string protocol requires manual client string splitting.
* **`DRV-P2-08`**: Mobile speed gauge displays instantaneous GPS speed without low-pass smoothing, causing needle jitter.
* **`DRV-P2-09`**: Conductor role cannot be selected as default in mobile registration carrier step.
* **`DRV-P2-10`**: Urban contractor cannot view earnings breakdown per individual operator on mobile.
* **`DRV-P2-11`**: Mapbox route polyline fetch has no offline geometric pre-caching before trip start.
* **`DRV-P2-12`**: Delay reporting reasons hardcoded to English in database while UI is in French.
* **`DRV-P2-13`**: Operator cannot set custom turnaround buffer per route (fixed at global 45 minutes).
* **`DRV-P2-14`**: Driver cannot dispute an anomaly penalty or passenger review in mobile app.
* **`DRV-P2-15`**: Manifest passenger search lacks telephone number matching on mobile.
* **`DRV-P2-16`**: Missing haptic feedback when driver exceeds highway speed limit gauge.
* **`DRV-P2-17`**: Admin marketplace moderation audit logs lack diff tracking of altered terms.
* **`DRV-P2-18`**: Double-booking engine fallback speed (35 km/h) underestimates modern highway durations.

---

## 4. Minor & Polish Issues (P3 / P4 Findings)

* **`DRV-P3-01`**: Unlocalized strings in counteroffer bottom sheet.
* **`DRV-P3-02`**: Missing empty state illustration on completed trips tab.
* **`DRV-P3-03`**: Notification bell counter does not update optimistically on click.
* **`DRV-P3-04`**: License expiration date format renders UTC instead of Abidjan local time in table.
* **`DRV-P3-05`**: Driver badge number missing from operator live map tooltip.
* **`DRV-P3-06`**: Battery drain under continuous high-accuracy GPS on older Android devices.
* **`DRV-P3-07`**: No audio beep tone on successful QR ticket scan (haptic only).
* **`DRV-P3-08`**: Marketplace bio character limit unindicated in mobile form.
* **`DRV-P3-09`**: Redundant query invalidations on offer acceptance mutation.
* **`DRV-P3-10`**: Inconsistent button color between Web verify dialog and Admin hub.
* **`DRV-P3-11`**: Driver earnings tab accessible via hidden route instead of primary bottom bar.
* **`DRV-P3-12`**: Lack of dark/light theme toggle in driver mobile settings.
* **`DRV-P4-01`**: Unused helper `getRoleLevel` in `permissions.ts`.
* **`DRV-P4-02`**: Duplicate type definitions between `drivers.ts` and `driver-earnings.ts`.
* **`DRV-P4-03`**: Redundant database index on `DriverShift(companyId, startedAt)`.
* **`DRV-P4-04`**: Inconsistent capitalization in error messages across tRPC procedures.
* **`DRV-P4-05`**: Unused Zod schema `driverLocationPingBatchSchema` in web router.
