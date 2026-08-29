# 01. Driver Onboarding & Registration Flow Analysis

This document delivers a comparative analysis of the two driver onboarding pathways supported by the Moja Ride platform: **Driver Self-Service Registration** and **Operator Fleet Provisioning**.

---

## 1. Flow Comparison Matrix

```
┌──────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────┐
│ Metric / Dimension                           │ Self-Service Mobile Registration  │ Operator Fleet Provisioning         │
├──────────────────────────────────────────────┼───────────────────────────────────┼─────────────────────────────────────┤
│ User Trigger Surface                         │ apps/driver-app (iOS/Android)     │ apps/web (Operator ERP)             │
│ Initiator                                    │ The Driver                        │ Company Owner / Fleet Admin         │
│ Identity Proof                               │ Self-reported CNI + License photo │ Operator-verified credentials       │
│ Authentication Initial State                 │ Verified Phone via SMS OTP        │ Passwordless Placeholder Account    │
│ Initial VerificationStatus                   │ PENDING                           │ PENDING                             │
│ Initial Operational Status                   │ OFFLINE                           │ OFFLINE                             │
│ Carrier Affiliation Binding                  │ Optional (Invite Code / Slug)     │ Direct & Immediate (Company Roster) │
│ Marketplace Visibility                       │ Configurable in Preferences       │ Defaults to Exclusive Intercity     │
│ Handoff Mechanism                            │ Direct Mobile UX                  │ SMS Dispatch with Phone Login Copy  │
└──────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pathway A: Driver Self-Service Registration (`apps/driver-app`)

```
[Driver Phone] ──► SMS OTP ──► Better Auth Session (Role: TRAVELER)
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │          4-STEP REGISTRATION WIZARD              │
                  ├──────────────────────────────────────────────────┤
                  │ Step 1: Full Name, Phone, Exp, Selfie Photo      │
                  │ Step 2: License #, Category, Expiry, Recto/Verso │
                  │ Step 3: National ID (CNI), Medical Certificate   │
                  │ Step 4: Mode (Exclusive/Urban/Hybrid), Code      │
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                              trpc.drivers.registerDriver
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
    [No Carrier Code Provided]                                [Valid Carrier Code Given]
    - DriverProfile Created (PENDING)                         - DriverProfile Created (PENDING)
    - DriverServicePreference Upserted                        - DriverCompanyAffiliation Upserted
    - Redirect: register/status.tsx                           - Redirect: register/status.tsx
