# Moja Ride Notification Infrastructure: Authentication & Invitation Events

This document details the complete notification strategy, triggers, payload specifications, and channel routing rules for all authentication and invitation events across the Moja Ride platform. 

---

## 1. Authentication System Architecture

Moja Ride uses **Better Auth** with the **Prisma Adapter** in PostgreSQL as the core authentication engine.

```
                  ┌──────────────────────┐
                  │   Better Auth API    │
                  │   (/api/auth/[...])  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  sendVerificationOTP │
                  │       Callback       │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   (OTP/Security Events)             (Invitation Events)
    - Sign-up Verification            - Staff invites
    - Password Resets                 - Accept alerts
    - Email Updates                   - Onboarding Guide
    - passwordless signin
```

### Auth Topography
*   **Passengers (`TRAVELER`)**: Sign up directly via `authClient.signUp.email` (Web & Mobile). They must verify their email with a 6-digit OTP code to activate their account.
*   **Operators (`OPERATOR` / `OWNER` / `ADMIN`)**: Sign up via a custom 3-step TRPC pipeline (`initSignup` ──► `verifySignupOtp` ──► `completeSignup` / `authClient.signUp.email`). This pre-verifies their work email via a custom OTP before creating the final Better Auth user and Company draft.
*   **Staff Members**: Invited by existing operator owners via the `staff.invite` TRPC router, generating a `StaffInvitation` token link valid for 7 days.

---

## 2. Notification Event Specifications

---

### Event 1: `passenger-email-verification-otp`
Sent when a passenger signs up or resends their verification email, requiring them to input a 6-digit code to activate their account.

*   **Trigger Location**: `apps/web/features/auth/hooks/use-auth.ts` (`signUp` calls `sendVerificationOtp`) and `apps/web/features/auth/components/verify-email-form.tsx` (`handleResend`).
*   **Better Auth Callback**: Intercepted in `apps/web/lib/auth-server.ts` (`emailOTP.sendVerificationOTP` where `type === "email-verification"`).
*   **Recipient**: Passenger (`TRAVELER` user).
*   **Settings**:
    *   `critical: true` (bypasses subscriber opt-out preferences and digests).
    *   `severity`: Unset (standard transactional flow).
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Sent immediately.
    *   **SMS (Twilio)**: Fallback. Sent only if the passenger signed up with a mobile number and the email delivery status fails.
*   **Payload Schema**:
    ```typescript
    interface PassengerVerificationOtpPayload {
      email: string;
      otpCode: string; // 6-digit verification code
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Verify your Moja Ride passenger account`
    *   **Email HTML**:
        ```html
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
          <h2 style="color: #0081F1; margin-top: 0;">Moja Ride</h2>
          <p>Welcome! Use this code to verify your email address and activate your passenger account:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 24px 0; color: #111;">
            {{payload.otpCode}}
          </div>
          <p style="font-size: 12px; color: #666;">This code is valid for 10 minutes. If you did not sign up for Moja Ride, you can safely ignore this email.</p>
        </div>
        ```
    *   **SMS Text**: `Moja Ride: Use code {{payload.otpCode}} to verify your email and activate your account. Valid for 10 minutes.`

---

### Event 2: `operator-signup-verification-otp`
Sent during the first phase of Operator registration to verify the business work email before creating any database entities.

