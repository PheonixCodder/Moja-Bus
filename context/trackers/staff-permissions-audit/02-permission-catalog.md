# 02 — Permission Catalog & Role Templates

Source of truth: `packages/schemas/src/permissions.ts`.

---

## 1. The 31 permission keys (catalog)

| Group | Key | Label |
|---|---|---|
| Routes | `routes:read` | View routes |
| Routes | `routes:create` | Create routes |
| Routes | `routes:update` | Edit routes |
| Routes | `routes:delete` | Delete routes |
| Terminals | `terminals:read` | View terminals |
| Terminals | `terminals:create` | Create terminals |
| Terminals | `terminals:update` | Edit terminals |
| Terminals | `terminals:delete` | Delete terminals |
| Fleet | `fleet:read` | View buses & layouts |
| Fleet | `fleet:create` | Add buses & layouts |
| Fleet | `fleet:update` | Edit buses & layouts |
| Fleet | `fleet:delete` | Delete buses & layouts |
| Schedules | `schedules:read` | View schedules |
| Schedules | `schedules:create` | Create schedules |
| Schedules | `schedules:update` | Edit schedules |
| Schedules | `schedules:delete` | Delete schedules |
| Trips | `trips:read` | View trips |
| Trips | `trips:create` | Create trips |
| Trips | `trips:update` | Edit / dispatch trips |
| Trips | `trips:cancel` | Cancel trips |
| Bookings | `bookings:read` | View bookings |
| Bookings | `bookings:update` | Modify / check-in bookings |
| Financials | `revenue:view` | View revenue |
| Financials | `withdrawals:view` | View withdrawals |
| Financials | `withdrawals:create` | Request withdrawals |
| Staff | `staff:read` | View staff |
| Staff | `staff:invite` | Invite staff |
| Staff | `staff:update` | Update staff roles & permissions |
| Staff | `staff:remove` | Remove staff |
| Company | `company:view` | View company settings |
| Company | `company:update` | Edit company settings |
| Reviews | `reviews:read` | View passenger reviews |
| Reviews | `reviews:respond` | Respond to reviews |

Notes on catalog shape:
- **No `bookings:create`** — bookings are passenger-created; operators only read/check-in/cancel.
- **No `bookings:cancel`** — cancels ride on `bookings:update` (see findings).
- **No `trips:delete`** — trips are cancelled (`trips:cancel`), never deleted.
- **No `schedules:cancel`** — schedule cancellation is a "retire" under `schedules:update`.
- **No `terminals:geocapture`** — geo-capture (mint/approve/reject capture links) rides on `terminals:update`.
- **No `company:delete`, `company:create`** — company is created at signup; not editable/deletable by staff.
- **No `revenue:export`** — exports ride on `revenue:view`.
- **No `financials:view`** — this key is used by the settings sidebar but does **not** exist (findings file 08).

---

## 2. Role templates (`ROLE_TEMPLATES`)

Legend: ✅ = included, ❌ = not included.

| Key | OWNER | ADMIN | MANAGER | OPERATIONS | FINANCE | SUPPORT |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| routes:read | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| routes:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| routes:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| routes:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| terminals:read | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| terminals:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| terminals:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| terminals:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| fleet:read | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| fleet:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| fleet:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| fleet:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| schedules:read | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| schedules:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| schedules:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| schedules:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| trips:read | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| trips:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| trips:update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| trips:cancel | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| bookings:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| bookings:update | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| revenue:view | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| withdrawals:view | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| withdrawals:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| staff:read | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| staff:invite | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| staff:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| staff:remove | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| company:view | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| company:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| reviews:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| reviews:respond | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

**OWNER** template is stored as `[]` but `getTemplatePermissions("OWNER")` returns **all 31 keys** (implicit-all at runtime).

---

## 3. Assignable roles & hierarchy

```ts
ASSIGNABLE_ROLES = {
  OWNER:    [ADMIN, MANAGER, OPERATIONS, FINANCE, SUPPORT],
  ADMIN:    [MANAGER, OPERATIONS, FINANCE, SUPPORT],
  MANAGER:  [OPERATIONS, SUPPORT],
  OPERATIONS: [], FINANCE: [], SUPPORT: [],
};
ROLE_LEVELS = { OWNER: 600, ADMIN: 500, MANAGER: 400, OPERATIONS: 300, FINANCE: 250, SUPPORT: 200 };
```

---

## 4. The templates vs. what the UI expects (quick gap list)

This is the executive view; details + reasoning in [`03-role-template-analysis.md`](./03-role-template-analysis.md):

1. **`trips:create` is dead in the templates** — ADMIN/MANAGER/OPERATIONS all have it, but trips are generated from schedules; `trips.create` is only used for one-off trip creation (still shipped).
2. **FINANCE is view-only on payouts** — has `withdrawals:view` but **not** `withdrawals:create`; also lacks `revenue:export`-style (none needed, rides on view).
3. **MANAGER has no staff:invite** — can view staff but not invite; only ADMIN/OWNER invite.
4. **MANAGER cannot delete anything** (`routes:delete`, `terminals:delete`, `fleet:delete`, `schedules:delete` all ❌) while able to create/edit — asymmetric.
5. **SUPPORT can cancel refundable bookings** (`bookings:update`) and check in passengers, but has no `trips:cancel`; schedule-driven cancellations are out of reach (no `schedules:*` create/update).
6. **OPERATIONS can check in and cancel bookings** (via `bookings:update`) in addition to dispatch.
7. **No role has `revenue:view` + `withdrawals:create` together** — the FINANCE officer who reconciles revenue cannot initiate the payout, and no one but OWNER/ADMIN can.
8. **No read-only tier** — the lowest role (SUPPORT) already includes mutating keys (`bookings:update`, `reviews:respond`). There is no pure viewer role, which is a big reason view-only staff see edit controls everywhere.

Continue to [`03-role-template-analysis.md`](./03-role-template-analysis.md).
