# 03. Driver Subsystem Deep Dive: Architecture, Flows, & Lifecycle

This module delivers a comprehensive audit of the Driver Subsystem across both operational models: **Operator-provisioned roster drivers** and **mobile self-registered drivers**.

---

## 1. Driver Architecture & Data Model

The driver ecosystem is decoupled from the operator ERP system. Roster drivers do not hold ERP seats or [`Operator`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L759) rows. Instead, the driver's identity and operational capabilities are modeled through five distinct tables:

```
                  ┌────────────────────────┐
                  │       User Record      │
                  │  (Role: DRIVER/TRAVELER│
                  └───────────┬────────────┘
                              │ 1:1
                              ▼
                  ┌────────────────────────┐
                  │     DriverProfile      │
                  │ (License, Score, Status│
                  └───────────┬────────────┘
                              │
             ┌────────────────┼────────────────┐
             │ 1:N            │ 1:N            │ 1:N
             ▼                ▼                ▼
┌────────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│DriverCompanyAffiliation│ │DriverEmploymentOffer │ │     DriverShift      │
│  (Company Tenancy,     │ │ (Marketplace Offers, │ │ (Work Ledger, Start/ │
│   Pay Model, Exclusive)│ │  Salary, Status)     │ │  End, Active Clock)  │
└────────────────────────┘ └──────────────────────┘ └──────────────────────┘
             │                │
             │                ▼
             │     ┌──────────────────────┐
             │     │DriverServicePreference│
             │     │ (Marketplace Listing,│
             │     │  City Base, Corridors│
             │     └──────────────────────┘
             ▼
┌────────────────────────┐
│  TripDriverAssignment  │
│  (PRIMARY/RELIEF/COND) │
│  (Urgent Dispatch Ack) │
└────────────────────────┘
```

---

## 2. Flow A: Operator Provisioning a Roster Driver (`createDriver`)

