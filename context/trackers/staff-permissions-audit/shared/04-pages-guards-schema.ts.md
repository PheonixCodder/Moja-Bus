# Shared Audit — Dashboard Pages, Route Guards, Prefetch, and Prisma IAM Schema

Scope: the operator + admin staff permission systems at the **presentation layer (pages/layouts/guards)** and the **Prisma IAM schema + router session-invalidation edges** that those surfaces depend on.

Files read in full:
1. `apps/web/features/operator/components/route-guard.tsx` (OperatorRouteGuard)
2. `apps/web/features/operator/components/access-denied-card.tsx`
3. `apps/web/features/operator/hooks/use-staff-permissions.ts`
4. `apps/web/features/admin/hooks/use-admin-permissions.ts`
5. `apps/web/lib/permissions/staff-hierarchy.ts` + `apps/web/lib/permissions/admin-staff-hierarchy.ts` (re-export from `@moja/schemas`)
6. `apps/web/lib/permissions/authorize.ts`
7. `packages/schemas/src/permissions.ts` (operator 40-key catalog) + `packages/schemas/src/admin-permissions.ts` (admin catalog)
8. `apps/web/trpc/init.ts` (procedures / middlewares)
9. ALL operator dashboard pages under `app/[locale]/dashboard/operator/**` and ALL admin pages under `app/[locale]/dashboard/admin/**` (prefetch calls enumerated below)
10. `app/[locale]/dashboard/operator/(dashboard)/layout.tsx` + `error.tsx`; `app/[locale]/dashboard/admin/layout.tsx`
11. `packages/db/prisma/schema.prisma` — User, Session, Company (partial), Operator, AdminStaff, AdminStaffInvitation, StaffInvitation, AdminStaffActivityLog, ActivityLog + enums `UserRole`, `StaffRole`, `AdminStaffRole`, `AdminStaffStatus`, `OperatorStatus`, `InvitationStatus`
12. Session-invalidation call-sites in `apps/web/trpc/routers/staff.ts` + `admin-staff.ts`

---

## EXECUTIVE FINDINGS (top 3)

1. **The entire admin surface (every `admin.ts` route) is gated ONLY by `User.role === "ADMIN"`, not by AdminStaff role/status/permissions.** `adminProcedure` (trpc/init.ts:218-232) checks the global `user.role`; every `admin.ts` procedure uses bare `adminProcedure` (`admin.ts:17,35,77,...2383`) — `requireAdminPermission` is used **only inside `admin-staff.ts`**. None of the ADMIN_PERMISSION_META keys (`admin-permissions.ts:28-109`) gate the users/companies/verifications/financials/ledger/trips/blog/settings surfaces. The admin layout (admin/layout.tsx:23-27) likewise checks only `user.role`. The admin IAM catalog is effectively decorative outside the Admin Staff screen.
2. **Operator route gating is CLIENT-ONLY; it never blocks the request and does NOT guard prefetch.** `OperatorRouteGuard` (route-guard.tsx:32-39) resolves the current tab's permission client-side and swaps `children` for `<AccessDeniedCard/>` — it does not `redirect()` or throw, so the SSR prefetch (which happens *before* this client render, in the layout and page/server components) still runs fully. Three prefetch gaps follow: routes page prefetches `terminals.list` (requires `terminals:read`, terminals.ts:40) which a `routes:read`-only user cannot run (routes page:19); settings/banking prefetches `operator.listBankAccounts` (requires `company:view` OR `financials:view`, settings.ts:390); and the global operator layout prefetches data on every route regardless of the tab.
3. **No schema-level single-owner constraint exists, and the operator is missing `suspendedAt`/`ownerUserId`.** Operator (schema.prisma:560-611) has `deletedAt`, `status`, `isActive`, `permissions String[]`, `role` — but NO `suspendedAt`, NO `removedAt`, NO `ownerUserId`, and `permissions` is `String[]` (not JSON). The only unique on the model is `@@unique([userId, companyId])` (schema:606); nothing prevents two `role=OWNER` rows for one company (ownership is expressed only by `role`). Both invitation models store the token **hashed** (sha256 of a 32-byte random, e.g. admin-staff.ts:663-679) but the schema column is named `token`/`@unique` with a comment-free plaintext-looking name, and NEITHER invitation model has an `emailVerifiedAt` column.

---

## A. OperatorRouteGuard behavior

