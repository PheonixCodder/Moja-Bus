# 05. Audit Findings, Gap Register, & Recommendations

This document contains the categorized findings, severity-ranked gap register, and strategic recommendations resulting from the full-system authentication and authorization audit.

---

## 1. Severity-Ranked Findings Catalog

| Finding ID | Severity | Category | Affected File(s) | Summary | Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-AUTH-01** | **P2** (Major) | Schema Drift | [`packages/schemas/src/auth.ts`](file:///C:/dev/moja-buss/packages/schemas/src/auth.ts) | `loginInputSchema` and `registerInputSchema` contain mandatory `password` fields (`min(8).max(128)`), left over from legacy credential authentication. | Deprecate password fields in `packages/schemas/src/auth.ts` and align schemas with passwordless OTP types. |
| **F-AUTH-02** | **P2** (Major) | Context Drift | [`context/domain-specs/auth-and-rbac.md`](file:///C:/dev/moja-buss/context/domain-specs/auth-and-rbac.md), [`apps/web/lib/auth-server.ts`](file:///C:/dev/moja-buss/apps/web/lib/auth-server.ts#L99) | `auth-and-rbac.md` and `better-auth/index.md` specify `cookieCache: { enabled: true, maxAge: 300 }`, whereas `auth-server.ts` explicitly disabled `cookieCache` to prevent Expo mobile session desyncs. | Update domain specifications to reflect that `cookieCache` is disabled for mobile session reliability. |
| **F-AUTH-03** | **P2** (Major) | Storage / KYC | [`apps/web/features/driver/lib/driver-doc-mint.ts`](file:///C:/dev/moja-buss/apps/web/features/driver/lib/driver-doc-mint.ts) | Presigned driver compliance document URLs have a hardcoded 5-minute TTL. While optimal for security, operators on slow cellular networks performing detailed inspections can experience broken image previews. | Implement automatic client-side re-presigning or increase presigned GET window to 15 minutes for verification dialogs. |
| **F-AUTH-04** | **P3** (Polish) | Mobile UX | [`apps/driver-app/features/auth/screens/login.tsx`](file:///C:/dev/moja-buss/apps/driver-app/features/auth/screens/login.tsx#L157-L164), [`apps/traveler-app/features/auth/screens/login.tsx`](file:///C:/dev/moja-buss/apps/traveler-app/features/auth/screens/login.tsx#L183-L195) | Better Auth error codes (`TOO_MANY_ATTEMPTS`, `INVALID_OTP`, `OTP_EXPIRED`) are partially mapped, but network timeouts and unexpected error shapes sometimes display generic French error toasts. | Unify mobile error handling helper using a shared `formatAuthError` utility across `driver-app` and `traveler-app`. |
| **F-AUTH-05** | **P3** (Polish) | Consistency | [`apps/web/trpc/routers/staff.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/staff.ts) (`requestTransferOtp`, `transferOwnership`) | Ownership transfer implements an ad-hoc OTP flow backed by the `Verification` table rather than Better Auth's native `twoFactor` plugin. | Validated as fully secure (SHA-256 hashed, 10-minute expiry, single-use), but standardizing on a unified 2FA utility is recommended for long-term maintainability. |
| **F-AUTH-06** | **P3** (Polish) | Database Hygiene | [`packages/db/prisma/schema.prisma`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma) (`StaffInvitation`, `AdminStaffInvitation`) | Expired invitations (`status: "EXPIRED"` or `expiresAt < now()`) remain indefinitely in PostgreSQL without an automated background purge routine. | Add a scheduled maintenance cron (e.g. `purge-expired-invitations`) to clean up records older than 30 days. |

---

## 2. Invariant & Security Verification Checklist

The audit systematically validated the following critical security invariants across the entire codebase:

- [x] **Zero Password Authentication**: Verified that `emailAndPassword.enabled = false` in `auth-server.ts`. No password endpoints exist.
- [x] **Client-Side Role Immutability**: `user.additionalFields.role.input = false` prevents role injection via client-side registration calls.
- [x] **Multi-Tenant Isolation**: All operator procedures in `operator.ts`, `staff.ts`, and `drivers.ts` enforce `ctx.companyId` constraints, preventing cross-tenant data leakage.
- [x] **No Ghost Driver ERP Membership**: Verified that adding or registering a driver never creates an `Operator` ERP row. Roster drivers remain strictly in `DriverProfile` + `DriverCompanyAffiliation`.
- [x] **Single-Active-Exclusive Integrity**: DB partial unique index on `(driverProfileId, isActive)` where `employmentType = 'EXCLUSIVE_INTERCITY'` prevents multi-carrier collision.
- [x] **Durable Roster Deletion**: Removing a driver from a roster requires an idle run state (`currentTripId == null`), updates `isActive = false`, and notifies the driver via `driver-roster-removed`.
- [x] **CSRF Protection for Mutations**: `csrfMiddleware` in `trpc/init.ts` verifies `Origin` against `Host` and `ALLOWED_ORIGINS` for all state mutations.
- [x] **Telemetry Token Isolation**: Live telemetry ingest uses HMAC-signed dispatch JWT tokens with strict room ACLs, fully separated from session cookies.

---

## 3. Recommended Remediation Roadmap

1. **Phase A (Schema Cleanliness)**:
   - Clean up [`packages/schemas/src/auth.ts`](file:///C:/dev/moja-buss/packages/schemas/src/auth.ts) to remove unused legacy password schemas.
2. **Phase B (Doc Parity)**:
   - Update [`context/domain-specs/auth-and-rbac.md`](file:///C:/dev/moja-buss/context/domain-specs/auth-and-rbac.md) to match the current `cookieCache: { enabled: false }` production posture.
3. **Phase C (Mobile Error UX)**:
   - Share a unified `formatAuthError` helper between `traveler-app` and `driver-app` to guarantee 100% localized French feedback on all OTP failure modes.
