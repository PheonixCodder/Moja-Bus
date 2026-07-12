# Moja Ride: True Passwordless Authentication & Notifications System

This document outlines the complete architectural specifications, database schemas, role-based workflows, tRPC routers, Better Auth server-side configuration, and Novu notification system alignment for the Moja Ride application.

---

## 1. System Architecture & Philosophy

Moja Ride utilizes a **True Passwordless** authentication pattern. Standard credentials (passwords) are entirely disabled across the platform. Authentication relies strictly on dynamic One-Time Passwords (OTPs) delivered via **Email** or **SMS**, depending on the identifier provided.

```
                    ┌─────────────────────────┐
                    │     Frontend Client     │
                    │ (Web & Expo Mobile App) │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │     Better Auth API     │
                    │    (/api/auth/[...])    │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   Prisma DB Adapter     │
                    │   (PostgreSQL / Neon)   │
                    └───────────┬─────────────┘
                                │
           ┌────────────────────┴────────────────────┐
           ▼                                         ▼
   (OTP Notifications)                      (Database Hooks)
   - sendVerificationOTP                     - user.create.after
   - phoneNumber.sendOTP                     - Company / Operator setup
   - Novu Cloud Workflows                    - Novu Welcome triggers
```

### Core Security & Hardening Properties
1. **Password Authentication Disabled**: The Better Auth option `emailAndPassword.enabled` is explicitly set to `false`.
2. **Database-Backed Rate Limiting**: Switch from memory storage to persistent database storage (`storage: "database"`) to prevent rate limit bypasses in multi-instance or serverless (Vercel) environments.
3. **OTP Rate Limiting Rules**: Stricter rate limits are enforced via custom kebab-case paths:
   - OTP Generation (Email / Phone): Max 3 attempts per 60 seconds.
   - OTP Verification (Email / Phone): Max 5 attempts per 60 seconds.
4. **Short-Lived Cookie Cache**: `cookieCache.maxAge` is restricted to **5 minutes** (with `strategy: "compact"`) to ensure revoked sessions are promptly invalidated on the client.
5. **No Hardcoded Dev Origins**: Dev servers support dynamic Expo origins via `process.env["EXPO_DEV_ORIGIN"]` rather than static IP fallbacks.
6. **No Passwords on Client**: The views and hooks for `forgotPassword` and `resetPassword` are completely removed. Static redirects on `/forgot-password` route immediately back to `/login`.

---

## 2. Database Schema Definition

The authentication engine operates on top of six core tables in the PostgreSQL database managed by Prisma:

```prisma
model User {
  id            String   @id
  fullName      String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  phone         String?  @unique
  role          UserRole @default(TRAVELER)

  // Operator registration fields
  workEmail String? @unique
  workPhone String? @unique

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  sessions     Session[]
  accounts     Account[]
  operators    Operator[]
  passenger    PassengerProfile?
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
}

model RateLimit {
  id          String @id
  key         String @unique
  count       Int
  lastRequest BigInt

  @@map("rate_limit")
}

model PendingOperatorSignup {
  id          String    @id @default(cuid())
  companyName String
  ownerName   String
  email       String    @unique
  phone       String
  country     String
  otpHash     String
  expiresAt   DateTime
  attempts    Int       @default(0)
  completedAt DateTime?
  createdAt   DateTime  @default(now())
}

model StaffInvitation {
  id          String   @id @default(cuid())
  companyId   String
  email       String
  role        StaffRole
  jobTitle    String?
  message     String?
  token       String   @unique // SHA-256 hash of raw link token
  expiresAt   DateTime
  status      InvitationStatus @default(PENDING) // PENDING, ACCEPTED, CANCELLED
  invitedById String
}
```

---

## 3. Better Auth Server Setup (`lib/auth-server.ts`)

The Better Auth instance is configured to handle passwordless flows and dynamic database actions:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins/email-otp";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { nextCookies } from "better-auth/next-js";
import { getPrismaClient } from "@moja/db";
import { sendAuthOtp } from "./auth-email";