*   **Trigger Location**: `apps/web/trpc/routers/operator.ts` (inside `initSignup` mutation).
*   **Recipient**: Transport Operator Owner.
*   **Settings**:
    *   `critical: true` (bypasses digests and delays).
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Must be delivered instantly so the user can advance past the OTP input screen.
*   **Payload Schema**:
    ```typescript
    interface OperatorSignupOtpPayload {
      email: string;
      otpCode: string;
      companyName: string;
      ownerName: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `{{payload.otpCode}} is your Moja Ride business verification code`
    *   **Email HTML**:
        ```html
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
          <h2 style="color: #ee237c; margin-top: 0;">Moja Ride Business</h2>
          <p>Hello {{payload.ownerName}},</p>
          <p>Verify your email to complete registration for <strong>{{payload.companyName}}</strong>:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 24px 0; color: #111;">
            {{payload.otpCode}}
          </div>
          <p style="font-size: 12px; color: #666;">This code is valid for 15 minutes. If you did not register your business, please contact support.</p>
        </div>
        ```

---

### Event 3: `auth-forgot-password-otp`
Sent when a passenger or operator requests a password reset code.

*   **Trigger Location**: `apps/web/features/auth/hooks/use-auth.ts` (`forgotPassword` calls `emailOtp.requestPasswordReset`).
*   **Better Auth Callback**: Intercepted in `apps/web/lib/auth-server.ts` (`emailOTP.sendVerificationOTP` where `type === "forget-password"`).
*   **Recipient**: Any registered user (passenger, operator, or admin).
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Delivered immediately.
    *   **SMS (Twilio)**: Fallback. Triggered only if email bounces or if the user requests it via phone reset.
*   **Payload Schema**:
    ```typescript
    interface ForgotPasswordOtpPayload {
      email: string;
      otpCode: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Reset your Moja Ride password`
    *   **Email HTML**:
        ```html
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
          <h2 style="color: #ee237c; margin-top: 0;">Moja Ride</h2>
          <p>We received a request to reset your password. Use the code below to complete the reset:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 24px 0; color: #111;">
            {{payload.otpCode}}
          </div>
          <p style="font-size: 12px; color: #666;">This code expires in 10 minutes. If you did not request this, you can ignore this email. Your password will remain unchanged.</p>
        </div>
        ```

---

### Event 4: `auth-change-email-otp`
Sent when an authenticated user updates their email address in their settings, requiring confirmation on the new address.

*   **Better Auth Callback**: Intercepted in `apps/web/lib/auth-server.ts` (`emailOTP.sendVerificationOTP` where `type === "change-email"`).
*   **Recipient**: Registered user.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Must be sent to the **new** email address.
*   **Payload Schema**:
    ```typescript
    interface ChangeEmailOtpPayload {
      email: string; // The new email address
      otpCode: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Confirm your new Moja Ride email`
    *   **Email HTML**:
        ```html
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
          <h2 style="color: #0081F1; margin-top: 0;">Moja Ride</h2>
          <p>Please confirm your new email address by entering the code below in your settings:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 24px 0; color: #111;">
            {{payload.otpCode}}
          </div>
          <p style="font-size: 12px; color: #666;">Valid for 10 minutes.</p>
        </div>
        ```

---

### Event 5: `operator-staff-invitation`
Sent when an operator company owner or admin invites a new staff member (e.g., Finance, Operations, Support) to join their company.

*   **Trigger Location**: `apps/web/trpc/routers/staff.ts` (inside `invite` and `resend` mutations).
*   **Recipient**: Invited staff member email.
*   **Settings**:
    *   `critical: false` (user-level, but defaults to email delivery).
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Renders a welcome block with inviter details and a dynamic token link.
*   **Payload Schema**:
    ```typescript
    interface StaffInvitationPayload {
      email: string;
      companyName: string;
      inviterName: string;
      role: "OWNER" | "ADMIN" | "MANAGER" | "OPERATIONS" | "FINANCE" | "SUPPORT";
      token: string; // raw invitation token
      expiresAt: string; // formatted date string
      message?: string | null;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `{{payload.inviterName}} invited you to join {{payload.companyName}} on Moja Ride`
    *   **Email HTML**:
        ```html
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 24px;">
          <h2 style="color: #ee237c; margin-top: 0;">Moja Ride</h2>
          <p><strong>{{payload.inviterName}}</strong> has invited you to join <strong>{{payload.companyName}}</strong> on Moja Ride.</p>
          <div style="background: #f8f9fa; border-left: 4px solid #ee237c; padding: 12px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0;">Role: <strong>{{payload.role}}</strong></p>
            {% if payload.message %}
              <p style="margin: 8px 0 0 0; color: #555;">Message: "<em>{{payload.message}}</em>"</p>
            {% endif %}
          </div>
          <p>This invitation link will expire on {{payload.expiresAt}}.</p>
          <a href="https://admin.mojaride.com/invite?token={{payload.token}}" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
             Accept Invitation
          </a>
          <p style="font-size: 11px; color: #888; margin-top: 24px;">If button doesn't work, copy this link: https://admin.mojaride.com/invite?token={{payload.token}}</p>
        </div>
        ```

---

### Event 6: `operator-staff-acceptance-alert`
Sent to the inviter / company admin when a staff member accepts their invitation and joins the company.

*   **Trigger Location**: `apps/web/trpc/routers/invitation.ts` (inside `accept` mutation).
*   **Recipient**: Inviter / Company Owner.
*   **Settings**:
    *   `critical: false`.
    *   `severity`: `LOW`.
*   **Channel Routing**:
    *   **In-App Notification**: Primary. Delivered directly to the operator owner/admin dashboard header.
*   **Payload Schema**:
    ```typescript
    interface StaffAcceptancePayload {
      ownerUserId: string; // Recipient subscriber ID
      staffName: string;
      staffEmail: string;
      role: string;
    }
    ```
*   **Copy Mockups**:
    *   **In-App Body**: `{{payload.staffName}} ({{payload.staffEmail}}) accepted your invitation and joined as {{payload.role}}.`
    *   **In-App Avatar**: `👥`
    *   **In-App Redirect**: `/dashboard/operator/staff`

---

### Event 7: `operator-welcome-onboarding`
Sent after the operator completes email verification and sets up their password, welcoming them to the platform.

*   **Trigger Location**: `apps/web/features/auth/components/operator-signup-form.tsx` (`handlePasswordSubmit` after `completeSignup.mutateAsync` succeeds).
*   **Recipient**: Operator Owner.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. High-fidelity guide detailing next steps.
    *   **In-App Notification**: Welcomes them to their dashboard.
*   **Payload Schema**:
    ```typescript
    interface OperatorWelcomePayload {
      email: string;
      ownerName: string;
      companyName: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Welcome to Moja Ride Business - Next Steps`
    *   **Email HTML**:
        ```html
        <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 28px;">
          <h2 style="color: #ee237c; margin-top: 0;">Welcome to Moja Ride Business</h2>
          <p>Hello {{payload.ownerName}},</p>
          <p>Your transport operator account for <strong>{{payload.companyName}}</strong> is active. Here is how to get started:</p>
          <ol style="line-height: 1.6; padding-left: 20px;">
            <li><strong>Complete Onboarding</strong>: Upload your business license and registration details.</li>
            <li><strong>Setup Payout Settings</strong>: Connect your bank account under settings to receive Paystack settlements.</li>
            <li><strong>Register Fleet & Staff</strong>: Add your buses, drivers, and dispatchers.</li>
            <li><strong>Create Routes & Schedules</strong>: Set up departures and ticket prices.</li>
          </ol>
          <p style="margin-top: 24px;">Click below to open your onboarding checklist:</p>
          <a href="https://admin.mojaride.com/dashboard/operator/onboarding" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
             Open Dashboard Onboarding
          </a>
        </div>
        ```
    *   **In-App Body**: `Welcome to Moja Ride! Complete your company onboarding steps to start publishing routes.`
    *   **In-App Redirect**: `/dashboard/operator/onboarding`
