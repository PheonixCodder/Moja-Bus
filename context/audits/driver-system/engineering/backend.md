# Engineering Audit: Backend, tRPC & Services

## 1. Backend Service Landscape

The backend consists of:
1. `apps/web/trpc/routers/drivers.ts` (4,480 lines): Core driver domain tRPC router.
2. `apps/web/trpc/routers/trips.ts`: Dispatch and assignment procedures.
3. `apps/web/trpc/routers/admin.ts`: Platform verification and moderation.
4. `apps/web/features/driver/services/driver-check-in-service.ts`: Boarding service.
5. `apps/web/lib/`: Domain engines for assignment, earnings, run-state, scoring, and telemetry tokens.

---

## 2. Code Smells & Backend Defects

### 2.1 Monolithic Router Bloat in `drivers.ts`
* **Finding**: `drivers.ts` spans **4,480 lines** with 32+ procedures mixing business logic, raw SQL queries, outbox dispatching, and error formatting.
* **Risk**: High cognitive load, difficulty in unit testing, and merge collision risk.
* **Recommendation**: Split into modular domain sub-routers:
  * `drivers/roster.ts`: Operator fleet management.
  * `drivers/offers.ts`: Offer creation, countering, and negotiation.
  * `drivers/runs.ts`: Start/complete trips, waypoints, delay reporting.
  * `drivers/checkin.ts`: QR scanning and manifest boarding.
  * `drivers/earnings.ts`: Shift and earnings analytics.

### 2.2 Unhandled Database Rejection on Concurrent Exclusive Switch
* **Location**: `apps/web/trpc/routers/drivers.ts#L330-L345`.
* **Problem**: In `resolveAcceptance`, `driverCompanyAffiliation.upsert` catches Prisma error code `P2002` (unique constraint violation) and rethrows a `409 Conflict`. However, it does not rollback the earlier `terminatedAt` updates on displaced affiliations if the transaction is not fully atomic.
* **Fix**: Ensure all mutations inside `resolveAcceptance` operate strictly within a single Prisma interactive transaction (`tx.$transaction`).
