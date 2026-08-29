# 01. Authentication System Map & Architecture

## 1. System Overview

Moja Ride uses a centralized **Better Auth** server instance hosted inside the Next.js backend at [`apps/web/lib/auth-server.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-server.ts), mounted onto Next.js App Router via [`apps/web/app/api/auth/[...all]/route.ts`](file:///C:/dev/moja-buss/apps/web/app/api/auth/[...all]/route.ts).

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLIENT APPLICATIONS                                       │
│                                                                                                 │
│    ┌─────────────────────────┐    ┌──────────────────────────┐    ┌─────────────────────────┐   │
│    │     apps/web (Next.js)  │    │ apps/driver-app (Expo RN)│    │apps/traveler-app(Expo)  │   │
│    │   - Web Passengers      │    │ - Commercial Drivers     │    │ - Mobile Travelers      │   │
│    │   - Operators & Staff   │    │ - GPS Telemetry Pingers  │    │ - Passenger Bookings    │   │
│    │   - Admin Staff         │    │ - QR Ticket Scanners     │    │ - Mobile Ticket Wallet  │   │
│    └────────────┬────────────┘    └────────────┬─────────────┘    └────────────┬────────────┘   │
└─────────────────┼──────────────────────────────┼───────────────────────────────┼────────────────┘
                  │                              │                               │
                  │                              │                               │
                  ▼                              ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BETTER AUTH SERVER ENGINE                                    │
│                                    (apps/web/lib/auth-server.ts)                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • TRUE PASSWORDLESS: emailAndPassword.enabled = false                                          │
│  • PLUGINS: emailOTP() · phoneNumber() · expo() · nextCookies()                                 │
│  • SESSION: 30-day expiresAt · 7-day updateAge · cookieCache: disabled                          │
│  • RATE LIMIT: Database-backed (RateLimit table in Postgres)                                    │
│  • DATABASE HOOKS: user.create.before · user.create.after (Operator Auto-Provisioning)           │
│  • SOCIAL PROVIDERS: Google OAuth (Web Client ID, iOS Client ID, Android Client ID)             │
│  • USER EXTENSION FIELDS: phoneNumber, workEmail, role (input: false - Server Authoritative)    │
└─────────────────────────────────┬───────────────────────────────┬───────────────────────────────┘
                                  │                               │
                                  ▼                               ▼
                 ┌────────────────────────────────┐  ┌────────────────────────────────┐
                 │     PRISMA DATABASE ADAPTER    │  │      NOVU WORKFLOW ENGINE      │
                 │     (@moja/db - PostgreSQL)    │  │       (apps/web/lib/novu.ts)   │
                 ├────────────────────────────────┤  ├────────────────────────────────┤
                 │ • User                         │  │ • auth-otp                     │
                 │ • Session                      │  │ • operator-signup-otp          │
                 │ • Account                      │  │ • operator-welcome             │
                 │ • Verification                 │  │ • operator-staff-invite        │
                 │ • RateLimit                    │  │ • admin-staff-invite           │
                 │ • PendingOperatorSignup        │  │ • staff-acceptance-alert       │
                 │ • Operator                     │  │ • driver-verification-outcome  │
                 │ • AdminStaff                   │  │ • driver-roster-removed        │
                 │ • DriverProfile                │  │                                │
                 │ • DriverCompanyAffiliation     │  │                                │
                 └────────────────────────────────┘  └────────────────────────────────┘
```

---

## 2. Server Configuration Deep Dive ([`apps/web/lib/auth-server.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-server.ts))

### Core Better Auth Engine Settings

1. **True Passwordless Execution**:
   - `emailAndPassword.enabled = false` explicitly shuts off password hashing, credential checks, and forgotten password routes.
   - All credential issuance flows through signed OTP codes delivered over verified channels.
2. **Database Adapter**:
   - Backed by `prismaAdapter(getPrismaClient(), { provider: "postgresql" })`.
   - Maps standard Better Auth tables (`user`, `session`, `account`, `verification`) to Prisma models.
3. **Session Management**:
   - `expiresIn: 60 * 60 * 24 * 30` (30 days TTL).
   - `updateAge: 60 * 60 * 24 * 7` (Refreshes expiration timestamp if session is >7 days old).
   - `cookieCache.enabled: false`: Disabled intentionally to prevent Expo mobile clients from caching expired cookie headers while local state remains signed in.
4. **Database-Backed Persistent Rate Limiting**:
   - `rateLimit.storage = "database"` uses the `rate_limit` PostgreSQL table.
   - Custom endpoint rate rules:
     - `/email-otp/send-verification-otp`: 3 attempts per 60s
     - `/phone-number/send-otp`: 3 attempts per 60s
     - `/sign-in/email-otp`: 5 attempts per 60s
     - `/phone-number/verify`: 5 attempts per 60s
5. **Role Immutability on Client (`user.additionalFields`)**:
   - `phoneNumber`: `{ type: "string", required: false, input: true }`
   - `workEmail`: `{ type: "string", required: false, input: true }`
   - `role`: `{ type: "string", defaultValue: "TRAVELER", input: false }` — `input: false` strictly prevents client-side payloads from overwriting user roles during registration or profile updates.

---

## 3. Database Hooks & Operator Auto-Provisioning

Better Auth database hooks in [`apps/web/lib/auth-server.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-server.ts#L145-L259) intercept the user creation transaction:

### 1. `user.create.before`
- Queries `PendingOperatorSignup` by matching either `user.email` or `user.phoneNumber`.
- If a match is found:
  - Overwrites `role` to `"OPERATOR"`.
  - Stamps `workEmail` with `pending.email`.
  - Replaces guest/temp email (e.g. `+225xxxx@guest.mojaride.ci`) with the operator's verified work email.
  - Updates `fullName`, `name`, and `phoneNumber`.

### 2. `user.create.after`
- Re-reads the `PendingOperatorSignup` record.
- In a single atomic sequence:
  1. Generates a fresh `companyId` (UUID).
  2. Creates a [`Company`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L566) record in `status: "DRAFT"`, `slug: "draft-{companyId}"`.
  3. Creates an [`Operator`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L759) profile linking `userId` to `companyId` with `role: "OWNER"`.
  4. Provisions [`OperatorOnboarding`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L816) progress (`currentStep: "COMPANY"`, `totalSteps: 5`).
  5. Deletes the `PendingOperatorSignup` record.
  6. Triggers the Novu `operator-welcome` workflow asynchronously (fire-and-forget).

---

## 4. Client-Side Auth Bindings

### 1. Web Client ([`apps/web/lib/auth-client.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-client.ts))
```ts
export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    phoneNumberClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
```
- Consumes cookies natively via Next.js and browser credentials.

