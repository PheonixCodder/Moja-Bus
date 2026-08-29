# 04. Notification Workflows & Templates Audit

This module documents all notification workflows, delivery channels, template content, and transactional boundaries associated with authentication, staff onboarding, and driver operations.

---

## 1. Notification Subsystem Inventory

All workflows are built code-first using `@novu/framework` and hosted inside [`apps/web/features/notifications/workflows/`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 AUTH & ONBOARDING WORKFLOWS                                      │
├──────────────────────────────┬───────────────┬───────────────────────────────┬───────────────────┤
│ Workflow Identifier          │ Channel(s)    │ Target Audience               │ Criticality / TTL │
├──────────────────────────────┼───────────────┼───────────────────────────────┼───────────────────┤
│ auth-otp                     │ Email + SMS   │ Passengers, Admins, Drivers   │ Critical (10 min) │
│ operator-signup-otp          │ Email         │ Transport Operator Owners     │ Critical (15 min) │
│ operator-welcome             │ Email + InApp │ Newly Onboarded Operators     │ High (Permanent)  │
│ operator-staff-invite        │ Email         │ Invited Operator Staff        │ Critical (7 days) │
│ admin-staff-invite           │ Email         │ Invited Platform Admins       │ Critical (7 days) │
│ staff-acceptance-alert       │ In-App Feed   │ Company Owner / Inviter       │ Medium            │
│ driver-verification-outcome  │ Email + InApp │ Commercial Drivers            │ High              │
│ driver-roster-removed        │ Email + InApp │ Displaced Roster Drivers      │ High              │
└──────────────────────────────┴───────────────┴───────────────────────────────┴───────────────────┘
```

---

## 2. Detailed Workflow Specifications

### 1. `auth-otp` ([`apps/web/features/notifications/workflows/auth/auth-otp.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/auth/auth-otp.ts))
- **Multi-Channel Dispatch**:
  - **Email**: Triggered if `payload.email` is present.
  - **SMS**: Triggered if `payload.phone` is present via Twilio.
- **Dynamic Subject & Intro Map**:
  - `sign-in`: *"Your Moja Ride verification code"*
  - `email-verification`: *"Verify your Moja Ride account"*
  - `change-email`: *"Verify your new email address"*
  - `transfer-ownership`: *"Verify ownership transfer code"*
  - `withdrawal-2fa`: *"Verify your withdrawal confirmation code"*
- **Payload Schema**:
  ```ts
  z.object({
    email: z.string().email().optional(),
    otpCode: z.string().length(6),
    type: z.string(),
    phone: z.string().optional(),
  })
  ```

---

### 2. `operator-signup-otp` ([`apps/web/features/notifications/workflows/auth/operator-signup-otp.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/auth/operator-signup-otp.ts))
- **Purpose**: Sent exclusively during Phase 1 of Transport Operator registration.
- **Branding**: Pink `#ee237c` branding for Moja Ride Business.
- **Copy**: Personalizes greeting with `ownerName` and prominently displays `companyName`.
- **Subject**: `[OTP Code] is your Moja Ride business verification code`.

---

### 3. `operator-welcome` ([`apps/web/features/notifications/workflows/auth/operator-welcome.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/auth/operator-welcome.ts))
- **Trigger**: Fired inside `user.create.after` Better Auth database hook.
- **Multi-Step Content**:
  - **Email**: Step-by-step checklist guiding the operator through company document upload, bank account linking, fleet registration, and schedule publishing.
  - **In-App Feed**: In-app alert pinned with link to `/dashboard/operator/onboarding`.
- **Async Execution**: Triggered via fire-and-forget Promise chain (`.then().catch()`) so Novu latency never blocks the database transaction.

---

### 4. `operator-staff-invite` ([`apps/web/features/notifications/workflows/staff/operator-staff-invite.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/staff/operator-staff-invite.ts))
- **Purpose**: Email invitation for ERP staff members.
- **Content**: Displays inviter name, company name, assigned role, expiration date, and optional personalized message.
- **Action Button**: Deep links directly to `/invite?token=${rawToken}`.

---

### 5. `admin-staff-invite` ([`apps/web/features/notifications/workflows/staff/admin-staff-invite.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/staff/admin-staff-invite.ts))
- **Purpose**: Email invitation for platform administrative staff.
- **Branding**: Indigo `#6366f1` palette for Moja Admin.
- **Action Button**: Deep links to `/admin/invite?token=${rawToken}`.

---

### 6. `staff-acceptance-alert` ([`apps/web/features/notifications/workflows/staff/staff-acceptance-alert.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/staff/staff-acceptance-alert.ts))
- **Target**: Delivered to the inviter's user ID.
- **Content**: In-app notification alerting the inviter that the staff member has accepted and joined the team.
- **Action Link**: Redirects to `/dashboard/operator/staff`.

---

### 7. `driver-verification-outcome` ([`apps/web/features/notifications/workflows/driver/verification-outcome.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/driver/verification-outcome.ts))
- **Language**: French-first (`fr-FR`) per platform compliance requirements.
- **Outcomes**:
  - `APPROVE`: *"Vérification approuvée — Votre profil chauffeur est vérifié."*
  - `SUSPEND`: *"Compte suspendu — Votre compte a été suspendu par l'administration."* Includes custom rejection/suspension reason.
  - `REJECT`: *"Vérification refusée — Votre demande de vérification a été refusée."* Includes rectification feedback.
- **Multi-Channel**: Email + In-App notification.

---

### 8. `driver-roster-removed` ([`apps/web/features/notifications/workflows/driver/roster-removed.ts`](file:///C:/dev/moja-buss/apps/web/features/notifications/workflows/driver/roster-removed.ts))
- **Trigger**: Fired inside `deleteDriverAffiliation` transaction.
- **Copy**: French-first email explaining that the carrier terminated the affiliation, clarifying that the driver's career passport, badges, and trip history remain preserved and portable.

---

## 3. Security, Push Tokens, & Outbox Integration

1. **Push Token Multi-Tenancy**:
   - `registerPushToken` uses `credentials.append` in Novu SDK.
   - Dual-app users (e.g. drivers who also ride as travelers) keep both Expo push tokens registered under the same `subscriberId` without collision.
2. **Transactional Outbox Protection**:
   - High-volume and compliance events (driver delay notices, trip conflicts, verification outcomes) write to the PostgreSQL `OutboxMessage` table inside the database transaction.
   - The outbox worker crontab sweeps pending messages every minute, guaranteeing zero lost notifications during network spikes.
3. **HTML Sanitization**:
   - All dynamic strings interpolated into notification templates pass through [`escapeHtml`](file:///C:/dev/moja-buss/apps/web/features/notifications/utils/escape-html.ts) to prevent HTML injection.
