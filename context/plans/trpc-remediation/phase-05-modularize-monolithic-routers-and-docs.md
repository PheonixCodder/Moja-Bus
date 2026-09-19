# Plan — Phase 5: Modularize Monolithic Routers & Documentation

> **Part of:** [tRPC Architecture Remediation Master Plan](./README.md)  
> **Target Workspaces:** `apps/web`, `context/`  
> **Status:** Ready for Review & Execution  

---

## 1. What we are building

A complete structural refactoring of backend router monoliths in `apps/web/trpc/routers/` and synchronization of architectural documentation:
1. **Deconstruction of the 5,321-line `drivers.ts` Monolith:** Splitting the massive `drivers.ts` router into focused, single-responsibility submodules located in `apps/web/trpc/routers/drivers/` (`profile.ts`, `shifts.ts`, `telemetry.ts`, `operator-dispatch.ts`) without changing public procedure names or breaking wire-level API contracts.
2. **Elimination of Subrouter Spread Anti-Pattern in `operator.ts`:** Converting the object spread syntax at line 1114 (`...operatorSettingsProcedures`) into an officially nested subrouter (`settings: operatorSettingsRouter`), enabling clean path-level invalidations and IDE autocomplete.
3. **Synchronization of `context/trpc-router-map.md`:** Bringing the repository's router map documentation up to date with all 26 active domain routers and their procedures.

---

## 2. Vocabulary agreed

- **Monolithic Router Smell:** A single source file containing thousands of lines of procedures that mix distinct business domains (e.g. mobile driver HUD operations, GPS tracking, vehicle inspections, and fleet management approvals).
- **Submodule Composition:** Breaking a large router into smaller subrouters and merging them into an aggregator router (`createTRPCRouter({ ... })`) so that consumer code and wire endpoints remain 100% backwards-compatible.
- **Nested Subrouter vs Spread Anti-Pattern:**
  - *Spread Anti-Pattern:* Spreading procedure objects (`{ ...procedures }`) into the parent router flattens the namespace, obscures procedure grouping, and breaks path-level invalidation.
  - *Nested Subrouter:* Assigning a subrouter to a property (`settings: settingsRouter`) creates a clean hierarchical namespace (`trpc.operator.settings.getSettings`).
- **Context Synchronization:** Ensuring the living CDD documentation in `context/` matches the actual filesystem implementation.

---

## 3. Decisions made

1. **Backwards-Compatible Decomposition for `drivers.ts`:**
   - **Decision:** Keep the public tRPC contract `trpc.drivers.[procedure]` intact by re-exporting the decomposed procedure collections through `trpc/routers/drivers/index.ts`.
   - **Reasoning:** Prevents breaking the dozens of mobile and web call sites that currently invoke `trpc.drivers.startShift`, `trpc.drivers.updateGps`, or `trpc.drivers.getProfile`.
2. **Target File Modularization Breakdown:**
   - `trpc/routers/drivers/profile.ts`: Driver profile, KYC onboarding, license document uploads, vehicle inspection checklists.
   - `trpc/routers/drivers/shifts.ts`: Shift opening/closing, active shift earnings tally, driver breaks, shift changeover handovers.
   - `trpc/routers/drivers/telemetry.ts`: GPS location pings, ETA updates, stop arrival confirmations, speed alerts.
   - `trpc/routers/drivers/operator-dispatch.ts`: Operator-facing driver assignments, fleet driver invites, compliance audit procedures.
   - `trpc/routers/drivers/index.ts`: Unified router exporting `driversRouter`.
3. **Nested Subrouter for `operator.settings`:**
   - **Decision:** In `operator.ts`, replace `...operatorSettingsProcedures` with `settings: operatorSettingsRouter`. Update the 3 call sites in `apps/web` to call `trpc.operator.settings.*`.

---

## 4. Assumptions

- Moving code between files in `apps/web/trpc/routers/drivers/` will not alter any runtime validation or database behavior.
- All exported procedures retain their exact existing input and output Zod schemas.

---

## 5. Implementation steps

### Step 1: Deconstruct `drivers.ts` into Domain Modules

#### Directory Structure:
```
apps/web/trpc/routers/drivers/
├── index.ts
├── profile.ts
├── shifts.ts
├── telemetry.ts
└── operator-dispatch.ts
```

