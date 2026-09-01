# Product Audit: Half-Baked & Disconnected Features

This document catalogs features where substantial code, database models, or UI elements exist, but the implementation is incomplete, disconnected, or non-functional end-to-end.

---

## 1. Inventory of Half-Baked Features

### 1.1 Conductor Role on Scheduled Departures
* **What Exists**:
  * `TripDriverAssignment.role = "CONDUCTOR"`.
  * `trips.assignDriver` skips commercial driving license checks for conductors.
  * `DriverCheckInService` validates conductor tenancy on trips.
* **What is Broken**:
  * Conductor cannot open the QR ticket scanner from the mobile app prior to scheduled departure because scanner access is conditionally gated on `Trip.status === "DEPARTED"` in `apps/driver-app/features/trips/screens/trips-view.tsx`.
* **Classification**: `HALF-BAKED (UI BLOCKS BACKEND CAPABILITY)`.
* **Severity**: `P0 — Blocker`.

### 1.2 Relief Driver Sub-Segment Spans
* **What Exists**:
  * `TripDriverAssignment.startStopOrder` and `endStopOrder`.
  * Nightly cron scales relief driving distance based on waypoint chain ratio.
* **What is Broken**:
  * Mobile live navigation HUD does not indicate which waypoint the relief driver takes over, nor is there any UI prompt reminding the crew to swap seats.
* **Classification**: `HALF-BAKED (DATA MODEL EXISTS, UX MISSING)`.
* **Severity**: `P1 — Critical`.

### 1.3 WebSocket Telemetry Transport
* **What Exists**:
  * Mobile client contains full WebSocket streaming protocol scaffolding in `apps/driver-app/lib/telemetry.ts` under `EXPO_PUBLIC_WS_URL`.
* **What is Broken**:
  * No WebSocket gateway server is deployed or configured in `apps/web`. In production, the client immediately catches connection errors and falls back to HTTP REST batching.
* **Classification**: `HALF-BAKED (CLIENT CODE DORMANT)`.
* **Severity**: `P2 — Major`.

### 1.4 `drivers:assign` IAM Permission Key
* **What Exists**:
  * Defined in `packages/schemas/src/permissions.ts#L88` and assigned to `ADMIN`, `MANAGER`, `OPERATIONS`, and `DISPATCHER` role templates.
* **What is Broken**:
  * No procedure enforces `drivers:assign`. `trips.assignDriver` gates exclusively on `trips:update`.
* **Classification**: `DEAD CODE / CATALOG-ONLY KEY`.
* **Severity**: `P2 — Major`.

### 1.5 Driver RESTING State Machine Status
* **What Exists**:
  * Defined in Prisma enum `DriverStatus.RESTING` and Zod schemas.
* **What is Broken**:
  * No endpoint or mobile button can set a driver into `RESTING` status.
* **Classification**: `HALF-BAKED (SCHEMA DEFINED, PROCEDURE MISSING)`.
* **Severity**: `P2 — Major`.