export const auth = betterAuth({
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000",
  database: prismaAdapter(getPrismaClient(), { provider: "postgresql" }),
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  emailAndPassword: {
    enabled: false, // Disables standard passwords
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24 * 7,  // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "compact",
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database", // Persists attempts in rate_limit table
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/phone-number/send-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 5 },
      "/phone-number/verify": { window: 60, max: 5 },
    },
  },
  user: {
    fields: {
      name: "fullName",
    },
    additionalFields: {
      phone: { type: "string", required: false, input: true },
      workEmail: { type: "string", required: false, input: true },
      role: { type: "string", defaultValue: "TRAVELER", input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const prisma = getPrismaClient();
          const userPhone = user["phone"] || (user as any).phoneNumber;
          const pending = await prisma.pendingOperatorSignup.findFirst({
            where: {
              OR: [
                user.email ? { email: user.email } : null,
                userPhone ? { phone: userPhone as string } : null,
              ].filter(Boolean) as any,
            },
          });

          if (pending) {
            return {
              data: {
                ...user,
                role: "OPERATOR",
                workEmail: pending.email,
                email: user.email || pending.email,
                fullName: pending.ownerName,
                name: pending.ownerName,
                phone: pending.phone,
              },
            };
          }
        },
        after: async (user) => {
          const prisma = getPrismaClient();
          const userPhone = user["phone"] || (user as any).phoneNumber;
          const pending = await prisma.pendingOperatorSignup.findFirst({
            where: {
              OR: [
                user.email ? { email: user.email } : null,
                userPhone ? { phone: userPhone as string } : null,
              ].filter(Boolean) as any,
            },
          });

          if (pending) {
            const companyId = crypto.randomUUID();
            const company = await prisma.company.create({
              data: {
                id: companyId,
                name: pending.companyName,
                slug: `draft-${companyId}`,
                email: pending.email,
                phone: pending.phone,
                estimatedStaffSize: 1,
                status: "DRAFT",
              },
            });

            const operator = await prisma.operator.create({
              data: {
                userId: user.id,
                companyId: company.id,
                role: "OWNER",
              },
            });

            await prisma.operatorOnboarding.create({
              data: {
                operatorId: operator.id,
                currentStep: "COMPANY",
                completedSteps: [],
                completedStepCount: 0,
                totalSteps: 5,
              },
            });

            await prisma.pendingOperatorSignup.delete({
              where: { email: pending.email },
            });

            // Trigger Welcome Notification asynchronously (fire-and-forget)
            const novuSecret = process.env["NOVU_SECRET_KEY"];
            if (novuSecret) {
              import("@novu/api").then(({ Novu }) => {
                const novu = new Novu({ secretKey: novuSecret });
                const appUrl = process.env["APP_URL"] || "http://localhost:3000";
                return novu.trigger({
                  workflowId: "operator-welcome",
                  to: { subscriberId: user.id, email: user.email },
                  payload: {
                    email: user.email,
                    ownerName: pending.ownerName,
                    companyName: pending.companyName,
                    dashboardUrl: appUrl,
                  },
                });
              }).catch(console.error);
            }
          }
        },
      },
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: false,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendAuthOtp({ identifier: email, otp, type });
      },
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendAuthOtp({ identifier: phoneNumber, otp: code, type: "sign-in" });
      },
    }),
    nextCookies(),
  ],
});
```

---

## 4. Role-Based Authentication Workflows

### Flow A: Passenger (`TRAVELER`) Signup & Login
The passenger signup/login flow is fully unified under a single converged OTP check.

```
[Enter Email/Phone] ──► sendPassengerOtp() ──► Check identifier type ──► Trigger SMS/Email OTP
                                                                                │
                                                                                ▼
[Dashboard / Profile] ◄── Verify & Auto-Login ◄── verifyPassengerOtp() ◄── [Enter 6-digit Code]
```

1. **Input Submission**: Passenger enters their email or phone number in `/login`.
2. **Identification**: Frontend client detects the delivery channel (method) using phone heuristics or email checking.
3. **OTP Generation**:
   - For **Email**: Triggers `authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })`.
   - For **Phone**: Triggers `authClient.phoneNumber.sendOtp({ phoneNumber })`.
4. **Verification**:
   - Passenger inputs the 6-digit code.
   - For **Email**: Calls `authClient.signIn.emailOtp({ email, otp })`.
   - For **Phone**: Calls `authClient.phoneNumber.verify({ phoneNumber, code })`.
5. **Session & Creation**:
   - If the user exists, a Better Auth session cookie is established, and they are redirected to `/dashboard`.
   - If the user is new, Better Auth automatically creates a new traveler user record, establishes the session, and the card transitions to Step 3 (Profile Setup) to capture their full name and seat/class preferences before redirecting them to `/dashboard`.

---

### Flow B: Transport Operator (`OPERATOR` / `OWNER`) Signup & Login
The operator login and signup flows are unified into a single card on `/operator/login`.

```
[Enter Identifier] ──► checkAccountStatus TRPC ──► If exists ──► Send OTP (Login)
         │                                              │
         └──► If new ──► [Enter Company Details] ───────┼──► [Verify OTP] ──► Dashboard/Onboarding
