# Engineering Audit: Architecture & System Boundaries

## 1. System Architecture Overview

The Driver Operations Domain is structured as a layered, multi-package monorepo under Turborepo.

```mermaid
graph TD
    subgraph Mobile Client apps/driver-app
        EXPO[Expo / React Native UI]
        ZUSTAND[Zustand Draft Store]
        TASK[Expo TaskManager Background GPS]
        TRPC_MOB[tRPC React Query Client]
    end

    subgraph Web Portal apps/web
        NEXT_PAGE[Next.js App Router Pages]
        TRPC_SRV[tRPC Backend Routers drivers/trips/admin]
        HTTP_TEL[HTTP Ingest Route /api/v1/telemetry/ping]
        OUTBOX_SVC[Transactional Outbox Workers]
        CRON_SVC[Vercel / Scheduled Cron Handlers]
    end

    subgraph Shared Contracts packages/
        SCHEMAS[packages/schemas Zod Contracts & Constants]
        DB[packages/db Prisma Client & Migrations]
    end

    subgraph Infrastructure
        PG[(PostgreSQL 16 Database)]
        REDIS[(Redis Pub/Sub & Caching)]
        S3[(AWS S3 / Cloudflare R2 Storage)]
        NOVU[Novu Notification Engine]
    end

    EXPO --> TRPC_MOB --> TRPC_SRV
    TASK --> HTTP_TEL
    NEXT_PAGE --> TRPC_SRV
    TRPC_SRV --> DB --> PG
    TRPC_SRV --> REDIS
    TRPC_SRV --> SCHEMAS
    HTTP_TEL --> DB
    HTTP_TEL --> REDIS
    OUTBOX_SVC --> NOVU
    TRPC_SRV --> S3
```

---

## 2. Architectural Violations & Concerns

### 2.1 Direct Postgres Row Locks on High-Frequency Hot Path
* **Violation**: `apps/web/server/telemetry-flush.ts` performs transactional `SELECT ... FOR UPDATE` row locks on `driver_profile` inside the high-frequency telemetry ingestion loop.
* **Architectural Smell**: The hot ingest path (handling thousands of pings per minute) is coupled to relational ACID transactions with write locks.
* **Fix**: Ingest raw pings as append-only records; aggregate daily safety penalty caps asynchronously in background micro-batches or defer to nightly crons.

### 2.2 Dual-Layer Verification Status Inconsistencies
* **Observation**: Both `DriverProfile.verificationStatus` and `DriverCompanyAffiliation.isVerified` exist.
* **Architectural Risk**: If an admin suspends a driver globally (`DriverProfile.verificationStatus = "SUSPENDED"`), old affiliations may retain `isVerified = true`.
* **Remediation**: In all assignment and procedure checks, `DriverProfile.verificationStatus` must be the sole authoritative source of truth.
