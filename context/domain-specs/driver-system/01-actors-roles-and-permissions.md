# Actors, Roles, RBAC & IAM Matrices

## 1. Domain Actor Overview

The Driver Operations Domain orchestrates interactions between five distinct actor classes. Each actor has specific access boundaries, security contexts, data visibility constraints, and operational permissions.

```mermaid
graph TD
    subgraph Platform Admin
        SA[Super Admin]
        A[Admin]
        OPS_ADM[Operations Admin]
        COMPL[Compliance Admin]
    end

    subgraph Operator ERP
        OWN[Company Owner]
        ADM[Operator Admin]
        MGR[Manager]
        DISP[Dispatcher]
        OPS[Operations]
    end

    subgraph Driver
        D_EXCL[Exclusive Intercity Driver]
        D_URB[Urban Contractor Driver]
        D_HYB[Hybrid Driver]
    end

    subgraph Trip Crew
        PRIM[Primary Driver]
        REL[Relief Driver]
        COND[Conductor]
    end

    subgraph Passenger
        PAX[Passenger / Reviewer]
    end

    Platform Admin -->|Platform Verification / Suspension| Driver
    Operator ERP -->|Marketplace Offers / Affiliations| Driver
    Operator ERP -->|Assigns & Dispatches| Trip Crew
    Trip Crew -->|GPS / QR Scans / Waypoints| Trip
    Passenger -->|3-Way Ratings| Driver
```

---

## 2. Actor Definitions & Capabilities

### 2.1 Platform Admin (`AdminStaff`)
* **Identity Model**: `User` with `role === "ADMIN"`, paired 1:1 with `AdminStaff` row (`packages/db/prisma/schema.prisma#L877-L904`).
* **Roles** (`AdminStaffRole` in `packages/schemas/src/admin-permissions.ts#L9-L20`): `SUPER_ADMIN`, `ADMIN`, `OPERATIONS`, `SUPPORT`, `COMPLIANCE`, `FINANCE`.
* **Security Middleware**: `adminProcedure` in `apps/web/trpc/init.ts#L210-L246`. Checks `user.role === "ADMIN"` AND verifies that the caller has an active `AdminStaff` record (`deletedAt === null` and `status !== "SUSPENDED"`).
* **Driver Domain Responsibilities**:
  * Platform-wide verification review via `admin.verifyDriver` (`apps/web/trpc/routers/admin.ts#L2915-L3035`). Requires permission `drivers:verify.manage`.
  * Presigning compliance documents across any operator via `admin.presignDoc` (`apps/web/trpc/routers/admin.ts#L3042-L3047`). Requires `drivers:verify.read`.
  * Driver Marketplace management via `admin.setDriverMarketplaceStatus` (featuring, unfeaturing, suspending, restoring). Requires `marketplace:manage`.
  * Audit inspection of all platform-wide employment offers and events via `admin.listAllOffers` (`apps/web/trpc/routers/admin.ts#L3416-L3500`). Requires `marketplace:read`.

### 2.2 Operator Staff (`Operator`)
* **Identity Model**: `User` with `role === "OPERATOR"`, linked to a company through `Operator` profile (`packages/db/prisma/schema.prisma#L759-L814`).
* **Roles** (`StaffRole` in `packages/schemas/src/permissions.ts#L9-L20`): `OWNER`, `ADMIN`, `MANAGER`, `OPERATIONS`, `DISPATCHER`, `FINANCE`, `SUPPORT`, `TREASURY`. (Note: `CONDUCTOR` and `DRIVER` exist in the enum for historical reasons, but are excluded from invitable staff seats via `INVITABLE_STAFF_ROLES` in `packages/schemas/src/permissions.ts#L32-L41`).
* **Security Middleware**: `operatorCompanyProcedure` in `apps/web/trpc/init.ts#L168-L208`. Resolves caller's `companyId` and asserts `operator.status !== "SUSPENDED"`.
* **Driver Domain Responsibilities**:
  * Direct driver roster management: `drivers.createDriver` (requires `drivers:create`), `drivers.updateDriver` (requires `drivers:update`), `drivers.deleteDriverAffiliation` (requires `drivers:delete`).
  * Company-level compliance review: `drivers.verifyDriver` (requires `drivers:verify`).
  * Hiring via Offer Board: `drivers.sendEmploymentOffer`, `drivers.respondToCounterOffer`, `drivers.withdrawOffer`.
  * Dispatch & Trip Assignment: `trips.assignDriver` (requires `trips:update`), `trips.unassignDriver` (requires `trips:update`).
  * Real-time fleet tracking: `drivers.getLivePositions` (requires `drivers:read`).