```

1. **Input Submission**: Operator enters their work email or phone number.
2. **Dynamic Check (tRPC)**: Submitting triggers the `operator.checkAccountStatus` mutation to inspect if the account already exists.
   - **Existing Operator**: Slides directly to **Step 2 (OTP)** and triggers the login OTP (via Email or SMS depending on input).
   - **New Operator**: Slides open **Step 1.5 (Company Details)**. The user is prompted for Company Name, Full Name, and a fallback identifier (phone number if Step 1 was email, or work email if Step 1 was phone).
3. **Pre-Registration (tRPC)**: Submitting Company Details calls `operator.initSignup` to pre-register the company in the `pendingOperatorSignup` table, then sends the verification OTP code.
4. **OTP Delivery**:
   - The Better Auth OTP callbacks fire the custom **`operator-signup-otp`** Novu workflow (or Twilio SMS), sending the 6-digit verification code.
5. **Database Hook Interception**:
   - The operator enters the code, calling `authClient.signIn.emailOtp` or `authClient.phoneNumber.verify`.
   - On user insert, the **`user.create.before`** hook intercepts and updates the user properties (role to `OPERATOR`, name, and phone/email) synchronously.
6. **Account Provisioning**:
   - Next, the **`user.create.after`** database hook executes.
   - It reads the `pendingOperatorSignup` record, provisions the `Company` (in `DRAFT` status), `Operator` profile, and onboarding checklist.
   - Deletes the pending signup, fires the `operator-welcome` workflow, and redirects the operator to `/dashboard/operator/onboarding`.

---

### Flow C: Operator Staff Invitation & Onboarding
Existing operators can invite staff members (Managers, Finance, Dispatchers) directly using link invitations.

```
[Invite Staff] ──► staff.createInvitation TRPC ──► Hash Token & Save ──► Trigger invite email
                                                                                │
                                                                                ▼
[Dashboard Access] ◄── Verify OTP ◄── Click Accept Link ◄── Verify Token ◄── [Received Invite Link]
```

1. **Staff Invitation**: Company admin clicks "Invite Staff" on `/dashboard/operator/staff` and enters the email and role.
2. **Token Creation**: Router `staff.createInvitation` is triggered.
   - Checks if the user is already a member of the company.
   - Generates a cryptographically secure random token.
   - Hashes the token using SHA-256 and saves a `StaffInvitation` record (status `PENDING`, valid for 7 days).
   - Triggers the **`operator-staff-invite`** Novu workflow delivering the raw token invite URL (`/invite?token=rawToken`).
3. **Acceptance Phase**:
   - Staff member clicks the link in their email.
   - `/invite` page hashes the URL token and queries the database for the active `StaffInvitation`.
   - Displays the invitation details (Company name, Inviter, and Role) and prompts the user for name input.
   - Clicking "Accept" triggers `authClient.emailOtp.sendVerificationOtp({ email })`.
4. **Verification**:
   - Staff member enters the 6-digit OTP code.
   - Client calls `authClient.signIn.emailOtp({ email, otp })` (converged flow).
   - If they are a new user, their profile is automatically generated.
   - Client calls `invitation.accept` tRPC mutation to mark the invitation as `ACCEPTED` and link the staff user profile to the operator company.
   - Triggers `staff-acceptance-alert` to the inviter and redirects the new staff member to `/dashboard/operator`.

---

## 5. Staff Administrative OTP Gate (Ownership Transfer)

To perform high-privilege actions like transferring company ownership to another operator staff member, a secure **2-step OTP flow** replaces the obsolete password check:

```
[Click Transfer] ──► requestTransferOtp TRPC ──► Generate OTP & Hashed db save ──► Trigger auth-otp (transfer-ownership)
                                                                                           │
                                                                                           ▼