**Where it lives:** `apps/web/features/operator/components/route-guard.tsx` (NOT under `lib/permissions/` — glob resolves to `features/operator/components/route-guard.tsx`). Applied once in the operator dashboard layout, wrapping `{children}`: `app/[locale]/dashboard/operator/(dashboard)/layout.tsx:55`.

**How it decides which tab a route needs (§ A):**
- Hard-coded static `ROUTE_PERMISSIONS` map, keyed by pathname → array of `PermissionKey` (route-guard.tsx:8-21). Exact-match is tried first (`resolvePermissions`, route-guard.tsx:24), then a **prefix fallback**: any path under `/dashboard/operator/<key>/` inherits that key's permissions (route-guard.tsx:26-28). Keys used: overview (needs `trips:read` OR `bookings:read` OR `company:view`), trips, bookings, reviews, terminals, routes, schedules, fleet, revenue, withdraw, staff, settings (company:view).
- It calls `useStaffPermissions().can()` (route-guard.tsx:34,37) which returns `true` for OWNER immediately and otherwise checks the stored permission set (use-staff-permissions.ts:16-19).
- Guard logic — **does it block direct-URL access?** It does **NOT** block at the network/server level and does **NOT** redirect. On a mismatch it renders `<AccessDeniedCard/>` in place of `children` (route-guard.tsx:37-39). Because it runs entirely client-side, *after* the layout/page server components have already run, the tab's SSR prefetches (§ C) execute regardless of whether the guard will show the card — and the denied card is only swapped in post-hydration.

**Settings sub-routes:** `settings/*` are NOT individually listed; only `/settings` → `company:view` is, and prefix matching makes `settings/banking|personal|compliance|notifications` all require `company:view` (route-guard.tsx:20,27). The `/dashboard/operator/settings` root simply `redirect()`s to `settings/company` (settings/page.tsx:4).

**Non-tab routes (onboarding/welcome)**: `/dashboard/operator/onboarding` and `/welcome` live in their own layouts (separate `onboarding/layout.tsx`, `welcome/layout.tsx`) and are NOT wrapped by OperatorRouteGuard — `resolvePermissions` returns `undefined` for them (route-guard.tsx:23-30), so entry is permitted for any OPERATOR/ADMIN role.

## B. Is there an AdminRouteGuard?

**No.** There is no `AdminRouteGuard` component in the repo (grep returns zero matches for `AdminRouteGuard` anywhere). The admin layout `app/[locale]/dashboard/admin/layout.tsx:17-27` is the ONLY route-level gate:
- `getServerSession()` → `redirect("/login")` if no session (layout:19-21).
- role = `(session.user as any)?.role || "TRAVELER"`; requires `=== "ADMIN"` (layout:23-27), else redirect `/dashboard`.
- No check of `AdminStaff.status`, `AdminStaff.deletedAt`, `AdminStaff.role`, or any `admin-staff:*`/platform permission. So a suspended admin staff member whose underlying `User.role` is still `ADMIN` keeps full admin page access (their sessions ARE deleted by the suspend procedure — § E — but that only forces a re-login; after login the layout admits them again).

The admin **permission catalog IS used**, but only at component granularity: 
- `admin-sidebar.tsx:53,135,339` filters nav items with `can(item.permission)` (`can` from `useAdminPermissions`, default role SUPPORT).
- `admin-staff-view.tsx:67-68,104,340,364-366,384` uses `can("admin-staff:*")` to hide actions.
- No other admin view gates on permissions; the layout + `admin.ts` procedures only check `user.role`.

## C. Prefetch audit — page → prefetch list → required perm → verdict

Operator layout-level prefetch (runs on EVERY operator tab, before guard):
- `trpc.operator.getShellContext` (layout:38) — `operatorCompanyProcedure`, returns own profile+company; no permission gate; OK.
- `trpc.staff.getMyPermissions` (layout:39) — `operatorCompanyProcedure`, any operator; OK.

