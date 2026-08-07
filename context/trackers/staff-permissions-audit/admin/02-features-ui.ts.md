# Admin Features UI — Client-Side Gating Audit (02-features-ui.ts)

Scope: client-side (`.tsx`/`.ts` under `apps/web/features/admin/`) permission checks vs. server
ground truth in `apps/web/trpc/routers/admin-staff.ts` and the catalog in
`packages/schemas/src/admin-permissions.ts`.

## Ground truth — server gates (`apps/web/trpc/routers/admin-staff.ts`)

Every admin-staff procedure goes through `adminStaffProcedure`
(`apps/web/trpc/init.ts:234`), which loads the actor's `AdminStaff` record and
throws FORBIDDEN if `status === "SUSPENDED"` (init.ts:245). Per-mutation gates:

| Procedure | Server gate | Line |
|---|---|---|
| `listStaff` | `admin-staff:read` | admin-staff.ts:142 |
| `getStaffMember` | `admin-staff:read` | admin-staff.ts:201 |
| `updatePermissions` | `admin-staff:update` + `requireAdminCanGrant` | :227-228 |
| `updateRole` | `admin-staff:update` + `canModify` + `canAssign` + `requireAdminCanGrant` | :263-271 |
| `updateStatus` | `admin-staff:update` + `canModify` | :304-307 |
| `removeStaff` | `admin-staff:remove` + `canModify` | :350-353 |
| `requestTransferOtp` | `requireSuperAdmin` (SUPER_ADMIN only) | :395 |
| `transferOwnership` | `requireSuperAdmin` (SUPER_ADMIN only) | :461 |
| `listInvitations` | `admin-staff:read` | :580 |
| `createInvitation` | `admin-staff:invite` + `requireAdminCanGrant` | :619-620 |
| `cancelInvitation` | `admin-staff:invite` | :750 |
| `resendInvitation` | `admin-staff:invite` | :787 |
| `getActivityLog` | `audit:read` | :879 |

Non-staff admin & payments procedures (`trpc/routers/admin.ts`, `payments.ts`)
contain **no** `requireAdminPermission`/`requireSuperAdmin` — they only go through
`adminProcedure` (role ADMIN). These are the "role-ADMIN-only" server gates the
brief said are legitimate for the client to leave unchecked.

Hook semantics (`use-admin-permissions.ts`): `role` default "SUPPORT",
`can(key)` returns `true` for `role === "SUPER_ADMIN"` else `stored.includes(key)`
(lines 16-19). `adminHasPermission` returns false for SUSPENDED
(`admin-authorize.ts:37`); the client hook exposes `isActive`/`status` but **no
gate reads them** — see Residual.

---

## Verified client gates vs. server

### `admin-staff-view.tsx` (view coordinator)
- `canInvite = can("admin-staff:invite")` → header (line 340), members (line 364).
  Server `createInvitation` = `admin-staff:invite`. ✅
- `canUpdate = can("admin-staff:update")` (line 365) → row edit-role/edit-perm/suspend.
  Server updateRole/updatePermissions/updateStatus all `admin-staff:update`. ✅
- `canDelete = can("admin-staff:remove")` (line 366) → row remove + **transfer**.
  - remove: matches server `removeStaff` = `admin-staff:remove`. ✅
  - **transfer: MISMATCH** — transfer buttons are gated on `admin-staff:remove`,
    but server `transferOwnership`/`requestTransferOtp` are `requireSuperAdmin`
    (SUPER_ADMIN only). See C.
- `canDelete = can("admin-staff:remove")` → invitations resend/cancel (line 384).
  **MISMATCH** — server `cancelInvitation`/`resendInvitation` = `admin-staff:invite`.
  Wrong key (uses `remove`, needs `invite`).
- Deep-link `?member=<id>` unlock gated on `can("admin-staff:update")` (lines
  102-109), skips `SUPER_ADMIN` targets. Server `updatePermissions` = `admin-staff:update`
  + target can-modify. ✅
- `getActivityLog` prefetched unconditionally (line 85). Server requires `audit:read`.
  A member with `admin-staff:read` but without `audit:read` gets a FORBIDDEN query
  error rendered inside the page (no client `can("audit:read")` gate on the activity
  section). **MISMATCH / over-fetch, not gated.**

### staff components
- `admin-staff-member-row.tsx` — edit role/permissions + suspend/activate gated
  `canUpdate && !isSuperAdmin` (lines 116, 135); matches server `admin-staff:update`
  + cannot-modify-SUPER_ADMIN (`init.ts` / `assertCanModifyAdminTarget`). ✅
  - Transfer + remove gated `canDelete && !isSuperAdmin` (line 155).
    Remove ✅ (`admin-staff:remove`). **Transfer ⚠️ wrong key** (see C).
