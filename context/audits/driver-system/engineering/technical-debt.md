# Engineering Audit: Technical Debt, Dormant Code & Stubs

## 1. Technical Debt Inventory

This document details dead code, dormant transports, and code-level technical debt identified in the driver domain codebase.

---

## 2. Catalog of Identified Technical Debt

### 2.1 Dormant WebSocket Streaming Scaffolding
* **Location**: `apps/driver-app/lib/telemetry.ts#L80-L120`.
* **Debt**: Implements WebSocket reconnection logic, ping frames, and payload encoding. However, since no WebSocket gateway exists in `apps/web`, the client code is 100% dormant and never executes successfully.

### 2.2 Dead IAM Permission Keys
* **Location**: `packages/schemas/src/permissions.ts#L84-L97`.
* **Debt**: Keys `drivers:assign` and `telemetry:stream` are declared in catalogs and seeded into role templates, but are never checked in any tRPC procedure.

### 2.3 Hardcoded Fallback Pay Rate Constant
* **Location**: `apps/web/lib/driver-earnings.ts#L10`.
* **Debt**: `DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE = 50` (3,000 XOF/hr) is hardcoded as a legacy fallback instead of enforcing non-null wage configuration during affiliation setup.

### 2.4 Duplicate Type Definitions
* **Location**: `apps/web/trpc/routers/drivers.ts` vs `apps/web/lib/driver-earnings.ts`.
* **Debt**: `AffiliationPayConfig` and `EarningsResponse` types are duplicated across files rather than exported from `packages/schemas`.
