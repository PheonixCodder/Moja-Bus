# 02. Role-Based Authentication Flows & User Lifecycle

This document provides exhaustive, step-by-step technical walkthroughs of how every role in the Moja Ride platform authenticates, registers, receives invitations, and gets authorized.

---

## 1. Role Matrix & Taxonomy

The platform defines three layers of roles:

1. **Global User Role (`User.role` enum)**:
   - `TRAVELER` (Default passenger role)
   - `OPERATOR` (Transport company owner or ERP staff member)
   - `ADMIN` (Platform administrator or support staff)
   - `DRIVER` (Commercial driver account, app-only identity, zero ERP access)

2. **Operator Company Staff Role (`Operator.role` enum & permissions)**:
   - `OWNER` (Level 600) — Full implicit control over the company tenancy.
   - `ADMIN` (Level 500) — Full operational, staff, compliance, and financial permissions.
   - `MANAGER` (Level 400) — Operational management (routes, fleet, schedules, trips, staff).
   - `DISPATCHER` (Level 350) — Trip scheduling, driver assignment, dispatch execution.
   - `OPERATIONS` (Level 300) — Route, fleet, and trip oversight.
   - `CONDUCTOR` (Level 275) — Passenger manifest, boarding, and ticket check-ins.
   - `TREASURY` (Level 260) — Payouts, withdrawals, and bank views.
   - `FINANCE` (Level 250) — Revenue analytics and financial reporting.
   - `SUPPORT` (Level 200) — Customer and passenger support.
   - `DRIVER` (Level 150) — Legacy / crew role (excluded from new staff invitations via `INVITABLE_STAFF_ROLES`).

3. **Platform Admin Staff Role (`AdminStaff.role` enum & permissions)**:
   - `SUPER_ADMIN` (Level 600) — Implicit all-access to platform operations and settings.
   - `ADMIN` (Level 500) — Broad administrative access (companies, verifications, marketplace, ledger).
   - `OPERATIONS` (Level 400) — Fleet, routes, terminals, and trip oversight.
   - `COMPLIANCE` (Level 350) — Document verification and company vetting.
   - `FINANCE` (Level 300) — Withdrawals resolution, settlements, commissions.
   - `SUPPORT` (Level 200) — Inquiries and user lookups.

---

## 2. Detailed Flow Walkthroughs

### Flow 1: Passenger (`TRAVELER`) Registration & Sign-In

```
[Input Email/Phone] ──► detectMethod() ──► sendPassengerOtp() ──► Novu auth-otp (SMS or Email)
                                                                            │
                                                                            ▼
[Dashboard] ◄── updatePreferences() ◄── Step 3: Profile Setup ◄── verifyPassengerOtp()
```