```

### Detailed Execution Steps:

1. **Step 0 — Phone Authentication**:
   - The driver enters an Ivorian mobile number (e.g. `+225 07 00 00 00 00`) in [`apps/driver-app/features/auth/screens/login.tsx`](file:///C:/dev/moja-buss/apps/driver-app/features/auth/screens/login.tsx).
   - Better Auth sends a 6-digit SMS OTP via Novu (`auth-otp` workflow).
   - The driver submits the OTP code. Better Auth provisions or resolves the `User` record.
2. **Step 1 — Personal Demographics & Selfie** ([`register/index.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/index.tsx)):
   - Collects `fullName`, `phone`, `yearsOfExperience`.
   - Captures square face selfie via camera.
   - Saves fields to Zustand [`useDriverRegistrationStore`](file:///C:/dev/moja-buss/apps/driver-app/stores/driver-registration.ts).
3. **Step 2 — Professional Driving License** ([`register/license.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/license.tsx)):
   - Selects License Category: `D` (Coach), `E` (Articulated), `C` (Heavy), or `B` (Urban).
   - Captures license number and expiry date (`YYYY-MM-DD`).
   - Captures Recto and Verso photos. Each photo calls `uploadCapturedDocument` ([`lib/driver-doc-upload.ts`](file:///C:/dev/moja-buss/apps/driver-app/lib/driver-doc-upload.ts)), which obtains an S3 presigned PUT URL and uploads the image, storing the object key (`documents/drivers/...`).
4. **Step 3 — Legal Identity & Medical Clearance** ([`register/documents.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/documents.tsx)):
   - Captures Ivorian CNI or Passport number.
   - Captures and uploads Medical Aptitude Certificate (`driver-medical-doc`).
5. **Step 4 — Carrier Affiliation & Submission** ([`register/carrier.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/carrier.tsx)):
   - Selects work modality (`EXCLUSIVE_INTERCITY`, `CONTRACTOR_URBAN`, or `HYBRID`).
   - Optional carrier invite code (matches company `slug` or `id`).
   - Calls `trpc.drivers.registerDriver` mutation.
6. **Step 5 — Compliance Gate** ([`register/status.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/%28auth%29/register/status.tsx)):
   - Screen polls `trpc.drivers.getMyVerificationStatus` every 10 seconds.
   - Displays real-time status banner: `PENDING`, `VERIFIED`, `REJECTED`, or `SUSPENDED`.

---

## 3. Pathway B: Operator Fleet Provisioning (`apps/web`)

```
[Operator Dashboard] ──► Open AddDriverModal ──► Submit CreateDriverInput
                                                             │
                                                             ▼
                                                Disjoint Identity Search
                                                             │
                    ┌────────────────────────────────────────┴────────────────────────────────────────┐
                    ▼                                                                                 ▼
          [Ambiguous Collision]                                                          [Clean Match / No Collision]
   Email -> User A, Phone -> User B                                                                   │
   Throw AMBIGUOUS_BINDING error                                                                      ▼
                                                                                     Existing User Binding Check
                                                                                     (Requires confirmBinding: true)
                                                                                                      │
                                                                                                      ▼
                                                                                        Prisma Atomic $transaction:
                                                                                        1. Create User (role: DRIVER)
                                                                                        2. Create DriverProfile
                                                                                        3. Upsert Affiliation
                                                                                        4. Enforce Single-Active-Exclusive
                                                                                                      │
                                                                                                      ▼
                                                                                        Credential-Less SMS Handoff Dialog
```

### Key Technical Hardening in `createDriver`:

1. **Disjoint Identity Matching**:
   - Matches `email` and `phone` independently.
   - If `emailUser` and `phoneUser` resolve to different users, the transaction aborts with `AMBIGUOUS_BINDING::<maskedEmail>::<maskedPhone>`.
2. **Explicit Account Binding Confirmation**:
   - If an existing user is found (e.g. a passenger using the same phone), the server throws `EXISTING_USER_BINDING_REQUIRED` unless `confirmBinding === true`.
   - This prevents operators from silently binding a driver profile to someone else's account.
3. **Single-Active-Exclusive Invariant**:
   - A driver cannot have more than one active `EXCLUSIVE_INTERCITY` contract across the platform.
   - Enforced by DB partial unique index on `(driverProfileId, isActive) WHERE employmentType = 'EXCLUSIVE_INTERCITY'`.
   - If violated, the database returns `P2002`, which is caught and converted to an actionable error.
4. **Zero-ERP Invariant**:
   - `createDriver` creates **zero** `Operator` ERP rows. The driver cannot access the operator web dashboard.
5. **Credential-Less Handoff**:
   - Upon success, the UI displays an instruction text box with copy-to-clipboard functionality to send the driver an onboarding SMS instructing them to download the app and sign in with their phone.

---

## 4. Mobile Boot & Gating Sequence

The driver mobile app gate is defined in [`apps/driver-app/app/index.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/index.tsx):

```
                       ┌─────────────────────────┐
                       │   IndexScreen (Boot)    │
                       └────────────┬────────────┘
                                    │
                                    ▼
                        authClient.getSession()
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
     [No Active Session]                             [Active Session]
            │                                               │
            ▼                                               ▼
  Redirect: /(auth)/login                        hasServicePreference()
                                                            │
                                            ┌───────────────┴───────────────┐
                                            ▼                               ▼
                                   [Preference Missing]            [Preference Present]
                                            │                               │
                                            ▼                               ▼
                               Redirect: /(auth)/preferences    Redirect: /(tabs)/trips
```

### Critical Gap in Boot Logic:
`IndexScreen` checks `hasServicePreference()` but **does not check whether the user has a `DriverProfile`**. An authenticated passenger or half-registered driver who enters the app is routed straight to `/(tabs)/trips`, which throws a `FORBIDDEN` error when querying `getMyTrips`.
