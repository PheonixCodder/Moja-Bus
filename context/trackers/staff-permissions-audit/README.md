# Staff System & Permissions Audit

> **Scope:** Complete audit of the operator staff system **and** the platform-admin staff system —
> roles, permission catalog, per-action/per-item authorization, sidebar gating, staff management,
> invitations, settings, and the underlying Prisma/session model.
> **Generated:** 2026-08-06 (1st pass) · **Re-audited:** 2026-08-07 (2nd pass, both systems)
> **Author:** opencode (deep audit)
> **Note:** **`12-consolidated-findings-2026-08-07.md` is the LIVE, canonical findings doc.**

---

## How to read this report (2nd pass, 2026-08-07)

The second-pass audit split audit work by subsystem under three folders. Read them in this order:

| File | Content |
|---|---|
| [`00-baseline-source-of-truth.md`](./00-baseline-source-of-truth.md) | **Verified** operator catalog (42 keys), role-template matrix, role hierarchy, authorize helpers, procedure chain, Prisma models. Start here. |
| [`12-consolidated-findings-2026-08-07.md`](./12-consolidated-findings-2026-08-07.md) | **LIVE consolidated findings** across operator + admin + shared, ranked by severity. This is the canonical open-gap tracker. |
| [`operator/`](./operator/) | Operator subsystem audits: `01-staff-router.ts.md`, `02-cross-cutting-routers.ts.md`, `03-features-ui.ts.md`. |
| [`admin/`](./admin/) | Platform-admin subsystem audits: `01-admin-staff-router.ts.md`, `02-features-ui.ts.md`. |
| [`shared/`](./shared/) | Pages / route-guards / prefetch / Prisma schema audits: `04-pages-guards-schema.ts.md`. |

### Archived history (1st pass, 2026-08-06 — stale, operator-only)

These flat files are the original operator-only audit. **They are preserved as history** but are
**superseded** by `00-` + `12-` + the subsystem folders (they still reference the old "31 keys",
`company:update`, 6 roles, and have no admin-system coverage). Consult them only for historical
context; do not rely on their counts or statuses.

| Archived file | 1st-pass content |
|---|---|
| [`01-iam-architecture.md`](./01-iam-architecture.md) | Original operator IAM architecture narrative. |
| [`02-permission-catalog.md`](./02-permission-catalog.md) | Original catalog listing (stale: "31 keys"). |
| [`03-role-template-analysis.md`](./03-role-template-analysis.md) | Original role-template analysis. | 
| [`04-router-guard-audit.md`](./04-router-guard-audit.md) | Original operator router-procedure gate audit. |
| [`05-page-route-audit.md`](./05-page-route-audit.md) | Original operator page/sidebar audit. |
| [`06-action-gating-audit.md`](./06-action-gating-audit.md) | Original view-level action gating. |
| [`07-staff-management-audit.md`](./07-staff-management-audit.md) | Original Staff page deep dive. |
| [`08-settings-audit.md`](./08-settings-audit.md) | Original Settings deep dive. |
| [`09-flows.md`](./09-flows.md) | Original end-to-end flows. |
| [`10-consolidated-findings.md`](./10-consolidated-findings.md) | Original consolidated findings (superseded by `12-`). |
| [`11-recommendations.md`](./11-recommendations.md) | Original remediation plan. |

---

## Executive summary (2nd pass)

### What is good
- **Operator server-side enforcement is solid.** Every operator data mutation/query in the feature routers is gated through `requirePermission(ctx, "<key>")` (`apps/web/lib/permissions/authorize.ts:43`); OWNER / platform-ADMIN bypass and SUSPENDED-block are centralized in `operatorHasPermission`.
- **Operator ownership transfer** is hardened with an OTP (`staff.requestTransferOtp`/`transferOwnership`); role changes reset permissions to the role template; grant confinement is enforced by `requireCanGrant`; sessions are force-invalidated (`session.deleteMany`) on operator suspend/remove.
- **Admin-staff router is correct.** `admin-staff.ts` gates on `admin-staff:*` + `requireAdminCanGrant` + hierarchy; SUPER_ADMIN is protected and transfer is SUPER_ADMIN+OTP-gated; sessions deleted on suspend/remove. The catalog, hierarchy and grant helpers there are sound.

### What is broken (headline items, 2nd pass)
1. **CRITICAL — the entire `admin.ts` router is gated only by `User.role === "ADMIN"`.** No `admin-staff:*` key, no `requireSuperAdmin`; the 57-key admin catalog is enforced only inside the Admin Staff screen. Suspended/demoted admins keep full backend access. (`12-` A1 / `admin/01`)
2. **CRITICAL — admin invites are dead.** `/admin/invite` has no route and no accept mutation; admins are provisioned only via seed script. `admin/01` A2.
3. **Operator compliance-doc IDOR** — `storage.presignDownload` isn't company-scoped → cross-company read. (`12-` O1 / `operator/02`)
4. **`getDashboardMetrics` revenue leak** to read-only staff. (`12-` O2)
5. **`bookings:checkin` is dead** — CONDUCTOR can't check in; cancel key inconsistent across routers. (`12-` O7/O8)
6. **Various client leaks** (fleet view, bookings CSV export, settings forms) and wrong client keys (transfer visibility, invite cancel/resend). (`12-` O3-O6, O10, O11)
7. **No AdminRouteGuard**; admin layout checks only `user.role`. (`12-` S1)
8. Operator `OperatorRouteGuard` is client-only and doesn't gate SSR prefetch (routes page). (`12-` S2)
9. No schema single-owner constraint; invitation-token columns not labelled as hashes; no `emailVerifiedAt`. (`12-` S3-S5)

### Key corrected facts (vs 1st pass)
- Operator catalog is **42 keys** (not 31 / 40); confirmed by counting `PERMISSION_META`.
- 9 operator roles (added DISPATCHER / TREASURY / CONDUCTOR); platform-ADMIN not a role here.
- Admin system = 6 roles; `admin-staff:*` + `audit:read` are the only enforced admin keys.

### Counts (2nd pass)
- **Operator:** 42 permission keys · 9 roles · ~135 tRPC procedures audited.
- **Admin:** 6 roles · 14 admin-staff procedures correctly gated · **45+ admin.ts procedures with ZERO IAM gate** · 57 admin-catalog keys, only 5 enforced.
- **Shared:** pages / guards / Prisma model audit.
- **~32 consolidated open findings** ranked in [`12-consolidated-findings-2026-08-07.md`](./12-consolidated-findings-2026-08-07.md).