1. **User Enters Identifier**:
   - Web: [`PassengerAuthFlow`](file:///C:/dev/moja-buss/apps/web/features/auth/components/passenger-auth-flow.tsx) on `/login`.
   - Mobile: [`LoginView`](file:///C:/dev/moja-buss/apps/traveler-app/features/auth/screens/login.tsx) in `traveler-app`.
2. **Identifier Detection & Normalization**:
   - Detects method (`phone` or `email`).
   - Phones are normalized to E.164 (e.g. `+2250700000000`) using country detection (`CI` default).
3. **OTP Generation**:
   - For Phone: calls `authClient.phoneNumber.sendOtp({ phoneNumber: normalizedPhone })`.
   - For Email: calls `authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })`.
   - Trigger routes through [`apps/web/lib/auth-email.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-email.ts), which fires Novu workflow `auth-otp`.
4. **Verification & Auto-Creation**:
   - Passenger inputs 6-digit code.
   - Web: calls `authClient.phoneNumber.verify()` or `authClient.signIn.emailOtp()`.
   - If the user does not exist, Better Auth automatically creates a `User` record with `role: "TRAVELER"`.
   - For phone signups, a guest email is auto-generated: `${phone}@guest.mojaride.ci`.
5. **New User Onboarding**:
   - Detects `isNewUser` (`createdAt > Date.now() - 10000`).
   - Transitions to **Step 3 (Profile Setup)** prompting for `fullName`, `preferredSeat` (`WINDOW` / `AISLE` / `NONE`), and `preferredClass` (`ECONOMY` / `STANDARD` / `VIP`).
   - Calls `trpc.passenger.updatePreferences` mutation and redirects to `/dashboard` or saved `callbackUrl`.

---

### Flow 2: Transport Operator (`OPERATOR` / `OWNER`) Signup & Login

```
[Input Email/Phone] ──► operator.checkAccountStatus
         │
         ├─► If Exists (Role: OPERATOR/ADMIN) ──► Send OTP ──► Verify OTP ──► Dashboard / Onboarding
         │
         └─► If New Account ──► [Step 1.5: Company & Owner Form] 
                                            │
                                            ▼
                              operator.initSignup (PendingOperatorSignup)
                                            │
                                            ▼
                               Trigger operator-signup-otp (Novu)
                                            │
                                            ▼
                              authClient.signIn.emailOtp() / verify()
                                            │
                                            ▼
                              Better Auth user.create.before Hook:
                              (Binds Owner Details, Stamps Role=OPERATOR)
                                            │
                                            ▼
                              Better Auth user.create.after Hook:
                              (Provisions Company [DRAFT], Operator [OWNER],
                               OperatorOnboarding [COMPANY], Fires operator-welcome)
                                            │
                                            ▼
                              Redirect: /dashboard/operator/onboarding
```

1. **Step 1: Identifier Submission on `/operator/login`**:
   - Operator submits work email or phone.
   - Frontend calls `trpc.operator.checkAccountStatus`.
2. **Account Decision Gate**:
   - **Existing Account**: Verifies `role === "OPERATOR" || role === "ADMIN"`. If non-operator (e.g. `TRAVELER`), access is rejected with a helpful warning toast. Otherwise, triggers OTP login.
   - **New Account**: Slides open **Step 1.5 (Company Details)** form.
3. **Step 1.5: Pre-Registration (`operator.initSignup`)**:
   - Collects `companyName`, `ownerName`, fallback email/phone, and terms acceptance.
   - Saves record into `PendingOperatorSignup` table with 24-hour expiration.
   - Calls Better Auth to trigger verification OTP.
4. **Branded Business OTP Delivery**:
   - [`apps/web/lib/auth-email.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-email.ts#L42-L69) checks `PendingOperatorSignup`.
   - Fired Novu workflow: `operator-signup-otp` (custom branded template with company name and owner name).
5. **Hook Execution & Atomic Account Provisioning**:
   - Operator submits 6-digit OTP code.
   - `user.create.before` hook upgrades `role` to `OPERATOR`, replaces temporary phone emails with the real work email, and stamps the owner's legal name.
   - `user.create.after` hook creates the `Company` (`DRAFT`), `Operator` (`OWNER`), `OperatorOnboarding` checklist, deletes the pending record, and fires the `operator-welcome` Novu workflow.
6. **Onboarding Check & Routing**:
   - Post-verification, frontend queries `trpc.operator.getOnboardingStatus`.
   - If `onboardingStatus === "COMPLETED"`, redirects to `/dashboard/operator`.
   - Otherwise, redirects to `/dashboard/operator/onboarding`.

---

### Flow 3: Operator Staff Invitation & Onboarding

```
[Operator Dashboard] ──► staff.createInvitation ──► Generate SHA-256 Token & Save StaffInvitation
                                                                    │
                                                                    ▼
                                                    Novu operator-staff-invite (Email Link)
                                                                    │
                                                                    ▼
[Invite Landing /invite?token=...] ◄── invitation.validateToken ◄── Click Email Link
         │
         ▼
[Step 1: Review Invitation Details & Enter Name]
         │
         ▼
[Step 2: Enter Email OTP Code] ──► authClient.signIn.emailOtp()
                                                │
                                                ▼
[Step 3: invitation.accept Mutation] ──► User.role = "OPERATOR"
                                     ──► Operator Profile Created with Role & Permissions
                                     ──► StaffInvitation.status = "ACCEPTED"
                                     ──► Novu staff-acceptance-alert to Inviter
                                     ──► Redirect: /dashboard/operator
```

1. **Invitation Issuance**:
   - Company Owner or Admin opens `/dashboard/operator/staff` and clicks "Invite Staff".
   - Calls `staff.createInvitation` passing email, role (`INVITABLE_STAFF_ROLES`), custom permissions, and optional message.
   - Server verifies caller has `staff:invite` permission and cannot grant permissions they do not hold (`requireCanGrant`).
   - Server generates a cryptographically random token, computes its SHA-256 hash, and stores `StaffInvitation` (valid for 7 days).
   - Triggers `operator-staff-invite` Novu email containing `/invite?token=rawToken`.
2. **Invitation Landing (`/invite?token=...`)**:
   - [`InvitationView`](file:///C:/dev/moja-buss/apps/web/features/invitation/views/invitation-view.tsx) calls `trpc.invitation.validateToken` (rate-limited by IP, max 30/min).
   - Validates token hash, expiration, and `status === "PENDING"`.
   - Renders company badge, inviter name, role, and custom message.
3. **Passwordless Identity Verification**:
   - If invitee is not logged in, clicking "Accept" prompts for full name and sends OTP to the invitation email.
   - User inputs 6-digit OTP code, verified via `authClient.signIn.emailOtp()`.
4. **Atomic Membership Acceptance (`invitation.accept`)**:
   - Verifies the authenticated session email matches the invitation email.
   - In a single Prisma transaction:
     - Updates `User.role = "OPERATOR"`, `emailVerified = true`.
     - Copies `invitation.permissions` (or fallback role template from [`ROLE_TEMPLATES`](file:///C:/dev/moja-buss/packages/schemas/src/permissions.ts#L186)) to the `Operator` profile.
     - Restores soft-deleted memberships if the user previously worked for this operator.
     - Marks `StaffInvitation.status = "ACCEPTED"`, `acceptedById = user.id`.
     - Logs `MEMBER_JOINED` in `ActivityLog`.
5. **Inviter Alert**:
   - Fires `staff-acceptance-alert` to `invitation.invitedBy.id` (in-app dashboard notification).
   - Redirects the new staff member to `/dashboard/operator`.

---

### Flow 4: Platform Admin Staff Invitation & Governance

```
[Admin Portal] ──► adminStaff.createInvitation ──► SHA-256 Token & AdminStaffInvitation
                                                                    │
                                                                    ▼
                                                    Novu admin-staff-invite (Email Link)
                                                                    │
                                                                    ▼
[/admin/invite?token=...] ──► Validate Token ──► Email OTP ──► adminStaff.accept
                                                                    │
                                                                    ▼
                                                    User.role = "ADMIN"
                                                    AdminStaff Profile Created
                                                    Redirect: /dashboard/admin
```

1. **Issuance**:
   - Super Admin or Admin calls `adminStaff.createInvitation` with target role (`ADMIN_STAFF_ROLES`) and permission keys.
   - Enforces `admin-staff:invite` permission and `assertAdminCanGrant`.
   - Stores `AdminStaffInvitation` with SHA-256 hashed token (7-day TTL).
   - Sends `admin-staff-invite` Novu email.
2. **Acceptance (`adminStaff.accept`)**:
   - Invitee authenticates via email OTP on `/admin/invite`.
   - Server verifies session email match.
   - Updates `User.role = "ADMIN"`, creates `AdminStaff` profile with assigned permissions (or template fallback from [`ADMIN_ROLE_TEMPLATES`](file:///C:/dev/moja-buss/packages/schemas/src/admin-permissions.ts#L263)).
   - Triggers `staff-acceptance-alert` to the admin inviter.
3. **Middleware Protection (`adminProcedure`)**:
   - Requires `user.role === "ADMIN"`.
   - Requires non-null, non-deleted [`AdminStaff`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L877) database row.
   - Explicitly rejects suspended admins (`adminStaff.status === "SUSPENDED"`).
