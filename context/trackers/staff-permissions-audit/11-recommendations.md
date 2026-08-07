# 11 — Recommendations (Prioritized Remediation)

Enterprise patterns, ranked by impact/effort. Each item maps to findings in `10-consolidated-findings.md`.

---

## P0 — Fix critical server-side gaps (money & compliance integrity)

1. **Gate `saveOnboardingStep`** (C1): add `requireAnyPermission(["company:update", "staff:update"])` — or better, split it: `updateCompanyBasic` (`company:update`) and `saveBankInfo` (`withdrawals:create` or OWNER-only). Never allow re-registering the Paystack recipient under a generic key.
2. **Gate `completeOnboarding` / `resubmitVerification`** (C2): `requirePermission("company:update")` (ADMIN+ only). Verification state changes should be OWNER-only + rate-limited.
3. **Add `requirePermission("bookings:update")` to `payments.cancelBooking`** (H2) and assert the booking belongs to `ctx.companyId`.
4. **`getHoldPricing` ownership assertion** (M20): return 404 or FORBIDDEN unless `hold.operatorId === ctx.operator.id` / company scoped.

## P1 — Route-level access control + friendly denial

5. **Introduce per-route permission map in the operator layout** (H4): define `routePermissions: Record<string, PermissionKey[]>` and render an `AccessDenied` state instead of the raw error boundary when the route's keys aren't held. Keeps routing logic in one place; pages stay dumb.
6. **Make the shared `error.tsx` permission-aware** (P1): detect `FORBIDDEN`/`TRPCClientError` with code `FORBIDDEN` → render `AccessDenied` (finally wire up the dead `AccessDeniedCard` — L1) instead of raw message.
7. **Fix Overview crash for read-only roles** (H3): make the dashboard default route check `anyPermission`; fall back to first accessible section or an empty-state.

## P2 — Role model corrections (schema + templates)

8. **Add a read-only VIEWER role** (NF1): `trips:read`, `bookings:read`, `revenue:view`, `fleet:read`, `schedules:read`, `routes:read`, `terminals:read`, `reviews:read`. Helps: auditors, investors, HQ observers.
9. **Add `bookings:cancel`** key and gate refund/cancel paths on it (M1); remove it from SUPPORT/OPERATIONS templates if refunds must stay a money action.
10. **Require `trips:cancel` on schedule mutations that cancel trips** (M2): `addException(CANCELLED)`, `updateCalendar`, `reconcileFutureTrips` currently need only `schedules:update` even though the key exists and is enforced in `trips.ts`. Keep `trips:cancel` out of the SUPPORT/OPERATIONS templates if cancellation-with-refund is a money action.
11. **Add `withdrawals:create` to FINANCE** (M19) or add a TREASURY role = FINANCE + `withdrawals:create`, OWNER-only payout approval via 2FA.
12. **Give MANAGER a `*:delete` key** (NF6) or hide delete buttons — stop showing DELETE UI to roles that can't delete.
13. **Remove dead `trips:create`** from templates or wire it to ad-hoc trip creation (L8). Add `revenue:export` and gate the export button (L2).
14. **Split settings into granular keys** (NF5): `company:view/update` keep; add `payouts:manage` (bank CRUD + Paystack recipient) OWNER-only, `personal:update` (self-service — fixes M6), keep `company:update` for compliance doc edits.

## P3 — Client-side gating everywhere (consistency layer)

15. **Fix `financials:view`** (H1): use a real key — either rename tab gate to `company:view` or introduce `financials:view` in `PERMISSION_META` + all templates and use it server-side too.
16. **Apply `can()` to the 6 ungated views** (M3): Fleet, Routes, Terminals, Revenue, Withdraw, Dashboard — wrap create/edit/delete buttons and empty-state CTAs.
17. **Gate manifest drawer bulk actions** (M12) and **header quick actions** (M13) on their creating permissions.
18. **Gate footer Settings** (M14) on `company:view`; gate settings forms/upload/delete on their keys (M5/M15).
19. **Fix the staff page**: use `can("staff:update")` + the hierarchy result to show/hide edit actions (M7); gate invite/resend/cancel (M11), suspend (M7), remove (L4), and deep-link `?member=` on `can("staff:update")` + `canModify` (M9).
20. **Fix role-select fallback** (M10): default invites to `OPERATIONS`; restrict options to `ASSIGNABLE_ROLES[role]`.
21. **Routes/Terminals cross-read dependency** (M8): loosen page prefetch to `anyPermission(["routes:read","terminals:read"])` or render partial state.

## P4 — Operations hardening

22. **Force session revocation on suspend/remove** (M18): after `updateStatus(INACTIVE)` / `removeStaff`, revoke the user's sessions via Better Auth so the block is immediate, not next-request.
23. **Gate compliance document download on `company:view`** (M16) server-side.
24. **Verify CancellationService company-scoping** (H2) and add explicit company assertions to all `payments.*` mutations.
25. **Remove or key `getWithdrawalControls`** (L10); require `withdrawals:view`.
26. **Fleet `canManageFleet` include `delete`** (L11); fix `getPermissions` contract.

## P5 — Cleanup (low effort, reduces drift)

27. Delete or wire `AccessDeniedCard` (L1), dead revenue export (L2), dead `getPermissionCatalog` + bank procedures with no callers (L9), legacy settings hub/tabs/drawers (SE7).
28. Make `resetPermissions` checkbox honest (L3) — either honored with a warning or removed.
29. Add `loading.tsx` to the operator tree (L13).
30. Update AGENTS/context: record decided role taxonomy in `context/ui-registry.md` and `context/progress-tracker.md`.

---

## Suggested execution order

1. P0 (server integrity) — 4 items, small diff, biggest blast radius.
2. P1 (route guards) — one layout + one error.tsx.
3. P2 (schema/templates) — coordinated with the DB snapshot migration for `Operator.permissions`.
4. P3 (client gating) — mechanical, do per-view.
5. P4/P5 — hardening & cleanup.

> Reminder: `Operator.permissions` in Postgres is the source of truth; any new key must also ship with the templates + a data migration for existing rows that fall back to `ROLE_TEMPLATES[role]` where the array lacks the new key.

## Audit complete.

Files: `01-iam-architecture` · `02-permission-catalog` · `03-role-template-analysis` · `04-router-guard-audit` · `05-page-route-audit` · `06-action-gating-audit` · `07-staff-management-audit` · `08-settings-audit` · `09-flows` · `10-consolidated-findings` · `11-recommendations` — in `context/trackers/staff-permissions-audit/`.
