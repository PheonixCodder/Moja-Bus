# Crew Model: Primary Driver, Relief Driver & Conductor

## 1. Crew Model Architecture

Commercial bus operations on the Moja Ride platform utilize a three-role crew model orchestrated via `TripDriverAssignment` junction records (`packages/db/prisma/schema.prisma#L2375-L2400`):

```mermaid
graph TD
    subgraph Trip Crew Roster
        TRIP[Trip Departure]
        PRIM[Primary Driver role: PRIMARY]
        REL[Relief Driver role: RELIEF]
        COND[Conductor role: CONDUCTOR]
    end

    TRIP -->|driverId| PRIM
    TRIP -->|reliefDriverId| REL
    TRIP -->|driverAssignments junction| COND
    TRIP -->|driverAssignments junction| PRIM
    TRIP -->|driverAssignments junction| REL

    PRIM -->|Drives Segment A-Z / Streams GPS| BUS[Bus Vehicle]
    REL -->|Drives Sub-segment / Standby| BUS
    COND -->|Scans QR Tickets / Boards Passengers| MANIFEST[Passenger Manifest]
```

---

## 2. Crew Role Comparison

| Characteristic | Primary Driver (`PRIMARY`) | Relief Driver (`RELIEF`) | Conductor (`CONDUCTOR`) |
| :--- | :--- | :--- | :--- |
| **Prisma Trip Foreign Key** | Stored in `Trip.driverId` AND `TripDriverAssignment` | Stored in `Trip.reliefDriverId` AND `TripDriverAssignment` | Stored **only** in `TripDriverAssignment` junction |
| **Commercial License Check** | Required. Must satisfy `BusType.requiredLicenseCategory` ($E \ge D \ge C \ge B$). | Required. Must satisfy `BusType.requiredLicenseCategory` ($E \ge D \ge C \ge B$). | **Exempt**. Driving license not checked; only `verificationStatus === "VERIFIED"` required. |
| **License Expiry Gate** | Must be valid through trip estimated arrival (`isLicenseUsableThrough`). | Must be valid through trip estimated arrival (`isLicenseUsableThrough`). | **Exempt** from license expiration checks. |
| **Mode Compatibility** | `CONTRACTOR_URBAN` hard-blocked on `INTERCITY`. | `CONTRACTOR_URBAN` hard-blocked on `INTERCITY`. | **Exempt** from mode compatibility checks. |
| **Start / Complete Run** | **Yes** (`drivers.startTrip`, `drivers.completeTrip`). Sets `currentTripId` and transitions status to `ON_TRIP`. | **Yes**. Relief driver can start/complete in lieu of or alongside Primary. | **Yes** if operating in conductor-managed boarding mode. |
| **GPS Telemetry Streaming** | **Primary Streamer**. Mints signed telemetry dispatch token. | Fallback streamer if primary device offline. | Does not stream driving telemetry. |
| **Passenger QR Scanning** | Allowed (`drivers.checkInPassenger`). | Allowed (`drivers.checkInPassenger`). | **Primary Scanner & Ticket Validator**. |
| **Manifest Access** | Allowed (`drivers.getMyTripManifest`). | Allowed (`drivers.getMyTripManifest`). | Allowed (`drivers.getMyTripManifest`). |
| **Distance Credit (Stats)** | Earns full route distance (or start-to-end segment distance). | Earns proportional sub-span distance via stop order ratio. | Earns zero driving distance credit. |

---

## 3. Relief Driver Segment Spans & Distance Scaling

### 3.1 Partial Span Sub-Segments
Relief drivers are frequently assigned to specific dangerous or long segments of a journey (e.g. night mountain passes or legs exceeding 4 continuous driving hours).
`TripDriverAssignment` tracks partial spans via:
* `startStopOrder` (integer, default `0`): Waypoint stop order index where relief takes the wheel.
* `endStopOrder` (integer, nullable): Waypoint stop order index where relief hands control back.

### 3.2 Proportional Distance Credit Calculation (`computeSegmentDistanceKm`)
Implemented in `apps/web/lib/telemetry-reconcile.ts` and executed during the nightly stats reconciliation cron (`/api/cron/reconcile-driver-stats`):

```typescript
export function computeSegmentDistanceKm(input: {
  startStopOrder: number;
  endStopOrder?: number | null;
  stops: ReconcileStopCoordinate[];
  routeDistanceKm: number;
}): number {
  const { startStopOrder, endStopOrder, stops, routeDistanceKm } = input;
  
  // Full-span assignment: 100% of route distance
  if (startStopOrder === 0 && (endStopOrder == null || endStopOrder >= stops.length - 1)) {
    return routeDistanceKm;
  }
  
  // Compute Haversine chain distances between stop coordinates
  let totalChainMeters = 0;
  let segmentChainMeters = 0;
  
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (s1?.latitude && s1?.longitude && s2?.latitude && s2?.longitude) {
      const legMeters = calculateHaversineDistanceMeters(s1.latitude, s1.longitude, s2.latitude, s2.longitude);
      totalChainMeters += legMeters;
      if (i >= startStopOrder && (endStopOrder == null || i < endStopOrder)) {
        segmentChainMeters += legMeters;
      }
    }
  }
  
  if (totalChainMeters === 0) return routeDistanceKm;
  const ratio = segmentChainMeters / totalChainMeters;
  return Math.round(routeDistanceKm * ratio * 10) / 10;
}
```