### 2. Driver App Client ([`apps/driver-app/lib/auth-client.ts`](file:///C:/dev/moja-buss/apps/driver-app/lib/auth-client.ts))
```ts
export const authClient = createAuthClient({
  baseURL: process.env["EXPO_PUBLIC_API_URL"],
  plugins: [
    emailOTPClient(),
    phoneNumberClient(),
    expoClient({
      scheme: "driver-app",
      storage: SecureStore,
      storagePrefix: "driver-app",
    }),
  ],
});
```
- Uses `expo-secure-store` to persist `driver-app_cookie`.
- Helper `syncAuthCookiesFromResponse` parses incoming `Set-Cookie` headers and keeps SecureStore synchronized across tRPC requests.

### 3. Traveler App Client ([`apps/traveler-app/lib/auth-client.ts`](file:///C:/dev/moja-buss/apps/traveler-app/lib/auth-client.ts))
```ts
export const authClient = createAuthClient({
  baseURL: process.env["EXPO_PUBLIC_API_URL"],
  plugins: [
    emailOTPClient(),
    phoneNumberClient(),
    expoClient({
      scheme: "traveler-app",
      storage: SecureStore,
      storagePrefix: "traveler-app",
    }),
  ],
});
```
- Uses `traveler-app_cookie` in SecureStore with independent cookie management to prevent token collisions on multi-app devices.

---

## 5. Security & CSRF Architecture

1. **CSRF Middleware in tRPC ([`apps/web/trpc/init.ts`](file:///C:/dev/moja-buss/apps/web/trpc/init.ts#L80-L94))**:
   - Better Auth session cookies use `SameSite=Lax`.
   - To protect state-mutating procedures (`type === "mutation"`), `csrfMiddleware` invokes [`isMutationOriginAllowed`](file:///C:/dev/moja-buss/apps/web/lib/mutation-origin.ts).
   - Validates `Origin` against `Host` and explicit `ALLOWED_ORIGINS`.
   - Native mobile requests with no `Origin` header are explicitly permitted via native scheme validation.
2. **Procedure Authorization Hierarchy**:
   - `publicProcedure`: Public access, rate limited by client IP (`publicMutationLimiter`, max 120/min).
   - `protectedProcedure`: Requires valid `ctx.user.id` session, rate limited per user (`protectedMutationLimiter`, max 60/min).
   - `operatorProcedure`: Enforces `user.role === "OPERATOR" || user.role === "ADMIN"`.
   - `operatorCompanyProcedure`: Resolves active non-deleted `Operator` profile and `companyId`, rejects `status === "SUSPENDED"`.
   - `adminProcedure` / `adminStaffProcedure`: Enforces `user.role === "ADMIN"`, resolves active non-deleted `AdminStaff` row, rejects `status === "SUSPENDED"`.
   - `driverProcedure`: Enforces valid `DriverProfile`, blocks suspended accounts (`verificationStatus === "SUSPENDED"`) from mutations and token minting, blocks unverified drivers (`!canOperateRuns`) from starting trips or toggling shifts.