- `admin-staff-invitation-card.tsx` — resend (line 70) & cancel (line 81) both gated
  `canDelete`. Server expects `admin-staff:invite`. **⚠️ wrong key.**
- `admin-staff-page-header.tsx` — invite button gated `canInvite` (line 30). ✅
- `admin-staff-members-section.tsx` — empty-state invite gated `canInvite` (line 107). ✅
- `admin-staff-invitations-section.tsx` — passes `canDelete` through (line 43). ⚠️ inherits mismatch.
- `admin-staff-filters-toolbar.tsx` — **un-gated** filters (role/status/search).
  Server `listStaff` needs `admin-staff:read`; page only reachable after listStaff
  succeeds but no explicit `can("admin-staff:read")` gate. Low risk (read-only).
- `admin-staff-activity-section.tsx` / `...-activity-item.tsx` — **un-gated**; relies on
  `getActivityLog` (`audit:read`) prefetch. ⚠️ see A above.
- `transfer-ownership-dialog.tsx` — **no permission gate of its own** (opens only via
  row transfer, which is mis-gated). Confirms transfer is `requireSuperAdmin`-only
  server-side and client never checks super-admin.
- `remove-staff-dialog.tsx` — pure confirm; reachability via row `canDelete`. ✅

---

## B. Permission matrix (grant catalog / grant-capable)

