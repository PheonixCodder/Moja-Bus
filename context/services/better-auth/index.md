# Better Auth — Moja Ride Integration Guide

**Source**: https://better-auth.com  
**Package**: `better-auth` (server: `apps/web/lib/auth-server.ts` | client: `packages/auth/src/`)

---

## 1. Philosophy & Auth Model

Moja Ride uses **True Passwordless Authentication**. Standard email/password login is disabled platform-wide. Authentication flows are:
- **OTP via Email** (web passengers, operators, admin staff)
- **OTP via Phone/SMS** (traveler mobile app, driver mobile app)

---

## 2. Server Configuration (`auth-server.ts`)

Key plugins and settings active in Moja Ride:
- **`emailOtp`**: Issues one-time codes, manages verification and login via OTP; rate-limited server-side.
- **`phoneNumber`**: Enables phone-based OTP for mobile apps; sends codes via Novu/SMS.
- **`organization`**: Multi-tenancy plugin for bus operator companies; manages members, invitations, and roles.
- **`twoFactor`**: Optionally enforced for admin staff actions.
- **`cookieCache`**: `maxAge: 300` (5 minutes), `strategy: "compact"` — prevents stale sessions from persisting after revocation.
- **`rateLimit`**: `storage: "database"` — ensures multi-instance (Vercel + custom server) rate limit consistency.

---

## 3. RBAC & Role Model

| Role | Description |
| :--- | :--- |
| `SUPER_ADMIN` | Platform-level access. Can manage all operators, users, and system config. |
| `ADMIN` | Admin staff with limited scoped keys (e.g. `drivers:verify.read`). |
| `OPERATOR` | Operator company owner. Full access within their `companyId` tenancy. |
| `STAFF` | Operator staff sub-roles: `MANAGER`, `DISPATCHER`, `OPERATIONS`, `CONDUCTOR`, `FINANCE`. |
| `DRIVER` | Driver account. Restricted to driver-app flows and own driver profile only. |
| `PASSENGER` | Default user role. No portal access. |

### Tenancy Rules
- Every operator query MUST include a `companyId` check on the server. Never expose cross-operator data.
- Admin staff permissions are key-based (e.g. `operators:read`, `drivers:verify.write`). Always check via `adminProcedure` middleware.

---

## 4. Client Setup (Mobile Apps)

Mobile apps (`traveler-app`, `driver-app`) use:
```ts
import { createAuthClient } from "better-auth/react";
const authClient = createAuthClient({ baseURL: process.env.EXPO_PUBLIC_API_URL });
```

- Auth state is managed via `authClient.useSession()`.
- Mobile OTP flow: `authClient.phoneNumber.sendOtp(phone)` → `authClient.phoneNumber.verifyOtp(phone, code)`.

---

## 5. Session Invariants
- After OTP verification, the session cookie TTL is 30 days, but cookie cache is 5 minutes.
- The telemetry server uses signed JWT tokens (`mintTelemetryToken`) separately from Better Auth sessions — do not conflate these.
- Never expose `process.env.BETTER_AUTH_SECRET` in any client-side file.