---

## 4. Conductor Role & Boarding Ownership

### 4.1 Legal & Contractual Exemption
In West African intercity transit, conductors handle ticketing, luggage stowage, passenger manifest checks, and in-cabin assistance, but do not operate the bus steering wheel. The platform enforces this distinction in `trips.assignDriver` (`apps/web/trpc/routers/trips.ts#L1835-L1879`):

```typescript
const isConductor = role === "CONDUCTOR";

if (!isConductor) {
  // Enforce commercial license class match
  const requiredLicense = trip.bus?.busType?.requiredLicenseCategory;
  if (requiredLicense && !licenseMeetsRequirement(driver.licenseCategory, requiredLicense)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `License mismatch: bus requires class ${requiredLicense}; driver holds ${driver.licenseCategory}.`,
    });
  }

  // Enforce license validity through trip arrival
  const licenceThrough = trip.estimatedArrival ?? trip.departureDate;
  if (!isLicenseUsableThrough(driver.licenseExpiryDate, licenceThrough)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Driver license expires before trip arrival.",
    });
  }

  // Enforce mode compatibility
  if (employmentType === "CONTRACTOR_URBAN" && trip.serviceType === "INTERCITY") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot assign an urban contractor to an intercity trip.",
    });
  }
}
```

### 4.2 Shared Manifest & Check-In Authority
All crew members assigned to a trip (`PRIMARY`, `RELIEF`, or `CONDUCTOR`) possess equal authority to:
1. Fetch the real-time passenger manifest (`drivers.getMyTripManifest`).
2. Perform QR ticket camera check-ins (`DriverCheckInService.scanCheckIn`).
3. Perform manual passenger check-ins (`DriverCheckInService.manualCheckIn`).
4. Flush offline scan queues (`DriverCheckInService.batchSync`).

> **Pre-departure gate boarding**: Crew members may launch the QR scanner from the manifest view on any trip whose status is `SCHEDULED`, `BOARDING`, `DELAYED`, or `DEPARTED` — the boarding window is **not** gated on the bus having rolled out. Conductors and primary drivers can therefore validate tickets at terminal gates before departure. (Remediation of DRV-P0-1.)

---

## 5. Relief Driver Mid-Route Handover Protocol

Long-haul intercity corridors (e.g. Abidjan → Korhogo, San-Pédro → Man) legally mandate driver alternation. The platform now supports a live, in-run transfer of driving authority from a Primary driver to an assigned Relief driver.

### 5.1 Handover Trigger & Authorization
Implemented in `apps/driver-app/features/live/screens/live-view.tsx` (HUD "Take Wheel" action) and `apps/web/trpc/routers/drivers.ts:2218`.

* **Preconditions** enforced by `drivers.handoverTripControl`:
  * Caller must hold an active assignment on `tripId` (any role).
  * The trip must be `DEPARTED` (in-progress) — handover is rejected on `SCHEDULED`/`BOARDING`/`ARRIVED`/`CANCELLED`.
  * The target `reliefDriverProfileId` must hold a `RELIEF` assignment on the same trip (the mobile HUD filters `role === "RELIEF"` excluding self, at `live-view.tsx:145-155`).
* **UI**: A "Take Wheel" button (`btnHandover`) renders in the live HUD only when `reliefAssignments.length > 0` (`live-view.tsx:870-880`), with a confirmation Alert naming the relief driver before invoking the mutation.

### 5.2 Atomic State Transfer
`handoverTripControl` (`apps/web/trpc/routers/drivers.ts:2218-2372`) executes within a single transaction:
1. Resolves the current `currentTripId` holder (`DriverProfile.currentTripId === tripId`).
2. Clears `currentTripId` on the outgoing driver.
3. Sets `currentTripId = tripId` on the incoming driver, minting a fresh HMAC dispatch token scoped to the new driver (`mintTelemetryDispatchTokenWithCompany`).
4. Broadcasts a `driver-run-handover` outbox event to the operator and passengers.

### 5.3 Telemetry & Device Re-Binding
The handover mints a new 24-hour stateless HMAC token whose `d` (driver) claim now points to the relief driver. The relief device's background telemetry task (`MOJA_DRIVER_LOCATION_TRACKING`) consumes this token, so GPS streaming switches to the relief driver's device without re-authentication. The primary device should stop its tracking task on success (the mobile `onSuccess` handler calls `stopBackgroundLocationTracking()` and `setTelemetryAuthToken(null)` — `live-view.tsx:159-163`).

### 5.4 Distance Credit Reconciliation
The existing partial-span credit (`computeSegmentDistanceKm`, §3) continues to apply independently of handover — each crew member earns distance for the waypoint span recorded in their `TripDriverAssignment.startStopOrder`/`endStopOrder`. A handover does **not** alter the nightly stats span; it only reassigns the live `currentTripId` ownership and telemetry authorship. *(DRV-P0-4 remediation.)*

### 5.5 Conductor Non-Involvement
Conductors cannot invoke `handoverTripControl` — the relief handover is strictly a driving-authority transfer between `PRIMARY` and `RELIEF` drivers. Conductors retain ticket-validation authority throughout. This is enforced by the caller-assignment + relief-role precondition, since a conductor holds no valid `currentTripId` to surrender.