[Access Terminated] ◄── Ownership Shifted ◄── transferOwnership TRPC ◄── Verify OTP ◄── [Input Code]
```

### Step 1: Request Code (`staff.requestTransferOtp`)
1. Owner clicks "Transfer Ownership" on a member row.
2. Modal opens and owner clicks **"Send Code"**.
3. Frontend triggers the `staff.requestTransferOtp` mutation.
4. The server:
   - Verifies the requester is the company `OWNER`.
   - Generates a secure 6-digit OTP code.
   - Computes the SHA-256 hash of the code.
   - Clears any previous active transfer codes for `transfer-ownership:ownerEmail` in the `Verification` table.
   - Creates a new record in `Verification` table (valid for 10 minutes).
   - Triggers the Novu `auth-otp` workflow with type `"transfer-ownership"`.
5. Frontend starts a 60-second cooldown timer on the "Send Code" button.

### Step 2: Verification (`staff.transferOwnership`)
1. Owner inputs the 6-digit code and clicks **"Transfer Ownership"**.
2. Frontend triggers the `staff.transferOwnership` mutation with `memberId` and `otp`.
3. The server:
   - Verifies the requester is the company `OWNER`.
   - Fetches the active `Verification` record for `transfer-ownership:ownerEmail`.
   - Verifies code expiration and computes the SHA-256 hash of the user input.
   - If correct, deletes the verification record.
   - Executes a database transaction to demote the owner to `ADMIN` and promote the target member to `OWNER`.
   - Logs the transfer in the `ActivityLog` audit table.
4. Frontend displays a success toast and redirects the user to the updated dashboard view (with reduced privileges).

---

## 6. Novu Notification Workflow Mapping

The authentication and security layers are fully mapped to the Novu Bridge framework.

### 1. Unified Auth OTP (`auth-otp`)
Used for general passenger sign-ins, staff registrations, email changes, and ownership transfers.
- **Key Features**:
  - `email` payload schema is `.optional()` to support phone-only checkouts.
  - Twilio SMS triggers immediately if `payload.phone` is passed in the trigger payload.
  - SendGrid Email step runs conditionally only if `payload.email` is present.
- **Types**:
  - `sign-in`: `"Your Moja Ride sign-in code"`
  - `email-verification`: `"Verify your Moja Ride email"`
  - `change-email`: `"Confirm your Moja Ride email change"`
  - `transfer-ownership`: `"Confirm business ownership transfer"`

### 2. Operator Signup OTP (`operator-signup-otp`)
Pink-branded business registration verification email.
- **Key Features**:
  - Explicitly references the owner by name and displays the company name.
  - Bypasses generic auth branding.
- **Trigger**: Fired when `sendAuthOtp` intercepts a sign-in OTP request for an email address currently listed in `pendingOperatorSignup`.

### 3. Operator Welcome Onboarding (`operator-welcome`)
High-fidelity HTML checklist detailing next steps for newly registered business owners.
- **Key Features**:
  - Fired inside the `user.create.after` Better Auth database hook.
  - Wrapped inside a fire-and-forget Promise chain (`.then().catch()`) to ensure external api failures never hang or rollback the core user database transaction.

### 4. Operator Staff Invitation (`operator-staff-invite`)
HTML email containing the invite button linked to `/invite?token=rawToken`.
- **Key Features**:
  - Displays the inviter name, company, role, and the expiration date.
  - Supports custom invitation messages.

### 5. Staff Invitation Accepted (`staff-acceptance-alert`)
In-app dashboard notification feed alert.
- **Key Features**:
  - Delivered directly to the owner/admin dashboard inbox.
  - Redirects the user to the staff roster `/dashboard/operator/staff`.

---

## 7. Frontend Integration details

### Client-Side Auth Hook (`use-auth.ts`)
The unified client-side auth hook exposes exactly 4 functions:

| Function | Signature | Description |
| :--- | :--- | :--- |
| `signOut` | `() => Promise<void>` | Sign out of the session and redirect to `/login`. |
| `verifyEmail` | `(email: string, otp: string) => Promise<{ success: boolean }>` | Verifies sign-up OTP and redirects users dynamically based on role. |
| `sendPassengerOtp` | `(identifier: string, method: "phone" \| "email") => Promise<{ success: boolean }>` | Triggers OTP sending via email or SMS. |
| `verifyPassengerOtp` | `(identifier: string, otp: string, method: "phone" \| "email") => Promise<{ success: boolean }>` | Verifies code using `phoneNumber.verify()` or `signIn.emailOtp()` and logs user in. |

### Global OTP Error Code Mapping
Every OTP verification form maps Better Auth error codes to user-friendly messages:

```typescript
let message = "Invalid verification code.";
if (err && typeof err === "object") {
  switch (err.code) {
    case "TOO_MANY_ATTEMPTS":
      message = "Too many attempts. Please request a new code or try again later.";
      break;
    case "INVALID_OTP":
      message = "Invalid verification code. Please check and try again.";
      break;
    case "OTP_EXPIRED":
      message = "Verification code has expired. Please request a new one.";
      break;
    default:
      if (err.message) message = err.message;
  }
}
```
This translation is actively applied in:
- `verifyPassengerOtp` hook in `use-auth.ts`
- `handleVerifyOtp` in `/invite` (`invitation-view.tsx`)
- `handleOtpSubmit` in Operator Signup (`operator-signup-form.tsx`)
- `TransferOwnershipDialog` in Operator Staff View (`operator-staff-view.tsx`)
