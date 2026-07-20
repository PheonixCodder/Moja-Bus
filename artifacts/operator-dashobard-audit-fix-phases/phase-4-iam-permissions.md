# Phase 4 — IAM & Permissions

**Priority:** P1 — GA Gate  
**Issues:** H9, H10, H11, H14, H16, H21, H23  
**Rationale:** These issues allow staff with demoted roles to retain elevated privileges, expose sensitive data to roles that shouldn't see it, and leave the cron endpoints unauthenticated in staging/preview environments. They must be fixed before GA to prevent both security incidents and operational confusion.

---

## H9 — Staff role demotion keeps elevated permissions[]

### What Is Wrong
`trpc/routers/staff.ts → updateRole` changes the staff member's `role` field (e.g., `ADMIN → SUPPORT`) but does **not** reset the `permissions[]` array. Permissions were granted when the staff member was an ADMIN, and they persist after demotion. A demoted SUPPORT user retains `trips:cancel`, `withdrawals:create`, and other high-privilege permissions they should no longer have.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `packages/schemas/src/permissions.ts` | Defines `ROLE_TEMPLATES` with default permissions per role. After demotion, the staff member's effective permissions are their custom `permissions[]`, not the template. |
| `lib/permissions/` | `useStaffPermissions` hook reads the `permissions[]` array from the session. Demoted staff still pass permission checks for elevated actions. |
| `operator-staff-view.tsx` | Role badge shows `SUPPORT` but the user can perform ADMIN actions. Confusing for the company owner. |
| `operator-withdraw-view.tsx` | Demoted SUPPORT staff can still request withdrawals if they retained `withdrawals:create`. |
| `trpc/routers/trips.ts → cancel` | Demoted SUPPORT staff can cancel trips with full refunds if they retained `trips:cancel`. |
| `trpc/routers/staff.ts → removeStaff` | Removing a staff member doesn't clear their permissions either — but this is less critical since they lose access entirely. |

### How to Fix the Issue
1. In `staff.ts → updateRole`: after updating the role, reset `permissions` to the new role's template:
   ```ts
   const newTemplate = ROLE_TEMPLATES[newRole] ?? [];
   await ctx.prisma.staffMember.update({
     where: { id: staffId },
     data: { role: newRole, permissions: newTemplate },
   });
   ```
2. Add a `resetPermissions` option (default `true`) for cases where a company owner intentionally wants to keep custom permissions after a role change.
3. Log the role change and permissions reset in `ActivityLog`.

### How to Fix Each Side Effect
- **operator-staff-view.tsx:** After `updateRole`, invalidate the staff list query. The permission badges will reflect the new template.
- **All permission-gated procedures:** No procedure-level change needed — the fix is in the data layer. Procedures already read `staffMember.permissions` from the DB.
- **Session:** If the demoted staff member has an active session, they will see their new permissions on the next page load (TanStack Query refetch). Consider also invalidating the `getMyPermissions` query from the staff management page after a role update.

---

## H10 — ADMIN template missing withdrawals:create

### What Is Wrong
`packages/schemas/src/permissions.ts → ROLE_TEMPLATES.ADMIN` does not include `withdrawals:create`. This means company admins (not owners) cannot request withdrawals by default — they must receive a custom permission grant. This is an undocumented policy decision that creates confusion.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-withdraw-view.tsx` | "Request Withdrawal" button is hidden for ADMIN staff (permission check fails). Admins are confused — they expect this to be part of their role. |
| `trpc/routers/operator.ts → requestWithdrawal` | Returns `FORBIDDEN` for ADMIN staff. Error message is generic. |
| `operator-staff-view.tsx` | Company owners manually granting `withdrawals:create` to each admin creates management overhead. |
| `packages/schemas/src/permissions.ts` | `ROLE_TEMPLATES` is the authoritative source for role capabilities. If ADMIN is missing this permission, it's a misconfiguration. |

### How to Fix the Issue
**Option A (Recommended):** Add `withdrawals:create` to `ROLE_TEMPLATES.ADMIN`. ADMIN is intended to be a full company manager, and withdrawal approval is a core management function.

**Option B:** Keep ADMIN without `withdrawals:create` but add explicit documentation stating withdrawal initiation is OWNER-only. Update the UI to show "Only the company owner can request withdrawals" when an ADMIN clicks the button.

**Decision needed from product/owner:** Whether ADMIN staff should be able to initiate withdrawals. This is a product policy, not just a bug.

### How to Fix Each Side Effect
- **Withdraw view:** If Option A: button appears for ADMIN (permission check passes). If Option B: show a locked state with explanation.
- **staff.ts updateRole:** If Option A: existing ADMIN staff will not automatically get the new permission (it only applies to new template-reset operations). Run a one-time migration to update all existing ADMIN staff `permissions[]` to add `withdrawals:create`.

---

## H11 — Fleet page unconditional prefetch crashes non-fleet:read roles

### What Is Wrong
`apps/web/app/dashboard/operator/(dashboard)/fleet/page.tsx` prefetches all fleet-related data (buses, layouts, permissions) unconditionally. A SUPPORT staff member who navigates to `/dashboard/operator/fleet` via URL receives a `FORBIDDEN` error from the tRPC query, causing the page to crash with an unhandled error boundary.

This is the same class of bug that was fixed for the trips/schedules pages — fleet needs the same treatment.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-fleet-view.tsx` | Suspense boundary catches the FORBIDDEN error and shows an error state. But the error state may be a generic "Something went wrong" rather than a permission-aware empty state. |
| `fleet/page.tsx` | Server-side prefetch call throws, potentially causing a 500 response. |
| `apps/web/app/dashboard/operator/(dashboard)/layout.tsx` | Layout loads shell permissions. SUPPORT may not have `fleet:read` in their permissions array — the layout should gate the fleet nav item, but direct URL access bypasses nav gating. |
| `operator-schedules-view.tsx` | The schedules view has a lazy fleet query (conditional on permission). Fleet view needs the same pattern. |

