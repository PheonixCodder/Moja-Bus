# Missing Features Implementation Plan: NF1–NF6

## Overview

This document outlines the complete implementation plan for adding missing IAM features to the Moja Buss operator staff permission system. The changes span three layers: schema, server-side (tRPC routers), and client-side (UI components, hooks, route guards).

---

## Decision Summary

| Feature | Decision |
|---------|----------|
| NF1: Viewer Role | **Removed** — No VIEWER role/template. Users needing read-only access get manually assigned specific `*:read` permissions. |
| NF2: Dispatcher vs Conductor | **Both server-side + UI gates**. DISPATCHER and CONDUCTOR added as **separate roles** alongside OPERATIONS (not replacing it). |
| NF3: Treasury Role | **Full migration** — FINANCE loses `withdrawals:create`, TREASURY gets it. Existing FINANCE operators needing withdrawal creation will be reassigned. |
| NF4: Missing Permission Keys | **Add all**: `revenue:export`, `terminals:geocapture`, `company:delete`, `company:profile:update`, `company:banking:update`, `company:compliance:update` |
| NF5: Granular Settings | **Full migration** — Remove `company:update`, replace with 3 granular keys. Migrate existing data, no backward compatibility. |
| NF6: MANAGER delete perms | **Keep as-is** — MANAGER already lacks `*_delete` keys. Verify UI gating works correctly. |

---

## Role Hierarchy (Post-Implementation)

```
VIEWER: (removed — manual assignment only)
SUPPORT:      level 200  → schedule:read, trips:read, bookings:read, reviews:read
FINANCE:      level 250  → routes:read, bookings:read, reviews:read, revenue:view, financials:view, withdrawals:view
TREASURY:     level 260  → routes:read, bookings:read, reviews:read, revenue:view, financials:view, withdrawals:view, withdrawals:create, revenue:export
CONDUCTOR:    level 275  → routes:read, trips:read, bookings:read, bookings:update, bookings:checkin, reviews:read
OPERATIONS:   level 300  → routes:read, terminals:read, fleet:read, schedules:read, trips:read, trips:create, trips:update, trips:cancel, bookings:read, bookings:update, bookings:cancel, reviews:read, reviews:respond
DISPATCHER:   level 350  → routes:read, terminals:read, fleet:read, schedules:read, trips:read, trips:dispatch, trips:update, trips:cancel, bookings:read
MANAGER:      level 400  → routes:read/create/update, terminals:read/create/update, fleet:read/create/update, schedules:read/create/update, trips:read/update/cancel, bookings:read/update, reviews:read/respond, staff:read, company:view
ADMIN:        level 500  → All non-OWNER keys including company:delete, revenue:export, terminals:geocapture, bookings:cancel
OWNER:        level 600  → Implicit-all at runtime
```

---

## New Permission Keys

| Key | Group | Label | Description |
|-----|-------|-------|-------------|
| `revenue:export` | Financials | Export revenue data | Export revenue CSV/reports |
| `terminals:geocapture` | Terminals | Geocapture terminal coordinates | Capture and edit terminal geospatial data |
| `company:delete` | Company | Delete company | Permanently delete the company (OWNER+ only) |
| `company:profile:update` | Company | Edit company profile | Update company profile details |
| `company:banking:update` | Company | Manage bank accounts | Add/edit/delete bank accounts |
| `company:compliance:update` | Company | Manage compliance documents | Add/delete compliance documents |
| `trips:dispatch` | Trips | Dispatch trips | Dispatch and manage trip operations (server + UI gate) |
| `bookings:checkin` | Bookings | Check in passengers | Conductor check-in actions (server + UI gate) |

---

## Files to Modify

### Schema Layer (`packages/schemas/src/permissions.ts`)

1. Add new keys to `PERMISSION_META`
2. Add `DISPATCHER`, `CONDUCTOR`, `TREASURY` to `STAFF_ROLES`
3. Update `ROLE_TEMPLATES` with new roles and updated FINANCE/ADMIN templates
4. Remove `company:update` from `PERMISSION_META`
5. Update `ROLE_LEVELS` with new levels
6. Update `ASSIGNABLE_ROLES` for all affected roles
7. Update `ROLE_LABELS` and `ROLE_COLORS` in `apps/web/features/operator/lib/staff.ts`

### Database Layer (`packages/db/prisma/schema.prisma`)

1. Add `DISPATCHER`, `CONDUCTOR`, `TREASURY` to `enum StaffRole`
2. Create migration file with data migration:
   ```sql
   -- Migrate existing 'company:update' permissions to granular keys
   UPDATE "operator" 
   SET permissions = array_cat(
     permissions - 'company:update',
     ARRAY['company:profile:update', 'company:banking:update', 'company:compliance:update']
   )
   WHERE 'company:update' = ANY(permissions);
   ```

### Server Layer (tRPC Routers)