Operators onboard drivers directly from the Operator Dashboard via `trpc.drivers.createDriver` ([`apps/web/trpc/routers/drivers.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/drivers.ts#L637-L839)).

```
[Operator Dashboard: Add Driver] ──► drivers.createDriver Mutation
                                                  │
                                                  ▼
                         1. Disjoint Matching (Email vs Phone separately)
                                                  │
            ┌─────────────────────────────────────┴─────────────────────────────────────┐
            ▼                                                                           ▼
   [Ambiguous Match]                                                          [Single / No Match]
(Email -> User A, Phone -> User B)                                                      │
Throw CONFLICT (AMBIGUOUS_BINDING)                                                      ▼
                                                                     2. Existing User Binding Check
                                                                     (Throws CONFLICT if confirmBinding=false)
                                                                                        │
                                                                                        ▼
                                                                     3. Atomic Transaction ($transaction):
                                                                        a. Create User (role: DRIVER) if new
                                                                        b. Create DriverProfile (PENDING)
                                                                        c. Upsert DriverCompanyAffiliation
                                                                        d. Enforce Single-Active-Exclusive
                                                                                        │
                                                                                        ▼
                                                                     4. Return Affiliation & Masked Info
```

### Key Logic & Hardening Invariants:

1. **Disjoint Identity Matching**:
   - Matches `email` and `phone` separately.
   - If `emailUser` and `phoneUser` exist and point to different accounts, returns `CONFLICT: AMBIGUOUS_BINDING` with masked credentials.
2. **Explicit Binding Confirmation**:
   - If an existing user matches, server requires `confirmBinding: true` to prevent accidental account linkage without operator awareness.
3. **Placeholder Account Creation**:
   - When no existing user exists, server creates a placeholder `User` with `role: "DRIVER"` and `id: usr_${Date.now()}_...`.
4. **Single-Active-Exclusive Invariant**:
   - When `employmentType === "EXCLUSIVE_INTERCITY"`, the DB partial unique index enforces that the driver has only one active exclusive carrier.
   - If violated, the database `P2002` error is caught and converted to a clean `CONFLICT` message instructing the operator to terminate the prior affiliation.
5. **Zero ERP Over-Provisioning**:
   - Confirmed in code: `createDriver` creates **zero** `Operator` rows and grants **zero** ERP permissions.

---

## 3. Flow B: Mobile Driver Self-Registration (`driver-app`)

Drivers can register independently using the 5-step registration wizard inside [`apps/driver-app`](file:///C:/dev/moja-buss/apps/driver-app).

```
[Mobile Login] ──► SMS OTP ──► New User Detected ──► Register Wizard
                                                           │
┌──────────────────────────────────────────────────────────┘
│
├──► Step 1: Personal Identity & Selfie (register/index.tsx)
│    - Full Name, Phone, Years of Experience
│    - Square Selfie Photo Capture (expo-image-picker)
│
├──► Step 2: Driver's License & Photos (register/license.tsx)
│    - Category selection (B / C / D / E)
│    - License number & Expiration date
│    - Recto & Verso photo capture -> S3 Presigned Upload (uploadCapturedDocument)
│
├──► Step 3: Legal Compliance Documents (register/documents.tsx)
│    - National ID (CNI / Passport number)
│    - Medical Aptitude Certificate photo -> S3 Presigned Upload
│
├──► Step 4: Carrier Affiliation & Contract (register/carrier.tsx)
│    - Work modality: EXCLUSIVE_INTERCITY / CONTRACTOR_URBAN / HYBRID
│    - Optional Carrier Invite Code (e.g. "UTB-CI-9901" or company slug)
│    - Submits trpc.drivers.registerDriver
│
└──► Step 5: Compliance Status Gate (register/status.tsx)
     - Polls trpc.drivers.getMyVerificationStatus every 10s
     - PENDING: Info card, reference code, wait for operator verification
     - VERIFIED: Green banner, CTA -> /(tabs)/trips (Dispatches)
     - REJECTED: Reason display, CTA -> Resubmit
     - SUSPENDED: Red banner, support hotline link, sign-out button
```

### Detailed Wizard Steps:

#### Step 1: Personal Identity ([`apps/driver-app/app/(auth)/register/index.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/index.tsx))
- Collects `fullName`, `phone`, `yearsOfExperience`.
- Prompts driver to capture a square, high-contrast face selfie for passenger manifest displays and driver badge.
- Persists to Zustand [`useDriverRegistrationStore`](file:///C:/dev/moja-buss/apps/driver-app/stores/driver-registration.ts).

#### Step 2: License Details ([`apps/driver-app/app/(auth)/register/license.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/license.tsx))
- Category Selection:
  - **Category D**: Long-distance intercity buses (Standard).
  - **Category E**: Articulated passenger coaches.
  - **Category C**: Heavy commercial transport.
  - **Category B**: Urban shuttles & light minibuses.
- Recto & Verso Photo Capture:
  - Calls `ImagePicker.launchCameraAsync`.
  - Automatically requests S3 presigned upload URL via `trpc.storage.presignUpload`.
  - Uploads document payload directly via `uploadCapturedDocument` ([`apps/driver-app/lib/driver-doc-upload.ts`](file:///C:/dev/moja-buss/apps/driver-app/lib/driver-doc-upload.ts)).

#### Step 3: Legal Verification Documents ([`apps/driver-app/app/(auth)/register/documents.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/documents.tsx))
- Captures National ID number (`nationalIdNumber` on `DriverProfile`).
- Captures official Medical Aptitude Certificate (`medicalDocUrl`), required for long-distance highway routes.

#### Step 4: Affiliation & Submission ([`apps/driver-app/app/(auth)/register/carrier.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/carrier.tsx))
- Carrier Invitation Resolution:
  - If a carrier code is provided, server queries active company by `slug` or `id`.
  - If matched, creates active `DriverCompanyAffiliation` linked to the company.
  - If no code is entered, the driver profile is created without initial affiliation, and marketplace preferences are activated.
- Phone Re-Verification Security Gate:
  - Server validates phone via `getPhoneValidationError` and `toE164`.
  - If the authenticated session phone does not match the submitted profile phone, server throws `PHONE_REVERIFICATION_REQUIRED` to prevent account hijacking.

#### Step 5: Verification Gate ([`apps/driver-app/app/(auth)/register/status.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/status.tsx))
- Boot Gate in [`apps/driver-app/app/index.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/index.tsx):
  - Checks session validity via `authClient.getSession()`.
  - Checks if driver has marketplace preferences via `drivers.getMyServicePreference`.
  - Unauthenticated → `/(auth)/login`.
  - Needs Preference → `/(auth)/preferences`.
  - Authenticated → `/(tabs)/trips`.

---

## 4. Driver Operational State Machine

```
              ┌──────────────────────────────────────────────┐
              │                   OFFLINE                    │
              └───────────────┬───────────────▲──────────────┘
                              │               │
                  toggleShift │               │ toggleShift (End Shift)
                              ▼               │
              ┌───────────────────────────────┴──────────────┐
              │                  AVAILABLE                   │
              └───────────────┬───────────────▲──────────────┘
                              │               │
                    startTrip │               │ completeTrip
                              ▼               │
              ┌───────────────────────────────┴──────────────┐
              │                   ON_TRIP                    │
              │         (Broadcasting GPS Pings)             │
              └───────────────┬──────────────────────────────┘
                              │
              suspendDriverOperationalState (Teardown)
                              ▼
              ┌──────────────────────────────────────────────┐
              │                  SUSPENDED                   │
              │         (Read-Only, Zero Mutations)          │
              └──────────────────────────────────────────────┘
```

### State Authorities & Invariants:
1. **`updateMyStatus` Procedure**: Single-authority matrix; prevents hand-editing state mid-run or during an open shift.
2. **`toggleShift` Procedure**:
   - Opening shift: Checks for unclosed shifts, requires `verificationStatus === "VERIFIED"`, sets driver status to `AVAILABLE` or `ON_DUTY`.
   - Closing shift: Calculates total minutes, calculates shift earnings in XOF, closes active shift, transitions driver to `OFFLINE`.
3. **`startTrip` Procedure**:
   - Enforces license usability against trip `estimatedArrival` date via `isLicenseUsableThrough`.
   - Mints signed short-lived Telemetry Dispatch JWT token (`mintTelemetryDispatchTokenWithCompany`).
   - Transitions driver status to `ON_TRIP` and sets `currentTripId`.
4. **`completeTrip` Procedure**:
   - Reconciles post-run status via `resolvePostRunStatus`.
   - If an open shift exists, returns to `AVAILABLE`; otherwise returns to `OFFLINE`.
   - Clears `currentTripId` to prevent ghost active trip states.
5. **Emergency Teardown (`suspendDriverOperationalState`)**:
   - Atomically called when a driver is suspended or rejected.
   - Force-closes open shifts with timestamp note.
   - Clears `currentTripId` and sets status to `SUSPENDED` or `OFFLINE`.

---

## 5. Telemetry & Live HUD Authentication

- Telemetry ingest uses **signed short-lived dispatch JWTs**, completely separated from Better Auth cookies.
- Token Minting:
  ```ts
  const token = mintTelemetryDispatchTokenWithCompany({
    driverProfileId: ctx.driver.id,
    tripId: input.tripId,
    companyId: trip.companyId,
    expiresInSeconds: 14400, // 4 hours
  });
  ```
- Telemetry Ingest Guard:
  - Telemetry gateway verifies JWT signature.
  - Enforces room ACLs: driver can only publish to `trip:${claims.t}` and `operator:${claims.c}:fleet`.