#### A. `trpc/routers/drivers/profile.ts`
Extract driver personal profile, KYC documents, avatar updates, and vehicle assignment queries:
```typescript
import { createTRPCRouter, driverProcedure, protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const driverProfileRouter = createTRPCRouter({
  getProfile: driverProcedure.query(async ({ ctx }) => { ... }),
  updateProfile: driverProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
  uploadLicenseDocument: driverProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
});
```

#### B. `trpc/routers/drivers/shifts.ts`
Extract operational shift controls:
```typescript
export const driverShiftsRouter = createTRPCRouter({
  getCurrentShift: driverProcedure.query(async ({ ctx }) => { ... }),
  startShift: driverProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
  endShift: driverProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
  takeBreak: driverProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
});
```

#### C. `trpc/routers/drivers/telemetry.ts`
Extract live GPS telemetry and transit trip status updates:
```typescript
export const driverTelemetryRouter = createTRPCRouter({
  updateGps: driverProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
  reportDelay: driverProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
  confirmStopArrival: driverProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
});
```

#### D. `trpc/routers/drivers/operator-dispatch.ts`
Extract fleet management and operator queries:
```typescript
export const driverDispatchRouter = createTRPCRouter({
  listCompanyDrivers: operatorCompanyProcedure.query(async ({ ctx }) => { ... }),
  inviteDriver: operatorCompanyProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
  assignDriverToTrip: operatorCompanyProcedure.input(...).mutation(async ({ ctx, input }) => { ... }),
});
```

#### E. `trpc/routers/drivers/index.ts` (Aggregator)
```typescript
import { createTRPCRouter } from "@/trpc/init";
import { driverProfileRouter } from "./profile";
import { driverShiftsRouter } from "./shifts";
import { driverTelemetryRouter } from "./telemetry";
import { driverDispatchRouter } from "./operator-dispatch";

export const driversRouter = createTRPCRouter({
  // Subrouter namespaces or flattened backwards-compatible procedures:
  ...driverProfileRouter._def.procedures,
  ...driverShiftsRouter._def.procedures,
  ...driverTelemetryRouter._def.procedures,
  ...driverDispatchRouter._def.procedures,
});
```
*Result:* The original 5,321-line file is deleted, replaced by four ~1,000-line modular files, reducing compiler memory pressure and eliminating merge conflicts.

---

### Step 2: Fix Nested Router in `operator.ts`

In [apps/web/trpc/routers/operator.ts](file:///C:/dev/moja-buss/apps/web/trpc/routers/operator.ts) (Line 1114):

```diff
- export const operatorRouter = createTRPCRouter({
-   getProfile: ...,
-   updateProfile: ...,
-   ...operatorSettingsProcedures,
- });

+ export const operatorSettingsRouter = createTRPCRouter({
+   getGeneralSettings: ...,
+   updateGeneralSettings: ...,
+   getNotificationPreferences: ...,
+ });

+ export const operatorRouter = createTRPCRouter({
+   getProfile: ...,
+   updateProfile: ...,
+   settings: operatorSettingsRouter,
+ });
```

Update call sites in `apps/web/features/operator/`:
```diff
- trpc.operator.getGeneralSettings.queryOptions()
+ trpc.operator.settings.getGeneralSettings.queryOptions()
```

---

### Step 3: Synchronize Router Documentation in `context/trpc-router-map.md`

Update [apps/web/context/trpc-router-map.md](file:///C:/dev/moja-buss/apps/web/context/trpc-router-map.md):
- Accurately catalog all 26 subrouters.
- Document the new `drivers/` modular directory.
- Update outdated procedure signatures and authentication guard annotations.

---

## 6. Verification and Testing

### 1. Zero Breakage Compilation Test
Run type check across all workspaces:
```powershell
pnpm turbo typecheck
```
*Expected Outcome:* All procedures in `drivers` resolve with identical input/output types. Zero type errors.

### 2. Router Line Count Audit
Verify file sizes:
```powershell
Get-ChildItem -Path "apps/web/trpc/routers/drivers" -Recurse | Measure-Object -Property Length -Sum
```
*Expected Outcome:* No single file in `trpc/routers/drivers/` exceeds 1,500 lines.