### 2.3 Driver (`DriverProfile`)
* **Identity Model**: `User` with `role === "DRIVER"`, linked 1:1 with `DriverProfile` (`packages/db/prisma/schema.prisma#L2287-L2347`).
* **Security Middleware**: `driverProcedure` in `apps/web/trpc/init.ts#L323-L350`. Resolves `DriverProfile` and active company affiliations. Enforces:
  * If `verificationStatus === "SUSPENDED"`: Denies all state mutations and sensitive reads (`getTelemetryToken`, `getMyUrgentDispatches`). Read-only access to historic data.
  * If `!canOperateRuns(verificationStatus)` (i.e. `PENDING`, `REJECTED`, `EXPIRED`): Hard blocks `startTrip` and `toggleShift`. Read access, manifest access, delay reporting, and trip completion are preserved to prevent stranded in-flight operations.
* **Driver Domain Responsibilities**:
  * Self-registration and compliance document submission (`drivers.registerDriver`).
  * Managing duty shifts (`drivers.toggleShift`).
  * Reviewing, accepting, declining, and countering employment offers (`drivers.respondToOffer`, `drivers.markMyOffersSeen`).
  * Executing trips: starting runs (`drivers.startTrip`), recording waypoint stop arrivals/departures (`drivers.recordStopArrival`, `drivers.recordStopDeparture`), reporting delays (`drivers.reportTripDelay`), and completing runs (`drivers.completeTrip`).
  * Passenger check-in: QR scanning (`drivers.checkInPassenger`), manual check-in (`drivers.manualCheckInPassenger`), and offline batch sync (`drivers.batchSyncCheckIns`).
  * Streaming live GPS telemetry via HTTP / WebSocket using signed tokens.

### 2.4 Trip Crew Roles (`TripDriverAssignment`)
A driver assigned to an operational trip operates under one of three crew roles defined in `TripDriverAssignment.role` (`packages/db/prisma/schema.prisma#L2375-L2400`):

| Crew Role | Code Identifier | Responsibilities & System Capabilities |
| :--- | :--- | :--- |
| **Primary Driver** | `"PRIMARY"` | Controls the vehicle during the main run. Bound to `Trip.driverId`. Subject to bus license category match (`requiredLicenseCategory`), license expiry check through trip arrival (`isLicenseUsableThrough`), and mode compatibility guard (`CONTRACTOR_URBAN` blocked on `INTERCITY`). Can start/complete trips and stream telemetry. |
| **Relief Driver** | `"RELIEF"` | Secondary driver for long-haul intercity corridors. Bound to `Trip.reliefDriverId`. Subject to same license and mode checks as Primary. Can view trip manifest and execute boarding. Partial distance credit calculated via stop order segment ratio during nightly stats reconciliation. |
| **Conductor** | `"CONDUCTOR"` | Crew member responsible for ticketing, passenger manifest, and boarding. Gated on `verificationStatus === "VERIFIED"`, but **exempt** from commercial driving license checks and vehicle license category matching. Stored exclusively in `TripDriverAssignment` junction. |

### 2.5 Passenger (`User`)
* **Identity Model**: `User` with `role === "TRAVELER"`.
* **Driver Domain Interaction**:
  * Submits 3-way multi-dimensional reviews via `trips.submitReview` / `submitTripReviewSchema` (`packages/schemas/src/drivers.ts#L284-L292`): `rating` (1–5 overall), `driverRating` (1–5 driver safety/behavior), `busRating` (1–5 bus cleanliness/comfort), `punctualityRating` (1–5 on-time departure/arrival).
  * `driverRating` directly feeds into `DriverProfile.averageRating` and `DriverProfile.totalReviews` computed by the nightly reconciliation cron.

---

## 3. Operator Staff IAM Permission Matrix

The operator IAM catalog is defined in `packages/schemas/src/permissions.ts`. Role assignments grant permissions according to `ROLE_TEMPLATES`.

