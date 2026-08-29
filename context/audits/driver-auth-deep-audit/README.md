# Moja Ride — Driver Authentication & Onboarding Subsystem Deep Audit

**Audit Target**: Complete Driver Authentication, Self-Registration Wizard, Operator Provisioning, Platform Verification, UI Guards, and Data Integrity across [`apps/driver-app`](file:///C:/dev/moja-buss/apps/driver-app), [`apps/web`](file:///C:/dev/moja-buss/apps/web), [`packages/schemas`](file:///C:/dev/moja-buss/packages/schemas), and [`packages/db`](file:///C:/dev/moja-buss/packages/db).  
**Status**: ACTIVE AUDIT  
**Date**: 2026-08-29  
**Audit Classification**: Enterprise Mobility, Security, and Compliance  

---

## 1. Executive Summary

This deep audit investigates the driver lifecycle within Moja Ride. Commercial drivers represent the core operational backbone of the transportation platform. Because drivers operate physical passenger coaches, handle ticket validations, and broadcast live GPS telemetry, the driver authentication and registration pipeline is subject to strict regulatory, safety, and operational invariants.

The platform provides **two distinct pathways** for commercial driver onboarding:
1. **Driver Self-Service Registration** (`apps/driver-app`): Driver downloads the mobile app, authenticates via SMS OTP, completes a 4-step compliance registration wizard, and waits in a compliance gate (`register/status.tsx`).
2. **Operator Fleet Provisioning** (`apps/web/features/operator`): Transport company managers add drivers directly to their roster via `trpc.drivers.createDriver`. The driver receives an onboarding SMS and logs into the mobile app to accept dispatches.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DRIVER ONBOARDING DUALITY                                      │
├──────────────────────────────────────┬───────────────────────────────────────────────────────────┤
│ Driver Self-Registration             │ Operator Fleet Provisioning                               │
│ (apps/driver-app)                    │ (apps/web - Operator Dashboard)                           │
├──────────────────────────────────────┼───────────────────────────────────────────────────────────┤
│ • Entry: Mobile Phone SMS OTP        │ • Entry: Operator Web Dashboard (Add Driver Modal)        │
│ • State: In-Memory Zustand Store     │ • State: Server-Side Atomic $transaction                  │
│ • Form: 4-Step Mobile Wizard         │ • Form: Web Dialog with Account Binding Verification      │
│ • S3 Docs: Camera Capture + Upload   │ • S3 Docs: File Upload + S3 Presign Pipeline              │
│ • Affiliation: Optional Invite Code  │ • Affiliation: Direct Active DriverCompanyAffiliation     │
│ • Result: DriverProfile (PENDING)    │ • Result: User (DRIVER) + DriverProfile + Affiliation     │
└──────────────────────────────────────┴───────────────────────────────────────────────────────────┘
```

---

## 2. Audit Document Index

The audit findings and architectural recommendations are organized into the following modules:

1. **[01-driver-onboarding-flows.md](./01-driver-onboarding-flows.md)** — Comprehensive comparative flow analysis:
   - Self-service mobile registration step-by-step.
   - Operator roster driver provisioning (`createDriver` procedure).
   - Ambiguous identity resolution (email vs phone collision).
   - Driver initial login and session boot gating.
2. **[02-ui-guards-and-form-integrity.md](./02-ui-guards-and-form-integrity.md)** — Exhaustive UI audit of the mobile registration wizard:
   - Missing route guards (direct navigation with empty state).
   - Local `file://` URI leakage on Step 1 selfie uploads.
   - In-memory state volatility on app minimization.
   - Form validation gaps and missing input masks.
3. **[03-verification-and-governance.md](./03-verification-and-governance.md)** — Compliance and KYC verification:
   - Operator verification dialog (`verifyDriver`).
   - Platform Admin verification dossier (`admin.verifyDriver`).
   - Document presigning security & namespace guards (`driver-doc-mint`).
   - Operational teardown on suspension (`suspendDriverOperationalState`).
4. **[04-api-and-logical-vulnerabilities.md](./04-api-and-logical-vulnerabilities.md)** — Critical API vulnerabilities, logical loopholes, and tRPC procedure flaws:
   - Unhandled `FORBIDDEN` loop when unregistered users hit `(tabs)/trips`.
   - Single-active exclusive race conditions.
   - Phone re-verification mismatch messaging.
   - Presigned upload TTL and error recovery.
5. **[05-remediation-blueprint.md](./05-remediation-blueprint.md)** — Prioritized remediation roadmap, code refactoring blueprints, and validation test plan.

---

## 3. High-Risk Findings Summary (Top 6)

| Finding ID | Severity | Category | Summary |
| :--- | :--- | :--- | :--- |
| **F-DRV-01** | **P1 (Critical)** | Data Leakage / KYC | **Selfie Photo Not Uploaded to S3 in Step 1**: `register/index.tsx` stores a raw local `file://` URI in the registration store and saves it to `User.image`. The selfie fails to display on web dashboards and other devices. |
| **F-DRV-02** | **P1 (Critical)** | Navigation / Loophole | **Unregistered Driver Infinite Error State on Login**: When a new user logs in via phone OTP in `driver-app`, `login.tsx` redirects to `/(tabs)/trips` instead of `/(auth)/register`. `getMyTrips` throws `FORBIDDEN: Driver profile not found`, trapping the user on an error screen. |
| **F-DRV-03** | **P2 (Major)** | UI Guard / Validation | **Missing Wizard Route Guards**: Steps 2, 3, and 4 do not verify whether prior wizard steps were completed. Users navigating back and forth or refreshing submit empty/invalid payloads, causing unhandled server-side Zod errors. |
| **F-DRV-04** | **P2 (Major)** | State Volatility | **Volatile In-Memory Registration Store**: Zustand store in `driver-registration.ts` lacks persistence. If the app goes to the background or the OS terminates memory during document scanning, all inputs and photo keys are lost. |
| **F-DRV-05** | **P2 (Major)** | Security / KYC | **Step 1 Phone Number Discrepancy**: Step 1 allows typing an arbitrary phone number differing from the authenticated Better Auth session phone without an inline OTP challenge before reaching Step 4. |
| **F-DRV-06** | **P3 (Medium)** | UX / Localization | **Inconsistent French Error Feedback**: Better Auth OTP errors and tRPC validation exceptions in `driver-app` fall back to generic English error strings or untranslated exception codes. |
