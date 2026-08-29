# Moja Ride — Full Authentication & RBAC System Audit

**Audit Target**: Complete Authentication, RBAC, Subroles, Invitations, OTP Workflows, Driver Lifecycle, and Better Auth Integrations across all surfaces (`apps/web`, `apps/driver-app`, `apps/traveler-app`, `packages/schemas`, `packages/db`).  
**Status**: ACTIVE AUDIT  
**Date**: 2026-08-29  
**Authors**: Core Architecture & Security Audit Team  

---

## 1. Executive Summary

This audit delivers an exhaustive, end-to-end investigation of the authentication and authorization architecture across the Moja Ride ecosystem. The platform enforces a **True Passwordless** philosophy powered by [Better Auth](file:///C:/dev/moja-buss/context/services/better-auth/index.md), PostgreSQL / Neon via Prisma, and [Novu](file:///C:/dev/moja-buss/apps/web/lib/novu.ts) notification workflows.

### Surface Breakdown

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     MOJA RIDE AUTH ECOSYSTEM                                     │
├─────────────────────────┬──────────────────────────┬─────────────────────────────────────────────┤
│ Surface                 │ Auth Modality            │ Primary Target Roles & Use Cases            │
├─────────────────────────┼──────────────────────────┼─────────────────────────────────────────────┤
│ Web (Passenger)         │ Email / Phone OTP        │ Travelers (`TRAVELER`)                      │
│ Web (Operator Portal)   │ Email / Phone OTP        │ Bus Company Owners & Staff (`OPERATOR`)     │
│ Web (Admin Portal)      │ Email OTP + Staff Invite │ Platform Super Admins & Staff (`ADMIN`)     │
│ Mobile (Traveler App)   │ SMS / Email Phone OTP    │ Mobile Passengers (`TRAVELER`)              │
│ Mobile (Driver App)     │ SMS Phone OTP            │ Commercial Bus Drivers (`DRIVER`)           │
└─────────────────────────┴──────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. Audit Document Index

The complete audit findings and architectural analyses are structured into the following numbered modules:

1. **[01-system-map.md](./01-system-map.md)** — Comprehensive architecture, engine configuration, plugins, database hooks, token & cookie cache mechanisms, and multi-tenant isolation.
2. **[02-role-flows-and-lifecycle.md](./02-role-flows-and-lifecycle.md)** — Step-by-step registration, login, invitation, and session management flows for all roles:
   - **Passengers / Travelers** (`TRAVELER`)
   - **Transport Operators** (`OPERATOR` / `OWNER`)
   - **Operator Staff** (`ADMIN`, `MANAGER`, `OPERATIONS`, `FINANCE`, `DISPATCHER`, `CONDUCTOR`, `SUPPORT`, `TREASURY`)
   - **Platform Admin Staff** (`SUPER_ADMIN`, `ADMIN`, `OPERATIONS`, `SUPPORT`, `COMPLIANCE`, `FINANCE`)
   - **Commercial Drivers** (`DRIVER`) — both Operator-added roster driver and Driver self-registration via mobile app.
3. **[03-driver-deep-dive.md](./03-driver-deep-dive.md)** — Dedicated analysis of the Driver Subsystem:
   - Mobile authentication & `@better-auth/expo` session persistence
   - 5-step mobile driver registration wizard
   - Operator Roster Provisioning (`createDriver` procedure, conflict & ambiguity detection)
   - Operational status machine & verification lifecycle (`PENDING` → `VERIFIED` / `REJECTED` / `SUSPENDED`)
   - Telemetry dispatch tokens vs session auth
   - Shift ledger & check-in authorization pipeline (`DriverCheckInService`).
4. **[04-notifications-and-templates.md](./04-notifications-and-templates.md)** — Complete audit of notification workflows, OTP delivery channels (SendGrid email / Twilio SMS), copy, error handling, and push credential management.
5. **[05-findings-and-gap-analysis.md](./05-findings-and-gap-analysis.md)** — Severity-ranked catalog of findings (P0–P3), edge cases, legacy artifacts, and remediation actions.

---

## 3. High-Level Summary of Findings

| ID | Severity | Category | Summary |
| :--- | :--- | :--- | :--- |
| **F-AUTH-01** | **P2** | Schema Drift | Legacy password fields in [`packages/schemas/src/auth.ts`](file:///C:/dev/moja-buss/packages/schemas/src/auth.ts) (`loginInputSchema`, `registerInputSchema`) contradict True Passwordless architecture. |
| **F-AUTH-02** | **P2** | Session Integrity | `cookieCache` explicitly disabled in [`apps/web/lib/auth-server.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-server.ts#L99-L102) due to Expo mobile client desync; docs in `domain-specs` still reference active cache. |
| **F-AUTH-03** | **P2** | Security / KYC | Driver Document presigned GET URLs have 5-minute expiry, but review sessions on slow mobile connections may timeout without inline re-presigning. |
| **F-AUTH-04** | **P3** | UX / Error Mapping | Better Auth error codes in mobile apps (`apps/driver-app`, `apps/traveler-app`) are partially translated, with fallback to raw backend messages. |
| **F-AUTH-05** | **P3** | Compliance | Ownership transfer OTP flow in `staff.ts` uses custom `Verification` table records instead of native Better Auth 2FA plugin. |

---

## 4. Key Architectural Invariants Verified in Code

1. **Password Auth Platform-Wide Ban**: `emailAndPassword.enabled = false` in [`apps/web/lib/auth-server.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-server.ts#L90-L92); login forms across all apps contain zero password inputs.
2. **Client Role Write Immutability**: `user.additionalFields.role.input = false` in Better Auth; role escalation via client mutation is structurally impossible.
3. **Driver / Operator ERP Separation**: Roster drivers never hold `Operator` ERP rows; their sole membership is [`DriverCompanyAffiliation`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L2350) and role is `UserRole.DRIVER`.
4. **Single-Active-Exclusive Invariant**: A driver cannot hold more than one active `EXCLUSIVE_INTERCITY` affiliation across the platform; enforced via DB partial unique index and runtime transaction checks.
5. **Driver Operational State Teardown**: Suspending or rejecting a driver atomically tears down active shifts, disassociates current trips, and revokes dispatch capability (`suspendDriverOperationalState`).