`staff/permission-matrix.tsx` renders the **full admin catalog**
(`getAdminPermissionsByGroup()`, line 29) but **filters visible + toggleable keys to
`grantable`** (the actor's own effective permission set): groups/items return `null`
when not in `grantableSet` (lines 72-80) and `toggle()`/`toggleGroup()` early-return
for keys outside `grantableSet` (lines 38, 48-50).

- Client-side "assertAdminCanGrant" equivalent = the `grantable` prop + matrix
  envelope guard; **not centralized** (it's enforced in the matrix, not in an
  editor reducer / mutation). The mutation payload is constructed by the view and
  sent wholesale; the server (`requireAdminCanGrant`) is the real gate.
- `grantable` is fed from `useAdminPermissions().permissions` (admin-staff-view
  line 65 → EditPermissionsSheet/InviteSheet). For SUPER_ADMIN,
  `getAdminEffectivePermissions` returns all keys → full matrix. ✅
- **Edge quirk:** `edit-permissions-sheet.tsx` seeds the matrix with
  `member.permissions` (raw stored, line 49). If a stored member holds a key the
  editor *does not* hold (possible after a higher-ranked editor granted it), the
  matrix shows it checked/un-toggleable but the save re-submits it → server
  `requireAdminCanGrant` rejects the entire update. Not a leak, but a UX dead-end.

## C. Invite / transfer / remove / role-sheet — correct keys?

- Invite: `admin-staff:invite` ✅ (view line 340/364; invite-sheet seeded from
  `grantable` + `assignableRoles`). Server `createInvitation` = `admin-staff:invite`. ✅
- Remove: `admin-staff:remove` ✅ (view line 366 → row 155 → dialog). Server
  `removeStaff` = `admin-staff:remove`. ✅
- Role-sheet: opened only via `canUpdate` (`admin-staff:update`) ✅; target role
  restricted by `assignableRoles = ADMIN_ASSIGNABLE_ROLES[role]` (view line 403,
  use-admin-permissions line 28). `role-sheet.tsx` falls back to a hardcoded
  `FALLBACK_ROLES` list (lines 40-46) only if `assignableRoles` is empty — view
  always passes real roles, so fallback never fires (and can't elevate, since it
  excludes SUPER_ADMIN).
- **Transfer: wrong key.** Row gates transfer on `canDelete` = `admin-staff:remove`
  (line 155 / view line 366), but server `transferOwnership` requires
  `requireSuperAdmin` (line 461). A non-super-admin holding `admin-staff:remove`
  sees "Transfer Ownership" and can open the dialog / request OTP, only to be
  403'd. `admin-staff:transfer` is **not used by the client anywhere** and **not
  enforced server-side anywhere** (the catalog declares it at
  admin-permissions.ts:104; the ADMINGate uses it/`requireAdminPermission("admin-staff:transfer")`
  server-side; only used server-side via `requireSuperAdmin`). So the UI can never
  show transfer only to those allowed; SUPER_ADMIN is the de-facto gate.

---

## A. Admin nav / sidebar permission-awareness

`admin-sidebar.tsx` (the only nav; imported by admin layout at
`app/[locale]/dashboard/admin/layout.tsx:8`):
- **Mostly blanket ADMIN-role.** `can` (from `useAdminPermissions`) is passed as the
  `className` gate **only** to the `platformItems` `NavSection` (lines 335-340).
- `NavSection` filters by `item.permission` only when a `can` fn is supplied
  (lines 73-77), and **only the Staff item declares `permission: "admin-staff:read"`**
  (line 221). Every other section — overview, financials (ledger/settlements/
  withdrawals), operations (dispatch/routes), directory (travelers/operators),
  content (posts/analytics/redirects), audit (activity/bank-access/webhooks),
  support (inquiries) — renders without any permission filter.
- Net: a low-privilege role (e.g. a SUPPORT/FINANCE/OPERATIONS member, or a custom
  grantee with only `admin-staff:read`) sees **all admin navigation**; only the
  Staff link disappears when `admin-staff:read` is absent. These nav destinations'
  server gates are either role-ADMIN-only (legit to show) or unreviewed here.

---

## D. Super-admin banner / route guard; admin layout definition

- **No super-admin-only banner / guard exists.** No `isSuperAdmin`-style global gate
  controls the admin area. The only SUPER_ADMIN distinctions in the client are
  *target-avoidance* in staff matrix (`member.role !== "SUPER_ADMIN"`,
  row lines 60, 116, 135, 155) and the invite/role-sheet SUPER_ADMIN exclusion.
- **Admin layout:** `app/[locale]/dashboard/admin/layout.tsx:12-48`.
  - Checks that a session exists (line 19) and that `session.user.role === "ADMIN"`
    (line 25 `redirect("/dashboard")`).
  - **Does NOT load the AdminStaff record, does not check status/permissions.**
    A SUSPENDED admin still passes `role === "ADMIN"` and receives the shell +
    sidebar; only var *data* queries fail (via `adminStaffProcedure`, init.ts:245).
  - The `settings` dropdown item (sidebar line 350) links to `dashboard/admin/settings`
    for every admin user regardless of permission.

---

## E. Un-gated client actions & TODO/FIXME/dead code

Un-gated (no `can()` at call sites), server gates on the fine role:
- `admin-settings-view.tsx` — every mutation (update settings, create/edit/delete
  commission tier, lines 71-232, buttons 315/347/436/444) has **no `can()` gate**.
  Server `payments.*` guards only via `adminProcedure` (role ADMIN) — see note at top
  (legit than ADMIN role; but `platform:settings:update` /
  `platform:commission:manage` catalog keys are never used server-side).
- `admin-dashboard-view.tsx` — reads `admin.getDashboardStats` /
  `admin.getRecentActivity` with no gate; server gates on role ADMIN. Legit.
- `admin-staff-filters-toolbar.tsx`, `admin-staff-activity-section.tsx` — no gate;
  see A/activity AUDIT note.

TODO/FIXME/HACK markers: **none** found under `features/admin/` (grep 0 matches).

Dead:
- **`admin-staff:transfer` catalog key** (admin-permissions.ts:104) is unused
  both client and server — transfer is implemented purely via `requireSuperAdmin`,
  so the key is dead.
- `role-sheet.tsx` `FALLBACK_ROLES` (lines 40-46) is effectively dead (always
  supplied `assignableRoles`).
- Non-staff audit-unused catalog keys (`platform:settings:*`,
  `platform:commission:manage`, `companies:create`) are unused server-side; out of
  this file's scope but noted.

---

## Residuals / hidden-hide

- **`isActive`/`status` not consumed client-side.** `use-admin-permissions.ts`
  exposes `isActive`/`status` (lines 24-25) and the view destructures only
  `can`/`roles`/`grantable`; no `SUSPENDED` gate blocks the staff page UI. Server
  blocks, but a suspended actor briefly sees a full interactive UI before the data
  queries 403.
- **Audit (activity) prefetch is un-gated:** `getActivityLog` (`audit:read` tied to
  `admin-staff:read` on the same page) is fetched even for roles that only hold
  `admin-staff:read`.
- **Transfer: UI shows an action that always 403s for non-super-admin** whose role
  grants only `admin-staff:remove` (e.g. a custom ADMIN-grant WITHOUT also being
  super-admin — the only way to hold `admin-staff:remove` is ADMIN template or a
  granted ADMIN; ADMIN template includes it). Should be gated on the actor being
  SUPER_ADMIN (server `requireSuperAdmin`), not on `admin-staff:remove`.

## Bottom line — files the fix must touch
- `components/staff/admin-staff-member-row.tsx` (transfer gate: `canDelete` → SUPER_ADMIN-only)
- `views/admin-staff-view.tsx` (transfer/un-invite/activity gates; transfer dialog gating)
- `components/staff/admin-staff-invitation-card.tsx` (resend/cancel `can`
  `admin-staff:invite`, not `remove`)
- `components/staff/admin-staff-activity-section.tsx` (+ gate `audit:read`)
- `components/admin-sidebar.tsx` (apply `can` filter to all NavSections + add
  per-item `permission` metadata, or replace with role-appropriate visibility)
- `app/[locale]/dashboard/admin/layout.tsx` (load AdminStaff + block SUSPENDED; pass
  permission context for pre-render)