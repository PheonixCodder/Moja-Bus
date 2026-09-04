# Incomplete Features, Stubs & Technical Debt

## 1. Executive Summary

This document provides a transparent, zero-hallucination inventory of all partially implemented subsystems, dormant transports, dead catalog keys, and architectural technical debt identified within the Driver Operations Domain.

---

## 2. Incomplete & Partially Implemented Features

### 2.1 Dormant WebSocket Telemetry Transport
* **Current State**: The mobile client contains scaffolding for WebSocket streaming in `apps/driver-app/lib/telemetry.ts` when `EXPO_PUBLIC_WS_URL` is defined.
* **Current State**: The WebSocket gateway is now fully deployed and in use. The backend runs a production `TelemetryWebSocketGateway` (`apps/web/server/telemetry-ws.ts`) handling `upgrade` requests on `/api/ws/telemetry` and `/api/ws` (`apps/web/server.ts:28`), with per-client room subscription (`trip:{tripId}:telemetry` / `operator:{companyId}:fleet`), IP-gated handshakes, and HMAC claim enforcement (line 83, 184). A dedicated `runner-ws` image is built in the `Dockerfile`, the Caddy ingress exposes `wss://`, and the mobile client subscribes via `apps/driver-app/lib/gateway-subscription.ts`. Stop-progress broadcasts already publish over WS (`apps/web/trpc/routers/drivers.ts:2969, 3065`).
* **Note**: HTTP `POST /api/v1/telemetry/ping` is retained as a stateless fallback when the WS connection is unavailable.
* **Classification**: `RESOLVED — no longer half-baked.`

### 2.2 Unused / Catalog-Only IAM Permission Keys
* **`drivers:assign`** (`packages/schemas/src/permissions.ts#L84-L88`):
  * Documented as a dead key in code comments (`"DEAD KEY — no procedure enforces drivers:assign"`).
  * Trip assignment enforcement currently rides on `trips:update` in `trips.assignDriver`.
* **`telemetry:stream`** (`packages/schemas/src/permissions.ts#L91-L97`):
  * Catalog-only key. Telemetry ingest authorization relies on stateless HMAC dispatch tokens minted on trip start, not IAM user keys.

### 2.3 Partial Conductor Manifest Delegation
* **Current State**: `TripDriverAssignment` supports `role = "CONDUCTOR"`, and `isConductor` skips driving license checks in `trips.assignDriver`. The mobile manifest view (`features/trips/screens/manifest-view.tsx`) now exposes an unconditional **QR Scanner launcher** for any `SCHEDULED`/`BOARDING`/`DELAYED`/`DEPARTED` trip, so conductors can validate tickets at terminal gates before departure (P0-1 remediation).
* **Remaining Gap**: A conductor still cannot *start a trip* (mint the telemetry dispatch token / flip `Trip.status` to `DEPARTED`) on behalf of a driver whose device is dead — that action remains restricted to the Primary/Relief crew via `drivers.startTrip`. Conductor-specific workflow views are co-located inside the general driver app.

---

## 3. Schema & Database Technical Debt

### 3.1 Legacy Driver Pay Rate Fallback
* **Issue**: Early migrations did not mandate `payRateXOF` on `DriverCompanyAffiliation`.
* **Workaround in Code**: `apps/web/lib/driver-earnings.ts#L67` falls back to `DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE = 50` ($3,000$ XOF/hr) and flags calculations as `isEstimated: true`.
* **Recommended Fix**: Add a database migration setting a non-null default or enforcing rate configuration on all active affiliations.

### 3.2 GPS Anomaly Retention vs. Driver Scoring History
* **Issue**: The `/api/cron/prune-telemetry` job purges `DriverLocationPing` records older than 180 days.
* **Consequence**: Nightly reconciliation in `/api/cron/reconcile-driver-stats` only aggregates raw anomaly penalties over the past 180 days. Safety score deductions older than 180 days naturally roll off unless persistent penalty ledgers are introduced.

---

## 4. Discrepancy & Consistency Matrix

| Domain Element | Layer A (UI / Mobile) | Layer B (Backend / Database) | Discrepancy Classification & Status |
| :--- | :--- | :--- | :--- |
| **Shift Duty Toggle** | Mobile UI allows selecting `serviceType` (`INTERCITY` vs `URBAN`). | Backend `toggleShift` ignores `serviceType` unless provided; defaults to `INTERCITY`. | `IMPLEMENTATION NOTE`: Safe default, but urban contractors should explicitly pass `URBAN`. |
| **Document Uploads** | Mobile captures camera photos as local `file://` URIs. | Backend strictly mandates presigned S3 object keys (`documents/drivers/...`). | `RESOLVED`: S3 presigned upload pipeline implemented in `apps/driver-app/stores/driver-registration.ts`. |
| **License Expiry Check** | Mobile UI displays expiry date picker. | Backend enforces `isLicenseUsableThrough` (valid through trip estimated arrival). | `IMPLEMENTATION NOTE`: Driver could have a valid license today that expires before a long-haul 8h run completes tomorrow. Backend correctly hard-blocks assignment. |
| **Exclusive Conflict** | Mobile displays alert prompt with conflicting company names. | Backend returns delimited error string `EXCLUSIVE_CONFLICT_REQUIRED::CompanyA|CompanyB`. | `IMPLEMENTATION NOTE`: String-delimited protocol parsed by client `onError` handler in `offers-view.tsx#L74-L95`. |
