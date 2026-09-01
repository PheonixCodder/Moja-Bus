# QA Audit: High-Coupling & Regression Risk Zones

## 1. Regression Risk Map

The following core modules exhibit high coupling across multiple workflows:

```mermaid
graph TD
    SCHEMA_DRV[packages/schemas/src/drivers.ts]
    LIB_ASSIGN[apps/web/lib/driver-assignment.ts]
    LIB_RUN[apps/web/lib/driver-run-state.ts]
    SRV_CHK[apps/web/features/driver/services/driver-check-in-service.ts]

    SCHEMA_DRV -->|Imports| APP_MOB[apps/driver-app]
    SCHEMA_DRV -->|Imports| APP_WEB[apps/web ERP]
    LIB_ASSIGN -->|Affects| TRPC_TRIP[tripsRouter.assignDriver]
    LIB_ASSIGN -->|Affects| CRON_DEL[Delay Revalidation]
    LIB_RUN -->|Affects| TRPC_DRV[driversRouter.completeTrip]
    LIB_RUN -->|Affects| DISP_BRD[Operator Dispatch Board]
    SRV_CHK -->|Affects| SCAN_MOB[Mobile Scanner]
    SRV_CHK -->|Affects| MAN_WEB[Web Manifest Check-in]
```

---

## 2. Critical Regression Zones

1. **`packages/schemas/src/drivers.ts`**: Altering enums (`DriverStatus`, `LicenseCategory`) or constants (`DRIVER_TURNAROUND_BUFFER_MINUTES`) directly affects mobile UI, web ERP, backend assignment engines, and database migrations.
2. **`apps/web/lib/driver-run-state.ts`**: Modifying `convergeDriversAfterRunEnd` risks resurrecting the "ghost bus" defect on live maps if edge cases are omitted.