1. `apps/web/trpc/routers/operator/settings.ts`:
   - `updateCompany` → `requirePermission(ctx, "company:profile:update")`
   - `updateBankAccount` → `requirePermission(ctx, "company:banking:update")`
   - `addBankAccount` → `requirePermission(ctx, "company:banking:update")`
   - `addDocument` → `requirePermission(ctx, "company:compliance:update")`
   - `deleteDocument` → `requirePermission(ctx, "company:compliance:update")`
   - `deleteBankAccount` → keep `requireOwner(ctx)`

2. `apps/web/trpc/routers/operator.ts`:
   - `exportBookingsCsv` → `requirePermission(ctx, "revenue:export")`
   - `getWithdrawalControls` → already has `withdrawals:view` (from L10)

3. `apps/web/trpc/routers/schedules.ts`:
   - Add `requirePermission(ctx, "trips:dispatch")` to `updateBasic`, `updateCalendar`, `reconcileFutureTrips`

4. `apps/web/trpc/routers/payments.ts`:
   - Ensure `cancelBooking` OPERATOR path has `requirePermission(ctx, "bookings:cancel")`

### Client Layer

1. `apps/web/features/operator/components/route-guard.tsx` — no changes (new roles inherit read perms)
2. `apps/web/features/operator/lib/staff.ts` — add `ROLE_LABELS`, `ROLE_COLORS` for new roles
3. `apps/web/features/operator/components/staff/invite-sheet.tsx` — add new roles to `INVITABLE_ROLES`
4. `apps/web/features/operator/components/staff/role-sheet.tsx` — add new roles to `FALLBACK_ROLES`
5. `apps/web/features/operator/components/operator-quick-actions.tsx` — gate dispatch on `can("trips:dispatch")`
5. `apps/web/features/operator/components/revenue/revenue-header.tsx` — change to `can("revenue:export")`
6. `apps/web/features/operator/views/operator-terminals-view.tsx` — gate geocapture on `can("terminals:geocapture")`
7. `apps/web/features/operator/settings/components/settings-sidebar.tsx` — granular permission gating
8. `apps/web/features/operator/settings/components/views/*` — view/edit mode switching

### Test Files (New)

1. `packages/schemas/src/__tests__/roles-and-permissions.test.ts`
2. `apps/web/lib/__tests__/permissions/authorize.test.ts`
3. `apps/web/features/operator/lib/__tests__/staff-hierarchy.test.ts`

---

## Execution Phases

### Phase 1: New Permission Keys (NF4 sub-keys + granular settings keys)
- Add 6 new keys to `PERMISSION_META`
- Gate endpoints and UI for `revenue:export`, `terminals:geocapture`, `company:delete`
- Add `company:profile:update`, `company:banking:update`, `company:compliance:update`
- Tests + typecheck

### Phase 2: New Roles (TREASURY, DISPATCHER, CONDUCTOR)
- Add roles to schema, Prisma enum, templates, labels, colors
- Update `ASSIGNABLE_ROLES`, `ROLE_LEVELS`
- Server-side + UI gates for `trips:dispatch`, `bookings:checkin`
- Migration script for `company:update` → granular keys
- Tests + typecheck

### Phase 3: NF4 key applications + NF6 verification
- Apply `revenue:export`, `terminals:geocapture` gates
- Ensure MANAGER has no `*_delete` keys
- Full test suite

---

## Migration Checklist

- [ ] Add new permission keys to `PERMISSION_META`
- [ ] Add `DISPATCHER`, `CONDUCTOR`, `TREASURY` to `STAFF_ROLES`
- [ ] Update `ROLE_TEMPLATES` for all roles
- [ ] Remove `company:update` from `PERMISSION_META`
- [ ] Update `ROLE_LEVELS` and `ASSIGNABLE_ROLES`
- [ ] Add roles to Prisma `enum StaffRole`
- [ ] Create Prisma migration with data migration
- [ ] Update `ROLE_LABELS` and `ROLE_COLORS` in `staff.ts`
- [ ] Update `INVITABLE_ROLES` in `invite-sheet.tsx`
- [ ] Update `FALLBACK_ROLES` in `role-sheet.tsx`
- [ ] Update tRPC router permission gates
- [ ] Update UI components (quick actions, revenue header, terminals view, settings sidebar, settings views)
- [ ] Write tests for permissions, authorize, staff hierarchy
- [ ] Run `pnpm typecheck` and `pnpm test`

---

## Breaking Changes

1. **`company:update` removed** — Existing operators with this permission will be migrated to 3 granular keys via SQL migration.
2. **FINANCE loses `withdrawals:create`** — Existing FINANCE operators needing withdrawal creation must be reassigned to TREASURY (manual or scripted).
3. **New permission keys required** — UI components using old keys will need updates.
4. **No backward compatibility** — The old `company:update` key is completely removed.