### How to Fix the Issue
1. In `fleet/page.tsx`: gate the `prefetchQuery` calls behind a permission check:
   ```ts
   const permissions = await getServerSidePermissions(ctx);
   if (permissions.includes("fleet:read")) {
     await prefetchQuery(trpc.fleet.getBuses, ...);
   }
   ```
2. In `operator-fleet-view.tsx`: render a permission-aware empty state when `fleet:read` is not present:
   ```tsx
   if (!can("fleet:read")) return <PermissionDenied resource="Fleet Management" />;
   ```
3. Use the `useStaffPermissions` hook (already used on trips/schedules) to conditionally enable/disable the fleet queries.

### How to Fix Each Side Effect
- **Layout nav:** Add `fleet:read` check to the fleet nav item — already should be gated, but confirm.
- **Direct URL access:** The server-side permission gate in `page.tsx` handles this.
- **Error boundary:** Once the permission-aware empty state is in place, the error boundary is not needed for this case.

---

## H14 — Terminals cities require routes:read

### What Is Wrong
`operator-terminals-view.tsx` city picker calls `trpc.routes.getCities` to populate the city dropdown when creating/editing a terminal. The `routes.getCities` procedure requires `routes:read` permission. Staff with `terminals:read` but without `routes:read` (e.g., a terminal manager role) cannot add or edit terminals because the city picker fails.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-terminals-view.tsx` | City picker shows empty or throws an error for staff without `routes:read`. |
| `trpc/routers/routes.ts → getCities` | Returns a list of cities from the `City` model. This is a public/shared geographic catalog — no route-specific data. It should not require `routes:read`. |
| `trpc/routers/locations.ts` | There may be a separate `locations.ts` router with a `getCities` procedure not gated by routes permission. Check if this exists and is suitable. |
| SUPPORT staff | SUPPORT typically has `terminals:read/write` but not `routes:read`. They are locked out of terminal city selection. |

### How to Fix the Issue
**Option A (Recommended):** Move `getCities` to `trpc/routers/locations.ts` with no permission gate (cities are public catalog data). Update `operator-terminals-view.tsx` to call `trpc.locations.getCities` instead.

**Option B:** Add `cities:read` as a separate permission and include it in all role templates that need geographic data. Higher overhead.

**Option C:** Allow `getCities` to be called with `terminals:read` in addition to `routes:read` (dual permission gate using OR logic).

### How to Fix Each Side Effect
- **operator-terminals-view.tsx:** Update the query key after moving to `locations.getCities`.
- **routes.ts:** If `getCities` is moved out, remove it from routes and update all other callers (check `operator-routes-view.tsx` which likely also calls it).
- **TanStack Query cache:** Invalidations that previously used `trpc.routes.getCities` must be updated to use the new procedure path.

---

## H16 — Cron auth only in production NODE_ENV

### What Is Wrong
In `release-escrow/route.ts` and other cron routes, the `assertCronAuth` function only enforces the `CRON_SECRET` Bearer check when `process.env.NODE_ENV === "production"`. In Vercel preview deployments (`NODE_ENV = "production"` but `CRON_SECRET` may not be set), and in staging environments (`NODE_ENV = "development"`), the cron endpoints are unauthenticated — anyone who knows the URL can trigger them.

**Reading the current `release-escrow/route.ts` code (lines 11–28):** The current implementation actually checks `if (secret)` (whenever CRON_SECRET is configured) and also blocks if `NODE_ENV === "production"` but no secret is set. **This is an improvement over the original audit finding.** However, the other cron routes (`generate-trips`, `reconcile-payments`) may not have been updated.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `apps/web/app/api/cron/generate-trips/route.ts` | May be unauthenticated in preview/staging. Anyone can trigger trip generation — spamming the endpoint could create thousands of trips. |
| `apps/web/app/api/cron/reconcile-payments/route.ts` | May be unauthenticated. Triggering reconciliation prematurely can double-confirm payments or cause race conditions. |
| `apps/web/app/api/cron/release-reservations/route.ts` | May be unauthenticated. Triggering hold expiry early can destroy passenger booking sessions. |
| `apps/web/app/api/cron/snapshot-accounts/route.ts` | Unauthenticated snapshot trigger can cause out-of-order snapshots that corrupt analytics. |

### How to Fix the Issue
1. Extract `assertCronAuth` into `lib/cron-auth.ts` (appears to already exist based on the file listing) as a shared utility.
2. Apply the same fail-closed logic to **all** cron routes: require `CRON_SECRET` in all deployed environments, fail with 500 if secret is not configured in a non-local environment.
3. Set `CRON_SECRET` in all Vercel environments (production AND preview) via the Vercel dashboard environment variables.

### How to Fix Each Side Effect
- Each affected cron route: add `const denied = assertCronAuth(request); if (denied) return denied;` at the top.
- `lib/cron-auth.ts`: Verify the exported function is the same as the one in `release-escrow`. Standardize all crons to import from it.

---

## H21 — Invitation returns raw inviteUrl to client

### What Is Wrong
`trpc/routers/staff.ts → createInvitation` returns the `inviteUrl` (containing the invitation token) in the API response. In production, this URL should only be delivered via email. Returning it in the API response exposes it:
- In browser DevTools network tab (visible to anyone with access to the developer's machine).
- In server logs (if tRPC responses are logged).
- In analytics/error tracking tools (Sentry, Datadog) that capture API responses.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-staff-view.tsx` | Invitation dialog may display the URL for "copy link" functionality — enabling token leakage via screen sharing. |
| Server logs | If tRPC procedure outputs are logged, the token is in plaintext in log aggregators. |
| `packages/auth` | The invitation token is used to verify the invite. If leaked, anyone can join as the invited staff member. |
| Sentry / error tracking | If the response is captured by error tracking middleware, the token is stored in a third-party system. |

