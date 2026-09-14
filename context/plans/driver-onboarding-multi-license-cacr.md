# Implementation Plan — Driver Onboarding Overhaul, Multi-Category License & CACR Integration

Last updated: 2026-09-13

## What we are building

A robust, scalable driver onboarding and compliance system that eliminates client-side wizard routing loops, supports multiple commercial driving license categories (`B`, `C`, `D`, `E`), and enforces the mandatory Ivorian Certificat d'Aptitude de Conducteur Routier (CACR, 2-sided Recto/Verso) for drivers holding commercial heavy/passenger categories (`C`, `D`, `E`).

The onboarding progress is upgraded from a fragile local Zustand cache to a server-persisted lifecycle (mirroring `OperatorOnboarding`), ensuring zero step-looping bugs, multi-device resume capability, and atomic transitions to verification.

---

## Language we agreed on

- **Server-Authoritative Driver Onboarding (`DriverOnboarding`)**: Server-persisted onboarding draft model tracking `currentStep`, `completedSteps`, and validated draft inputs. The backend is the single source of truth for where the driver is in the funnel.
- **Multi-Category License (`licenseCategories: LicenseCategory[]`)**: Array field supporting one or more categories (`B`, `C`, `D`, `E`) replacing the single scalar `licenseCategory` enum.
- **CACR (Certificat d'Aptitude de Conducteur Routier)**: Official 2-sided (Recto/Verso) transport card required under Ivorian law (OSER / Ministry of Transport) for commercial drivers operating vehicles in categories C, D, and E (buses >22 seats, heavy trucks >10t).
- **Wizard Navigation Loop**: The race condition where local Zustand reset in `status.tsx`, lack of server-side step persistence, and `useWizardGuard` re-evaluations cause continuous redirection between steps 1-4 and status until the app is killed.

---

## Decisions made

1. **Server-Side Onboarding State (`DriverOnboarding` table)**:
   - Introduce a `DriverOnboarding` model in `schema.prisma` linked 1:1 with `User`.
   - Store `currentStep` (`PERSONAL`, `LICENSE`, `DOCUMENTS`, `CARRIER`, `COMPLETED`), `completedSteps: Json`, and `draftData: Json`.
   - Expose tRPC endpoints: `drivers.getOnboardingProgress` and `drivers.saveOnboardingStep`.
   - Kill client-side `useWizardGuard` redirects. Navigation is driven by server-acknowledged step progress.

2. **Schema & Migration for `licenseCategories`**:
   - Add `licenseCategories LicenseCategory[] @default([D])` to `DriverProfile`.
   - Write standard PostgreSQL migration backfilling `licenseCategories = ARRAY["licenseCategory"]` for all existing profiles.
   - Update `licenseMeetsRequirement` to verify against the driver's category array.
   - Keep a getter/deprecated fallback for `licenseCategory` in API inputs for backward compatibility.

3. **CACR Compliance Integration**:
   - Add `cacrNumber`, `cacrExpiryDate`, `cacrFrontUrl`, and `cacrBackUrl` to `DriverProfile`.
   - Register storage purposes `"driver-cacr-front"` and `"driver-cacr-back"` in `apps/web/lib/storage/purposes.ts` with private visibility and signed URL access.
   - Conditional Zod validation: if `licenseCategories.some(c => ['C', 'D', 'E'].includes(c))`, then `cacrFrontUrl`, `cacrBackUrl`, and `cacrExpiryDate` are mandatory. If only `['B']`, CACR is optional and bypassed.
   - Add CACR Recto/Verso cards to Step 3 of the Driver App, `AddDriverModal` in Operator Web, and Admin/Operator verification dialogs.

4. **Role Assignment upon Driver Onboarding**:
   - Ensure `user.role` is set to `DRIVER` as soon as the driver profile is created in `registerDriver`, and allow users with active `DriverOnboarding` into the driver app onboarding routes without premature role refusal.

---

## Assumptions

1. **Category B Exemption**: Drivers with only Category B (light vehicles / taxis under 3.5t / under 9 seats) are not legally required to hold a CACR in Côte d'Ivoire.
2. **CACR Sides**: Both Recto (Front) and Verso (Back) must be photographed and uploaded for legal compliance; partial (front-only) submissions are rejected.
3. **Draft Retention**: Incomplete onboarding drafts can be resumed at any time by logging in with the verified phone number.

---

## How to build it

### Phase 1: Database & Migrations (`packages/db`)
1. In `packages/db/prisma/schema.prisma`:
   - Define `enum DriverOnboardingStep { PERSONAL, LICENSE, DOCUMENTS, CARRIER, COMPLETED }`.
   - Add `model DriverOnboarding` with relation to `User`.
   - In `model DriverProfile`:
     - Add `licenseCategories LicenseCategory[] @default([D])`.
     - Add `cacrNumber String?`, `cacrExpiryDate DateTime?`, `cacrFrontUrl String?`, `cacrBackUrl String?`.
2. Create migration file `packages/db/prisma/migrations/20260913120000_driver_onboarding_multi_license_cacr/migration.sql` following `MIGRATIONS.md`:
   - Create enum `DriverOnboardingStep`.
   - Create table `driver_onboarding`.
   - Add columns to `driver_profile` and backfill `licenseCategories = ARRAY["licenseCategory"]`.

### Phase 2: Shared Schemas & Storage (`packages/schemas` & `apps/web/lib/storage`)
1. In `packages/schemas/src/drivers.ts`:
   - Add `DriverOnboardingStepSchema`, `getOnboardingProgressSchema`, `saveOnboardingStepSchema`.
   - Update `createDriverSchema`, `driverSelfRegisterSchema`, and `updateDriverSchema` to use `licenseCategories: z.array(LicenseCategorySchema).min(1)`.
   - Add CACR fields and conditional `.superRefine()` validation.
   - Update `licenseMeetsRequirement(driverLicenses: string | string[], required: string | null | undefined): boolean`.
2. In `apps/web/lib/storage/purposes.ts`:
   - Add `"driver-cacr-front"` and `"driver-cacr-back"` to `StoragePurposeId` and `STORAGE_PURPOSES` (private, image optimization, 10MB limit).
3. In `apps/web/features/driver/lib/driver-doc-mint.ts` and `driver-doc-access.ts`:
   - Register CACR purposes in signed URL minting.

### Phase 3: Backend Procedures (`apps/web/trpc/routers/drivers.ts`)
1. Add `getOnboardingProgress`: returns current `DriverOnboarding` or creates initial draft.
2. Add `saveOnboardingStep`: updates step, validates step data, updates `completedSteps`, returns next step.
3. Update `registerDriver`:
   - Persists `licenseCategories` and CACR fields to `DriverProfile`.
   - Marks `DriverOnboarding.completedAt = now()`, `currentStep = 'COMPLETED'`.
   - Sets `User.role = 'DRIVER'`.
4. Update `createDriver` (Operator Action):
   - Accepts `licenseCategories` (array) and optional/conditional CACR fields.
   - Persists to `DriverProfile`.
5. Update `verifyDriver` in `drivers.ts` and `admin.ts`:
   - Incorporate CACR documents into compliance audit trail and verification previews.

### Phase 4: Driver App Onboarding Refactor (`apps/driver-app`)
1. In `apps/driver-app/app/index.tsx`:
   - Query `getOnboardingProgress`.
   - If not completed, route to the server's authoritative `currentStep`.
   - If completed, route to `status.tsx` or `/(tabs)/trips`.
2. Remove fragile client-side guard loop:
   - Deprecate `useWizardGuard` timeout/AsyncStorage redirects.
   - Remove `setTimeout(() => store.reset(), 350)` in `status.tsx`.
3. In `apps/driver-app/app/(auth)/register/license.tsx`:
   - Update to multi-select chip/toggle component for `B`, `C`, `D`, `E`.
   - Require at least 1 selection.
4. In `apps/driver-app/app/(auth)/register/documents.tsx`:
   - Conditionally render CACR Recto/Verso camera upload cards and Expiry/Number inputs if categories include C, D, or E.
   - Display informative guide badge explaining the CACR requirement.
5. In `apps/driver-app/app/(auth)/register/carrier.tsx`:
   - Submits registration and replaces directly to `/(auth)/register/status`.

### Phase 5: Operator Web & Admin UI (`apps/web`)
1. In `apps/web/features/operator/components/drivers/add-driver-modal.tsx`:
   - Replace single-select category with multi-category selector (`B`, `C`, `D`, `E`).
   - Add CACR Recto/Verso uploaders and Expiry Date when C, D, or E is chosen.
2. In `VerifyDriverDialog` and `DriverDetailView`:
   - Display CACR Front & Back previews alongside driving license and medical certificate.
   - Show held categories as badges (e.g. `[B] [D]`).

### Phase 6: Verification & QA
1. Run drift gate / prisma validate to confirm migration parity.
2. Verify onboarding from Step 1 to Step 4 in Driver App without loops or flashes.
3. Test CACR conditional visibility:
   - Select Category B only -> CACR hidden, registration succeeds.
   - Select Category D -> CACR required, blocks until Recto and Verso are attached.
4. Test operator addition of multi-category drivers via dashboard.