### Operator pages (page → server prefetch → required permission → OK?)
| Page | Prefetch (file:line) | Server perm (router:line) | Gap |
|---|---|---|---|
| `/operator` overview | `operator.getOnboardingStatus` (page:23), `staff.getMyPermissions` (page:24), `operator.getDashboardMetrics` (page:49) | getOnboarding: operatorProcedure (no gate); getDashMetrics: `requireAnyPermission([trips:read,bookings:read,company:view])` (operator.ts:1616) | Dashboard itself further gates via `permsData` server check (page:31-47); OK |
| `/operator/trips` | `trips.list` (trips/page:38) | `trips:read` (trips.ts:168) | OK (guard requires trips:read) |
| `/operator/bookings` | `operator.listBookings` (bookings/page:28) | `bookings:read` (operator.ts:1056) | OK |
| `/operator/reviews` | `operator.listReviews` (reviews/page:16) | `bookings:read` → actually `reviews:read` (operator.ts:1293) | Guard = reviews:read; OK |
| `/operator/terminals` | `terminals.list` + `routes.getCities` (terminals/page:17-18) | terminals:read — routes.getCities `requireAny([routes:read,terminals:read])` (routes.ts:30) | OK |
| `/operator/routes` | `routes.list` + `terminals.list{bookableOnly}` (routes/page:18-19) | routes.list: `requireAny([routes:read,terminals:read])` (routes.ts:30); **terminals.list: `terminals:read` (terminals.ts:40)** | **GAP** — a user with `routes:read` but not `terminals:read` triggers a FORBIDDEN on the SSR prefetch → page throws to `error.tsx` (AccessDeniedCard) even though the route guard allowed it. |
| `/operator/schedules` | `schedules.list` (schedules/page:18) | `schedules:read` (schedules.ts:333) | OK |
| `/operator/fleet` | none (fleet/page:19-24) — client view gates itself | `AccessDeniedCard permission="fleet:read"` in `operator-fleet-view.tsx:766` | No SSR prefetch of fleet data → OK |
| `/operator/revenue` | `operator.getRevenueAnalytics`, `getAccountSnapshot`, (tab==ledger) `getLedgerEntries` (revenue/page:27-42) | revenue:view (operator.ts:1362,1845,1518); ledger also revenue:view | OK |
| `/operator/withdraw` | `operator.getAccountSnapshot`, `operator.listWithdrawals` (withdraw/page:19-23) | revenue:view + withdrawals:view (operator.ts:1874) | OK |
| `/operator/staff` | `staff.listStandard`, `staff.listInvitations`, `staff.getActivityLog`, `staff.getMyRole` (staff/page:19-31) | `staff:read` (listStaff.ts:146); staff:read (listInvitations:573); staff:read (getActivityLog:903); getMyRole: no gate | OK |
| `/operator/settings/*` (layout) | `settings/getSettings` (settings/layout.tsx:18) | getSettings `requireAny([company:view ...])` (settings.ts:390) | OK |
| `/operator/settings/banking` | `operator.listBankAccounts`, `payments.listBanks` (banking/page:8-11) | listBankAccounts: `requireAny([company:view, financials:view])` (settings.ts:390); listBanks: public | OK |

Only **/operator/routes** has an actual prefetch-vs-route-access mismatch on the operator side. (Other pages consistently gate their prefetch to exactly their route-guard permission.)

