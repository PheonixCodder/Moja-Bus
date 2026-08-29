# 05. Remediation Blueprint & Action Plan

This document outlines the concrete code changes, architectural fixes, and testing verification runbook required to remediate all findings from the Driver Authentication Deep Audit.

---

## 1. Remediation Action Plan

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   REMEDIATION ROADMAP                                            │
├───────┬───────────────────────────────┬───────────────────────────────┬──────────────────────────┤
│ Phase │ Target Fix                    │ Affected Files                │ Severity                 │
├───────┼───────────────────────────────┼───────────────────────────────┼──────────────────────────┤
│ 1     │ Boot & Login Routing Fix      │ apps/driver-app/login.tsx     │ P1 (Critical)            │
│       │                               │ apps/driver-app/app/index.tsx │                          │
│ 2     │ S3 Presigned Selfie Upload    │ apps/driver-app/index.tsx     │ P1 (Critical)            │
│       │                               │ driver-doc-access.ts          │                          │
│ 3     │ Wizard Guards & Persistence   │ stores/driver-registration.ts │ P2 (Major)               │
│       │                               │ app/(auth)/register/*.tsx     │                          │
│ 4     │ Server Phone & Race Hardening │ apps/web/routers/drivers.ts   │ P2 (Major)               │
│ 5     │ Native Date Picker & Mask     │ apps/driver-app/license.tsx   │ P3 (Polish)              │
└───────┴───────────────────────────────┴───────────────────────────────┴──────────────────────────┘
```

---

## 2. Detailed Technical Fix Blueprints

### Fix 1: Boot & Login Routing Gate ([`apps/driver-app/features/auth/screens/login.tsx`](file:///C:/dev/moja-buss/apps/driver-app/features/auth/screens/login.tsx))

**Problem**: New users are redirected directly to `/(tabs)/trips`, triggering a `FORBIDDEN` error.

**Remediation Blueprint**:
1. After successful OTP verification in `handleVerifyOtp`, query whether the user already has a `DriverProfile`.
2. If `DriverProfile` is missing, redirect to `/(auth)/register`.
3. If `DriverProfile` exists with `verificationStatus === "PENDING"`, redirect to `/(auth)/register/status`.
4. If `DriverProfile` exists with `verificationStatus === "VERIFIED"`, redirect to `/(tabs)/trips`.

```ts
// Blueprint in login.tsx:
const profileStatus = await queryClient.fetchQuery(
  trpc.drivers.getMyVerificationStatus.queryOptions()
).catch(() => null);

if (!profileStatus?.driver) {
  router.replace("/(auth)/register");
} else if (profileStatus.driver.verificationStatus !== "VERIFIED") {
  router.replace("/(auth)/register/status");
} else {
  router.replace(destination);
}
```

---

### Fix 2: S3 Presigned Upload for Selfie ([`apps/driver-app/app/(auth)/register/index.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/index.tsx))

**Problem**: Step 1 stores a local `file://` URI in the database.

**Remediation Blueprint**:
1. Add `"driver-selfie"` to `DRIVER_DOC_TYPES` in [`driver-doc-access.ts`](file:///C:/dev/moja-buss/apps/web/features/driver/lib/driver-doc-access.ts).
2. In `register/index.tsx`, when `launchCameraAsync` returns a photo, immediately call `uploadCapturedDocument` with `purpose: "driver-selfie"`.
3. Store the returned S3 object key (`documents/drivers/...`) in `useDriverRegistrationStore.profileSelfieUri`.

```ts
// Blueprint in index.tsx:
const storedKey = await uploadCapturedDocument({
  presign: presign.mutateAsync as never,
  localUri,
  fileName: "selfie-avatar.jpg",
  purpose: "driver-selfie",
});
if (!storedKey) {
  Alert.alert("Échec de téléversement", "Impossible d'envoyer la photo d'identité. Réessayez.");
  return;
}
setSelfieKey(storedKey);
updateData({ profileSelfieUri: storedKey });
```

---

### Fix 3: Registration Store Persistence & Step Route Guards

**Problem**: In-memory state is wiped if the app is backgrounded; users can skip steps.

**Remediation Blueprint**:
1. Wrap `useDriverRegistrationStore` with Zustand `persist` using `@react-native-async-storage/async-storage`.
2. Create a custom hook `useWizardStepGuard(currentStep)`:
   - Step 2 checks `fullName` and `phone`.
   - Step 3 checks `licenseNumber` and `licenseExpiryDate`.
   - Step 4 checks `nationalIdNumber`.
   - If missing, immediately redirects back to the first incomplete step with a guidance toast.

---

### Fix 4: Server Phone Normalization & P2002 Error Handling ([`drivers.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/drivers.ts))

**Problem**: Format mismatches cause false `PHONE_REVERIFICATION_REQUIRED` errors, and concurrent exclusive affiliations throw raw `500` errors.

**Remediation Blueprint**:
1. Normalize `ctx.user.phoneNumber` with `toE164(ctx.user.phoneNumber, "+225")` before comparing with `normalizedPhone`.
2. Wrap `ctx.prisma.driverCompanyAffiliation.upsert` in `registerDriver` with a try/catch block matching Prisma code `P2002` to return a user-friendly `CONFLICT` exception explaining that the driver is already exclusively affiliated with another carrier.

---

## 3. Verification & Test Runbook

### Probe Matrix

| Test Case | Method | Expected Result |
| :--- | :--- | :--- |
| **New Driver Registration** | Mobile App | Logs in with SMS OTP → Auto-redirected to Step 1 → Completes 4 steps → Landed on `register/status` with `PENDING` state. |
| **Selfie Asset Rendering** | Web Admin | Admin opens driver dossier → Selfie renders from presigned S3 URL without broken image icon. |
| **Step 4 Direct Navigation** | Mobile App | Deep-link to `register/carrier` with empty store → Auto-redirected to `register/index` with validation toast. |
| **Background Memory Test** | Mobile App | User captures license in Step 2, backgrounds app, opens 3 other apps, returns → Captured photos remain intact in state. |
| **Operator Verification Gate**| Web Operator| Operator opens `VerifyDriverDialog` for driver with 0 docs → "Approve & Verify" button is disabled. |
| **Driver Suspension Teardown**| Web Admin | Admin clicks "Suspend" on active driver → Active shift closed, dispatches unassigned, status set to `SUSPENDED`. |
