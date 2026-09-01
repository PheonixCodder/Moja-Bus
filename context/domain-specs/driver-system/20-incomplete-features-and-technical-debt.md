# Incomplete Features, Stubs & Technical Debt

## 1. Executive Summary

This document provides a transparent, zero-hallucination inventory of all partially implemented subsystems, dormant transports, dead catalog keys, and architectural technical debt identified within the Driver Operations Domain.

---

## 2. Incomplete & Partially Implemented Features

### 2.1 Dormant WebSocket Telemetry Transport
* **Current State**: The mobile client contains scaffolding for WebSocket streaming in `apps/driver-app/lib/telemetry.ts` when `EXPO_PUBLIC_WS_URL` is defined.
* **Code Gap**: The production backend in `apps/web` primarily receives coordinates over the HTTP REST endpoint `POST /api/v1/telemetry/ping`. The WebSocket gateway server is not deployed in default environments, meaning all telemetry defaults to HTTP chunked batching.
* **Impact**: Higher HTTP connection overhead on high-frequency highway tracking.

### 2.2 Unused / Catalog-Only IAM Permission Keys
* **`drivers:assign`** (`packages/schemas/src/permissions.ts#L84-L88`):
  * Documented as a dead key in code comments (`"DEAD KEY — no procedure enforces drivers:assign"`).
  * Trip assignment enforcement currently rides on `trips:update` in `trips.assignDriver`.
* **`telemetry:stream`** (`packages/schemas/src/permissions.ts#L91-L97`):
  * Catalog-only key. Telemetry ingest authorization relies on stateless HMAC dispatch tokens minted on trip start, not IAM user keys.

### 2.3 Partial Conductor Manifest Delegation
* **Current State**: `TripDriverAssignment` supports `role = "CONDUCTOR"`, and `isConductor` skips driving license checks in `trips.assignDriver`.
* **Code Gap**: While conductors can scan tickets and view manifests, they cannot start a trip on behalf of a driver if the primary driver's phone is dead, unless the conductor also has the mobile driver app configured. Conductor-specific workflow views are currently co-located inside the general driver app.

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