| Permission Key | Description | OWNER | ADMIN | MANAGER | OPERATIONS | DISPATCHER | CONDUCTOR | DRIVER |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `drivers:read` | View drivers roster, analytics & live positions | Yes | Yes | Yes | Yes | Yes | No | No |
| `drivers:create` | Add and onboard new drivers to fleet | Yes | Yes | Yes | No | No | No | No |
| `drivers:update` | Edit driver profiles, wage terms & licence details | Yes | Yes | Yes | No | No | No | No |
| `drivers:delete` | Remove driver company affiliations (roster removal) | Yes | Yes | No | No | No | No | No |
| `drivers:verify` | Verify driver commercial licenses & compliance | Yes | Yes | No | No | No | No | No |
| `drivers:assign` | Catalog-only key (enforcement rides on `trips:update`) | Yes | Yes | Yes | Yes | Yes | No | No |
| `trips:read` | View trips list and dispatch board | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `trips:update` | Assign/unassign drivers, swap buses, change statuses | Yes | Yes | Yes | Yes | Yes | No | No |
| `trips:dispatch` | Trigger dispatch actions on trips | Yes | Yes | No | No | Yes | No | No |
| `trips:cancel` | Cancel scheduled/delayed trips | Yes | Yes | Yes | Yes | Yes | No | No |
| `bookings:read` | View passenger manifests and booking rows | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `bookings:checkin`| Check in passengers at gates / on-board | Yes | Yes | No | No | No | Yes | Yes |

*Note*: `OWNER` role bypasses array checks (`hasPermission` returns `true` for all catalog keys).

---

## 4. Platform Admin IAM Permission Matrix

The admin IAM catalog is defined in `packages/schemas/src/admin-permissions.ts`. Role templates are defined in `ADMIN_ROLE_TEMPLATES`.

| Permission Key | Description | SUPER_ADMIN | ADMIN | OPERATIONS | COMPLIANCE | SUPPORT | FINANCE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `drivers:verify.read` | View platform-wide driver verification hub | Yes | Yes | No | No | No | No |
| `drivers:verify.manage` | Approve, reject, or suspend driver licenses platform-wide | Yes | Yes | No | No | No | No |
| `marketplace:read` | View driver marketplace listings, health KPIs & offer logs | Yes | Yes | No | No | No | No |
| `marketplace:manage` | Feature, unfeature, suspend, or restore marketplace profiles | Yes | Yes | No | No | No | No |
| `audit:read` | View admin staff activity logs | Yes | Yes | Yes | Yes | No | Yes |

---

## 5. Security & Authorization Enforcement Implementation

### 5.1 Operator Permission Guard (`requirePermission`)
Implemented in `apps/web/lib/permissions/authorize.ts`:
```typescript
export function requirePermission(ctx: { operator: Operator }, key: PermissionKey): void {
  if (ctx.operator.role === "OWNER") return;
  const effective = getEffectivePermissions(ctx.operator.role, ctx.operator.permissions);
  if (!effective.includes(key)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Missing required permission: ${key}`,
    });
  }
}
```

### 5.2 Admin Permission Guard (`requireAdminPermission`)
Implemented in `apps/web/lib/permissions/authorize.ts`:
```typescript
export function requireAdminPermission(ctx: { adminStaff: AdminStaff }, key: AdminPermissionKey): void {
  if (ctx.adminStaff.role === "SUPER_ADMIN") return;
  const effective = getAdminEffectivePermissions(ctx.adminStaff.role, ctx.adminStaff.permissions);
  if (!effective.includes(key)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Missing required admin permission: ${key}`,
    });
  }
}
```

### 5.3 Driver Status Middleware Guard
Implemented in `apps/web/trpc/init.ts#L323-L349`:
```typescript
const SUSPENDED_DENIED_READS = new Set(["getTelemetryToken", "getMyUrgentDispatches"]);
const NON_VERIFIED_DENIED_MUTATIONS = new Set(["startTrip", "toggleShift"]);

export const driverProcedure = loadDriverProfile.use(({ ctx, type, path, next }) => {
  const procedureName = path.split(".").pop() ?? "";

  if (ctx.driver.verificationStatus === "SUSPENDED") {
    if (type !== "query" || SUSPENDED_DENIED_READS.has(procedureName)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your driver account is suspended — you have read-only access. Contact your operator.",
      });
    }
  } else if (
    !canOperateRuns(ctx.driver.verificationStatus) &&
    type === "mutation" &&
    NON_VERIFIED_DENIED_MUTATIONS.has(procedureName)
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your license verification is not approved yet — runs and shifts are locked until an operator verifies your account.",
    });
  }

  return next({ ctx });
});
```