**Admin pages:** every admin page prefetches `admin.*` / `adminStaff.*` / `payments.*`. All `admin.*` reads run under bare `adminProcedure` (role-only), so any `User.role === ADMIN` — even one with NO AdminStaff row, or a SUSPENDED admin staff row — can fetch them; the prefetch never fails on permission. The one exception is the **Admin Staff page**, which prefetches `adminStaff.getMyPermissions` (admin-staff.ts:129, under `adminStaffProcedure`, init.ts:234-250 → requires an adminStaff row AND not SUSPENDED). A `user.role=ADMIN` who is not in the `admin_staff` table trips this at SSR and the whole staff page errors (there is no AccessDenied/fallback on the admin side, unlike operator's error.tsx).

No **low-privilege operator** successfully reads data they cannot access (the RPC for a missing permission throws → error boundary). But when a user has a *partial* read set that matches the route guard yet not the prefetch's own gate — the `routes` page case above — the SSR prefetch throws FORBIDDEN and breaks the render instead of showing the denied card. That is a UX/robustness bug introduced by prefetching beyond the route guard's required permissions.

---

## D. Prisma schema — field-by-field

### Operator (schema.prisma:560-611)
- `id`, `userId` (FK Cascade), `companyId` (FK Cascade), `@unique([userId, companyId])` (606), `@index([companyId])` (607), `@index([userId])` (608), `@index([role])` (609).
- **Role/permissions:** `permissions String[] @default([])` (572 — a native PostgreSQL array of permission keys, NOT a JSON column; caller's "permissionsJson" does not exist as such), `permissionsUpdatedAt` (573), `permissionsUpdatedBy` (574), `role StaffRole @default(OWNER)` (575), `status OperatorStatus @default(ACTIVE)` (576), `isActive` (577), `isVerified` (578), `deletedAt DateTime?` (579), `onboardingStatus` (582).
- **MISSING vs the request:** **no `suspendedAt`** (only `status=SUSPENDED` + `deletedAt`; suspend is a status transition in staff.ts:321-325); **no `removedAt`** (only `deletedAt`, staff.ts:371); **no `ownerUserId`** field. Ownership is expressed only by `role=OWNER`; there is NO explicit owner pointer (e.g. `Company.ownerId` or `Operator.ownerUserId`). `permissions` is `String[]`, NOT JSON (caller asked about "permissionsJson" — it is a native PostgreSQL array).
- `@@unique([userId, companyId])` is correct (one staff row per user per company).

### AdminStaff (schema.prisma 678-705)
- `userId @unique` (680) — one admin staff row per user. `role AdminStaffRole @default(SUPPORT)` (684), `permissions String[] @default([])` (685), `permissionsUpdatedAt` (686), `permissionsUpdatedBy` (687), `status AdminStaffStatus @default(ACTIVE)` (688), `isActive` (689), `deletedAt` (690). `@index([role])` (702), `@index([status])` (703). All fields the routers reference are present.

### Invitation models — hashed token, NO emailVerifiedAt
- `StaffInvitation` (1934-1958): `email`, `role StaffRole @default(OPERATIONS)`, `permissions String[]` (1939), `companyId` FK Cascade, `token String @unique` (1944), `expiresAt DateTime` (1945), `status InvitationStatus @default(PENDING)` (1946), `invitedById`/`acceptedById` FK relations (1948-1950), `createdAt`/`updatedAt`. **No `emailVerifiedAt`** field.
- `AdminStaffInvitation` (707-729): `role AdminStaffRole` (710, no `@default` — unlike `StaffInvitation.role` which defaults to OPERATIONS), `permissions String[]` (711), `token String @unique` (714), `expiresAt` (716), `status String @default("PENDING")` (715 — **raw String, not enum**, whereas `StaffInvitation.status` uses the `InvitationStatus` enum). **No `emailVerifiedAt`** field.
- **Token storage:** The schema column is named/typed `token String @unique` (looks plaintext), but both routers actually store a **sha256 hex hash** of a 32-byte random: creation hashes the raw token (admin-staff.ts:663-679; staff.ts invite path likewise), and validation/acceptance hash the incoming token before lookup (invitation.ts:44,92). So tokens ARE hashed at rest — but the column is not named `tokenHash`, the hash is an unsalted sha256 (not scrypt/bcrypt/argon2), and there is no schema-level annotation documenting the hashing.

### User / Session (schema.prisma 216-292)
- `User`: `role UserRole @default(TRAVELER)` (224), `operatorProfiles Operator[]` (239) — good. Has `role @index` (274). `workEmail`/`workPhone` unique (227-228). AdminStaff relation at 256, invitations relations at 250-258 ✓ (StaffInvitation + AdminStaffInvitation relations present, no orphan).
- `Session`: `token @unique` (289), `expiresAt`, `userId @index` (290) + FK Cascade to User (287). No `userId` on `Session` unique needed. `@index([userId])`.

---

## E. Session invalidation on suspend/remove

**Operator (business staff):** BOTH procedures force-invalidate sessions:
- `updateStatus` → SUSPENDED: `ctx.prisma.session.deleteMany({ where: { userId: target.userId } })` (staff.ts:321-325) runs before the status update.
- `removeStaff`: `tx.session.deleteMany({ where: { userId: target.userId } })` inside the transaction (staff.ts:377-379), alongside the soft-delete + activity log.

**Admin staff:** mirrored exactly:
- `adminStaff.updateStatus` → SUSPENDED: `session.deleteMany` (admin-staff.ts:316-320) before the status update.
- `adminStaff.removeStaff` → `tx.session.deleteMany` in txn (admin-staff.ts:372-374).

Both systems invalidate sessions on suspend AND remove. **However**, for admin staff this is not a *complete* lockout: deleting the sessions only logs the user out once. Because `adminProcedure` (init.ts:218-232) and the admin layout (admin/layout.tsx:23-27) still accept any `User.role === "ADMIN"`, a SUSPENDED admin staff member with a still-`ADMIN` user account can simply re-login and regain the full admin surface. The SUSPENDED gate that actually blocks is `adminStaffProcedure` (init.ts:245), which is applied **only** on the small `admin-staff.ts` router. 

For operator staff the lockout is complete: SUSPENDED is additionally rejected by `operatorCompanyProcedure` (init.ts:201-206), which backs every operator router.

---

## F. Single-owner enforcement
- **No unique/index can prevent two OWNERs.** Owner is modeled purely as a programmatic value `role=OWNER` (and the permission set empty for OWNER). There is no `Company.ownerId`/`ownerOperators` relation and no partial unique that scopes "only one OWNER per company".
- `@unique([userId, companyId])` (Operator:606) only guarantees a user can't be a second row for the same company; nothing stops two distinct users from both being `role=OWNER`.
- Transfer-ownership dialogs (`features/operator/components/staff/transfer-ownership-dialog.tsx`) change roles via procedure but rely on application logic (`requireOwner`, assert target, etc.) described in other audit files — no DB-level guarantee.

## G. Orphaned models / relations
- `AdminStaff.userId` (@unique) + `AdminStaff.user` FK; `AdminStaffInvitation.invitedById`/`acceptedById` FK to User (via relations "AdminInvitationsSent"/"AdminInvitationsAccepted", schema:718,720) — both resolve; no dangling FK. Users are never hard-deleted so these cannot orphan in practice.
- `StaffInvitation.companyId` FK `onDelete: Cascade` (schema:1943) — fine.
- `Operator.deletedAt` rows remain in the table (soft-delete); the `Operator` FK stays intact, so no hard-delete orphans. Acceptable, but note soft-deleted operators are only filtered via `deletedAt: null` at the procedure layer (e.g. init.ts:186).
- `AdminStaff` hard-links `userId` with `onDelete: Cascade` (schema:681): deleting a User silently deletes its AdminStaff row + (via User cascade) its activity logs — no orphan, but cascading a hard user-delete through the IAM audit trail is worth flagging.
- No orphaned relation blocks found; enums and models are mutually consistent.

## H. TODO/FIXME / dead code
- **No admin-only route guard and no admin access-denied page.** No `AdminRouteGuard` exists and the admin side has no equivalent of the operator `error.tsx` fallback. If an admin page prefetch throws (e.g. the Admin Staff page for a `user.role=ADMIN` who has no AdminStaff row), the admin sees a raw error, not a denied card.
- **Admin permission catalog effectively dead outside admin-staff.** `ADMIN_PERMISSION_META` (admin-permissions.ts:28-109) is consulted only by `admin-staff.ts` (via `requireAdminPermission` for `admin-staff:*` + `audit:read`) and by the sidebar/`admin-staff-view` components. No `admin.*` procedure or admin page gates on it, so it cannot restrict any non-staff admin surface even if the UI hides nav items.
- **Hard-coded route→permission map** (`route-guard.tsx:8-21`) duplicates the catalog and can drift from `@moja/schemas`; recommend validating the map against `PERMISSION_KEYS` at build time (code TODO).
- **`AdminStaffInvitation.status` typed as raw `String @default("PENDING")` (schema:715) vs `StaffInvitation.status` using the `InvitationStatus` enum (schema:1946)** — inconsistent schema typing across the two IAM invitation models.
- **No `emailVerifiedAt` on either invitation model** (StaffInvitation 1934-1958, AdminStaffInvitation 707-729); validated/accept paths (invitation.ts, admin-staff.ts:638-682) do not read one. If email-verification-before-accept is required, the column is absent.
- **Global operator layout prefetches for every tab** (`getShellContext`, `getMyPermissions` — layout:38-39) run before any tab-permission check; benign but a token of the guard-not-gating-prefetch design.
- Redundant `canModifyTarget`/OWNER-guard overlap in `removeStaff`/`removeAdminStaff` is already covered by the operator/01 and admin/01 router audits — none new at page/schema layer.

## Files referenced (file:line) index (non-exhaustive)
- `features/operator/components/route-guard.tsx:8-30,32-39`
- `trpc/init.ts:164-216` (operator), `218-259` (admin)
- `trpc/routers/admin.ts:17,131,395,2179,2383 …` (all bare `adminProcedure`)
- `trpc/routers/admin-staff.ts:129,142,304,316-320,350-389,638-682`
- `trpc/routers/staff.ts:306-397` (session invalidation at 321-325, 377-379)
- `packages/db/prisma/schema.prisma` Operator 560-618, AdminStaff 678-705, AdminStaffInvitation 707-729, StaffInvitation 1934-1958, User 216-276, Session 278-292