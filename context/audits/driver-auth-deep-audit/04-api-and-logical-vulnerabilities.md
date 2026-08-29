# 04. API Vulnerabilities, Logical Loopholes, & Edge Cases

This document details all discovered API vulnerabilities, tRPC procedure flaws, concurrency risks, and logical loopholes across the driver authentication and registration pipeline.

---

## 1. Vulnerability Inventory

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 VULNERABILITY & GAP CATALOG                                      │
├─────────────┬──────────┬──────────────────────┬──────────────────────────────────────────────────┤
│ ID          │ Severity │ Subsystem            │ Vulnerability Summary                            │
├─────────────┼──────────┼──────────────────────┼──────────────────────────────────────────────────┤
│ VULN-DRV-01 │ Critical │ driver-app Auth Gate │ Unregistered driver trapped in FORBIDDEN loop    │
│ VULN-DRV-02 │ Critical │ KYC / Storage        │ Local file:// URI stored in User.image (Selfie)  │
│ VULN-DRV-03 │ Major    │ Mobile Wizard        │ Wizard steps lack prerequisite route guards      │
│ VULN-DRV-04 │ Major    │ Phone Verification   │ False-positive PHONE_REVERIFICATION_REQUIRED     │
│ VULN-DRV-05 │ Major    │ Affiliation DB       │ Race condition in self-register exclusive upsert │
│ VULN-DRV-06 │ Medium   │ Document Viewing     │ 5-minute presigned GET TTL timeout on review     │
└─────────────┴──────────┴──────────────────────┴──────────────────────────────────────────────────┘
```

---

## 2. Technical Breakdown of Vulnerabilities

### VULN-DRV-01: Unregistered Driver Trapped in `FORBIDDEN` Error Loop

- **Location**: [`apps/driver-app/features/auth/screens/login.tsx`](file:///C:/dev/moja-buss/apps/driver-app/features/auth/screens/login.tsx#L43-L174), [`apps/web/trpc/init.ts`](file:///C:/dev/moja-buss/apps/web/trpc/init.ts#L287-L293)
- **Root Cause**:
  1. Driver logs in with a new phone number via SMS OTP in `(auth)/login`.
  2. Better Auth creates a `User` record with default role `TRAVELER`.
  3. `login.tsx` executes `router.replace(destination)` where `destination` defaults to `/(tabs)/trips`.
  4. `TripsView` loads and calls `trpc.drivers.getMyTrips`.
  5. `driverProcedure` in `init.ts` attempts to load `DriverProfile`. Because none exists for this user, it throws:
     ```ts
     throw new TRPCError({
       code: "FORBIDDEN",
       message: "Driver profile not found. Please complete driver registration first.",
     });
     ```
  6. `TripsView` catches the tRPC error into React Query `error` state and renders an error banner without redirecting to `/(auth)/register`.
- **Impact**: The driver is permanently stuck on an unhandled error screen and cannot easily reach the 4-step registration wizard without manually typing deep-link URLs.

---

### VULN-DRV-02: Local `file://` URI Leakage to Production Database

- **Location**: [`apps/driver-app/app/(auth)/register/index.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/index.tsx#L63), [`apps/web/trpc/routers/drivers.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/drivers.ts#L1487)
- **Root Cause**:
  - `ImagePicker` in Step 1 generates a local file URI (e.g. `file:///var/mobile/Containers/Data/Application/.../selfie.jpg`).
  - Unlike Steps 2 & 3, Step 1 does not invoke `uploadCapturedDocument` with `purpose: "driver-selfie"`.
  - In `registerDriver`, the server executes:
    ```ts
    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        ...(input.selfieUrl ? { image: input.selfieUrl } : {}),
      },
    });
    ```
- **Impact**: The user's avatar stores a dead device-local path. All passenger trip cards, operator driver lists, and admin verification cards fail to render the driver's face photo.

---

### VULN-DRV-03: Missing Wizard Route Guards & State Persistence

- **Location**: [`apps/driver-app/app/(auth)/register/license.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/license.tsx), [`carrier.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/carrier.tsx), [`stores/driver-registration.ts`](file:///C:/dev/moja-buss/apps/driver-app/stores/driver-registration.ts)
- **Root Cause**:
  - Zustand store is held in volatile memory only.
  - Steps 2, 3, and 4 contain zero validation confirming that previous steps populated required store fields.
  - If a user deep links to `carrier.tsx` or the mobile OS recycles memory in the background, submitting Step 4 sends empty strings to `registerDriver`.
- **Impact**: Server throws Zod validation errors, showing a confusing French alert *"Erreur d'inscription"* without directing the driver back to Step 1.

---

### VULN-DRV-04: False-Positive `PHONE_REVERIFICATION_REQUIRED` via Whitespace/Formatting

- **Location**: [`apps/web/trpc/routers/drivers.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/drivers.ts#L1470-L1480)
- **Code**:
  ```ts
  if (
    ctx.user.phoneNumber &&
    ctx.user.phoneNumber !== input.phone &&
    ctx.user.phoneNumber !== normalizedPhone
  ) {
    const mask = (p: string) => `${p.slice(0, 5)}••••${p.slice(-2)}`;
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `PHONE_REVERIFICATION_REQUIRED::${mask(ctx.user.phoneNumber)}::${mask(normalizedPhone)}`,
    });
  }
  ```
- **Root Cause**: If `ctx.user.phoneNumber` in the database was stored in a slightly different format (e.g. without `+225` prefix or containing spaces from social/legacy signup), comparing `ctx.user.phoneNumber !== normalizedPhone` can throw a false-positive mismatch error even when the driver entered the exact same number.

---

### VULN-DRV-05: Race Condition in Exclusive Affiliation Upsert

- **Location**: [`apps/web/trpc/routers/drivers.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/drivers.ts#L1535-L1570)
- **Scenario**:
  1. A driver self-registers on `driver-app` with carrier invite code `COMP-A` under `EXCLUSIVE_INTERCITY`.
  2. Simultaneously, Operator `COMP-B` adds the driver to their roster via `createDriver` under `EXCLUSIVE_INTERCITY`.
  3. If both requests arrive concurrently, the database partial unique index raises a `P2002` constraint error.
  4. In `registerDriver`, the `P2002` error is not caught with custom handling (unlike `createDriver`), resulting in an unhandled internal server error (`500 INTERNAL_SERVER_ERROR`).