### How to Fix the Issue
1. In `staff.ts → createInvitation`: remove `inviteUrl` from the returned object in all environments (not just production).
2. The invitation email (sent via Novu) already contains the link — the URL does not need to be in the API response.
3. Return only: `{ success: true, invitedEmail: email, expiresAt: invitation.expiresAt }`.
4. In `operator-staff-view.tsx`: remove any "copy invite link" button that relies on the API response URL. If a copy-link feature is desired, generate it client-side from the known invite route pattern (not from the API response).

### How to Fix Each Side Effect
- **operator-staff-view.tsx:** Replace "Copy invite link" with "Resend invitation email" if that feature is needed.
- **Server logs:** After the fix, do a log audit to find and redact any previously logged invite URLs.

---

## H23 — Terminal deactivate does not protect linked routes

### What Is Wrong
`trpc/routers/terminals.ts → update` allows setting `isActive: false` or `isTerminal: false` on a terminal that is currently used as an origin, destination, or waypoint on active routes. Once deactivated, the route becomes broken:
- Search cannot resolve the terminal to a city, showing "Unknown" as origin/destination.
- Trip generators create stops for a deactivated terminal — passengers arrive at a terminal that is listed as inactive.
- Route validation in `routes.ts → createRoute` requires `isActive: true` on terminals — but existing routes are not re-validated when a terminal is deactivated.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `trpc/routers/routes.ts` | Existing routes referencing the deactivated terminal are not invalidated. |
| `trip-generator.ts` | Continues creating `TripStop` rows for the deactivated terminal. |
| `trpc/routers/search.ts` | Terminal name/city lookup returns stale data or errors if the deactivated terminal has incomplete data. |
| `operator-routes-view.tsx` | Route still shows as active with the deactivated terminal. No warning. |
| `operator-terminals-view.tsx` | Terminal is deactivated and shows as inactive, but no warning about linked routes. |
| Passenger-facing pages | Booking shows pickup at a "closed" terminal. |

### How to Fix the Issue
1. In `terminals.ts → update`: before deactivating or setting `isTerminal: false`, check for linked routes:
   ```ts
   const linkedRoutes = await ctx.prisma.route.count({
     where: {
       OR: [
         { originTerminalId: terminalId },
         { destTerminalId: terminalId },
         { waypoints: { some: { terminalId } } },
       ],
       companyId: ctx.companyId,
     },
   });
   if (linkedRoutes > 0) {
     throw new TRPCError({
       code: "BAD_REQUEST",
       message: `Cannot deactivate terminal — it is used on ${linkedRoutes} route(s). Remove it from all routes first.`
     });
   }
   ```
2. Apply the same guard to `terminals.ts → delete` (the audit notes this is already present for delete — confirm).

### How to Fix Each Side Effect
- **operator-terminals-view.tsx:** Show the linked route count in the deactivation confirmation dialog: "This terminal is used on 3 routes. Please remove it from all routes before deactivating."
- **operator-routes-view.tsx:** No change needed if deactivation is blocked upstream.
- **Trip generator / search:** Protected automatically if deactivation is blocked.
