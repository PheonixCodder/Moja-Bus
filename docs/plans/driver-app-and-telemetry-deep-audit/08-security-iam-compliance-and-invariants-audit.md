# 08 — Security, IAM & Platform Invariants Audit

## 1. IAM Permissions Matrix

Driver fleet operations are governed by fine-grained permissions defined in `packages/schemas/src/permissions.ts` and enforced via `requirePermission(ctx, key)` in `apps/web/lib/permissions/authorize.ts`:

| Permission Key | Description | Default Roles Allowed |
| :--- | :--- | :--- |
| `"drivers:read"` | View driver roster, driver profiles, credentials, and live fleet map. | `OWNER`, `ADMIN`, `MANAGER`, `OPERATIONS`, `DISPATCHER` |
| `"drivers:create"` | Onboard and register new commercial drivers into company roster. | `OWNER`, `ADMIN`, `OPERATIONS` |
| `"drivers:update"` | Edit driver credentials, contact details, badge numbers, and notes. | `OWNER`, `ADMIN`, `OPERATIONS` |
| `"drivers:delete"` | Terminate company affiliation for a driver. | `OWNER`, `ADMIN` |
| `"drivers:verify"` | Approve or reject commercial driving license compliance documents. | `OWNER`, `ADMIN`, `OPERATIONS` |
| `"drivers:assign"` | Allocate primary drivers, relief drivers, and conductors to trips. | `OWNER`, `ADMIN`, `OPERATIONS`, `DISPATCHER` |
| `"telemetry:stream"` | Ingest and stream vehicle GPS telemetry. | `DRIVER`, System Ingest |

---

## 2. Platform Security Invariants

The system architecture enforces four core **domain invariants**:

### Invariant 1: Driver Profile Sovereignty
> **Rule**: An operator company cannot delete a driver's root `DriverProfile`. They may only terminate their specific `DriverCompanyAffiliation`.

- **Implementation**:
  - `trpc.drivers.deleteDriverAffiliation` only sets `DriverCompanyAffiliation.isActive = false` and `terminatedAt = new Date()`.
  - The root `DriverProfile` remains intact and attached to the driver's global `User` account, preserving lifetime ratings, safety scores, and verified credentials for future employment.

### Invariant 2: License Compliance Verification Gate
> **Rule**: A driver whose `verificationStatus !== "VERIFIED"` cannot be dispatched on commercial passenger runs.

- **Implementation**:
  - In `apps/web/trpc/routers/trips.ts` (`assignDriver`):
    ```typescript
    if (driver.verificationStatus !== "VERIFIED") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot assign driver: Driving license compliance is not verified.",
      });
    }
    ```

### Invariant 3: Single-Booking Review Immutability
> **Rule**: Only a traveler with a completed booking can submit a review, and once submitted, neither the operator nor the driver can alter the score.

- **Implementation**:
  - `Review.bookingId` is marked `@unique` in the database, preventing multiple review stuffing on a single ticket.
  - Reviews can only be responded to publicly by operators via `Review.response` without modifying the star ratings.

### Invariant 4: Trip Manifest Snapshot Freezing
> **Rule**: When a trip departs, the driver's identity, badge number, and vehicle registration are frozen into the trip audit record.

---

## 3. Telemetry Stream Security

1. **Authentication Handshake**:
   - The WebSocket gateway parses query tokens on connection handshake and validates the driver profile against the database before adding the socket to broadcast rooms.
2. **Rate Limiting & Anti-Spoofing**:
   - The Haversine velocity filter ($<220\text{ km/h}$) prevents malicious spoofing of teleported positions.
   - Pings exceeding 10 per second per device are throttled at the gateway level.
