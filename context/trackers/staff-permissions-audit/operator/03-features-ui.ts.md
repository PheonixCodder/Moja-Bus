# Operator Dashboard — Client-Side (UI) Gating Audit

**Date:** 2026-08-07
**Scope:** Every operator client action (buttons, links, dialogs, prefetch, tab visibility) vs the server permission required by the matching tRPC mutation/query. Ground truth: `packages/schemas/src/permissions.ts` (40 catalog keys).

**Method notes**
- `can(key)` = `useStaffPermissions().can(key)`; returns `true` for `OWNER` or if key ∈ stored `permissions`.
- Only ONE hook file exists: `apps/web/features/operator/hooks/use-staff-permissions.ts` (no fork/duplicate found). It reads `trpc.staff.getMyPermissions`, defaults role to `SUPPORT` and permissions to `[]` while loading — safe (fail-closed).
- Server gates read from `apps/web/trpc/routers/{operator,trips,schedules,routes,terminals,fleet,staff,operator/settings}.ts` via `requirePermission(ctx, key)` / `requireAnyPermission` / `requireOwner`.

---

## A. Ground-truth server gates used by operator actions

| gate | definition of source (operator.ts unless noted) |
|------|---------|
| `trips:read` | trips.list/statusCounts/get/getManifest/getSeatMap |
| `trips:create` | trips.create |
| `trips:update` | trip assignBus, delay, updateStatus, updateNotes, setGate, toggleSingleTripSeatStatus |
| `trips:cancel` | trips.cancel |
| `trips:dispatch` | (schedules) dispatch/regenerate triage (schedules.ts 750/892/997/1305/1466 require schedules:update OR trips:cancel OR trips:dispatch) |
| `bookings:read` | operator.listBookings, getBooking |
| `bookings:update` | operator.checkInBooking, bulkCheckInBookings, cancelBooking, bulkCancelBookings |
| `bookings:cancel` | operator.cancel/bulkCancel gate ONLY on `bookings:update`; payments.cancelBooking (payments.ts:110-118) requires `bookings:update` AND `bookings:cancel` — inconsistent across routers |
| `schedules:read/create/update/delete` | schedules.ts (483 create, 669/1046/1091/1160/1223 update, 702 delete) |
| `fleet:read/create/update/delete` | fleet.ts (123 create, 234 update, 297 delete, …) |
| `terminals:read/create/update/delete` | terminals.ts; `terminals:geocapture` = captures.ts approve/reject |
| `routes:read/create/update/delete` | routes.ts |
| `revenue:view` | operator.getRevenueAnalytics, getAccountSnapshot, withdraw code? etc. |
| `revenue:export` | operator.exportBookingsCsv |
| `withdrawals:view` | operator.listWithdrawals, getWithdrawalControls |
| `withdrawals:create` | operator.requestWithdrawal, requestWithdrawalChallenge |
| `staff:read` | staff.listStaff/listInvitations/getActivityLog |
| `staff:invite` | staff.createInvitation/resendInvitation |
| `staff:update` | staff.updateRole/updatePermissions/updateStatus |
| `staff:remove` | staff.removeStaff |
| `company:view` | settings.getSettings (read) |
| `company:profile:update` | operator not there: operator.ts updateCompany / operatorRouter |
| `company:banking:update` | operator settings add/update/delete bank account |
| `company:compliance:update` | operator settings add/delete document |
| `company:delete` | settings delete company (requires owner) |
| `reviews:read` | operator.listReviews |
| `reviews:respond` | operator.respondToReview |
| dashboard | operator.getDashboardMetrics = `requireAnyPermission(["trips:read","bookings:read","company:view"])`; getShellContext intentionally un-gated (sidebar shell) |

---

## MATRIX (area | view/component | action | client gate | server gate | match?)

### A. Operator dashboard / shared

| area | view/component | action | client gate | server gate | match |
|---|---|---|---|---|---|
| Dashboard | `operator-dashboard-view.tsx` | Open **Scan Check-In** (ticket-scanner) | **NONE** | checkInBooking = `bookings:update` | **NO — leaks** (any role that can load dashboard sees a check-in control it can't use) |
| Dashboard | `operator-dashboard-view.tsx` | "Manage Schedules" empty-state link (→ /schedules) | **NONE** | schedules page = `schedules:read` | **NO — leaks** nav link |
| Dashboard | `operator-dashboard-view.tsx` | "New Route" link (→ /routes) | **NONE** | routes page `routes:read`; create needs `routes:create` | **NO — leaks** (mislabeled "New" but is read nav) |
| Dashboard | `operator-dashboard-view.tsx` | "Manage Fleet" link (→ /fleet) | **NONE** | fleet page `fleet:read` | **NO — leaks** |
| Dashboard | `operator-dashboard-view.tsx` | per-card "Go to Dispatch" (→ /trips) | **NONE** | trips page `trips:read` | **NO — leaks** |
| Dashboard | `operator-dashboard-view.tsx` | Revenue KPI card + Live Activity stream | **NONE** | getDashboardMetrics = any-read | revenue figure shown to users without `revenue:view` | **NO — leaks** metric |
| Dashboard | `operator-dashboard-header.tsx` / header | (registration) | — | — | (header, not a mutation) |
| Dashboard | `operator-quick-actions.tsx` | New Term/Route/Schedule/Add Vehicle/Dispatch | `can` exact per action | matches page mutation | **YES** — well-gated |
| Nav | `operator-sidebar.tsx` | per-tab visibility | `can` any-of per item | matches router gates | **YES** (see A-answer) |
| Nav | `operator-sidebar.tsx` | Dropdown "Settings" | `can("company:view")` | matches | **YES** |
| Search | `operator-search-dialog.tsx` | `globalSearch` results (bookings/trips/staff) | **NONE** | server per-row gated | section=empty on server, but full **Quick Navigation** list has NO permission filter → anyone sees Staff/Revenue/Withdraw/Terminals/Schedules links | **NO — leaks nav via palette** |
| Global | `ticket-scanner.tsx` | none (UI only; parent gates) | n/a | — | ok (parent must gate) |

### B. Trips / dispatch

| view/component | action | client gate | server gate | match |
|---|---|---|---|---|
| `operator-trips-view.tsx` | manifest open | `can("trips:read")`-page (route-guard `trips:read`) | getManifest `trips:read` | YES |
| `trips-toolbar.tsx` | none (filters) | — | — | ok |
| `trip-card.tsx` | pass bus assign etc | `canUpdate && canReadFleet` passed down | assignBus `trips:update` | YES (correctly requires fleet:read too for the bus list) |
| `manifest-drawer.tsx` -> assign bus / set-gate / notes / status (BOARD/DEPART/ARRIVE/DELAY) | `canUpdate` | `trips:update` | **YES** |
| `manifest-drawer.tsx` -> Cancel trip (drawer) | `canCancel` | `trips:cancel` | **YES** |
| `manifest-drawer.tsx` -> Check-in / bulk check-in / per-row check-in / scan | `canCheckIn = can("bookings:update")` | `checkInBooking`/`bulkCheckIn` = `bookings:update` | **YES but see §4 — key mismatch** (`bookings:checkin` unused) |
| `manifest-drawer.tsx` -> Bulk cancel bookings (selected) | `canCancel` | `bulkCancelBookings` = `bookings:update` | **NO — leaks** (client gate is `canCancel` = `trips:cancel`, but the server requires `bookings:update`). A `trips:cancel`-rights user who lacks `bookings:update` sees bulk-cancel + check-in selection UI -> server rejects | |
| `trips-toolbar` filters | none | — | ok |

### C. Bookings

| view/component | action | client gate | server gate | match |
|---|---|---|---|---|
| `operator-bookings-view.tsx` | Export CSV | **NONE** | `exportBookingsCsv` = `revenue:export` | **NO — leaks** (bookings:read-only roles see it) |
| `operator-bookings-view.tsx` | Scan Ticket, Check-in row | `can("bookings:update")` | `checkInBooking` = `bookings:update` | YES (but `bookings:checkin` unused) |
| `booking-detail-drawer.tsx` | cancel booking | `canCancel = can("bookings:update")` | `cancelBooking` = `bookings:update` | YES |
| `booking-row.tsx`/`bookings-list.tsx` | check-in button | `onCheckIn` passed only if `canCheckIn` (bookings:update) | `bookings:update` | YES |

### C. Routes

| view/component | action | client gate | server gate | match |
|---|---|---|---|---|
| `operator-routes-view.tsx` | "Create Route" (header + empty) | `can("routes:create")` | create = `routes:create` | YES |
| `routes/route-card.tsx` | Edit | `can("routes:update")` (passed `onEdit`) | update = `routes:update` | YES |
| `routes/route-card.tsx` | Delete | `can("routes:delete")` (passed `onDelete`) | delete = `routes:delete` | YES |
| `routes/route-form-drawer.tsx` | submit create/edit | uses passed callbacks (view-gated) | create/update | YES |
| `routes/delete-route-dialog.tsx` | confirm delete | opened only when `onDelete` given | delete | YES |
| `routes/routes-table.tsx` | **(dead code - not imported)** | n/a | — | DEAD |

### D. Terminals
| `operator-terminals-view.tsx` | Add | `can("terminals:create")` | create | YES |
| `terminals/terminals-table.tsx` | Edit/Toggle | `can("terminals:update")` | update | YES |
| `terminals/terminals-table.tsx` | Delete | `can("terminals:delete")` | delete | YES |
| `terminals/terminals-table.tsx` | Resolve capture approve/reject | `can("terminals:geocapture")` | captures approve/reject | YES |
| `terminals/terminal-editor-sheet.tsx` | save | gated by parent `canUpdate`/`isOpen` | update | YES |

### E. Schedules
| `operator-schedules-view.tsx` | Create (toolbar/empty) | `can("schedules:create")` | create | YES |
| `operator-schedules-view.tsx` | wizard publish | `canCreate` guard wraps wizard | create | YES |
| `schedules/schedule-card.tsx` | Edit / Delete / Extend / Retire | `canUpdate`/`canDelete` props | update/delete; regenererate-gate-level | **YES** (retire/extend use `canUpdate`; server regenerateTrips & trippage require `schedules:update` after acceptance) |
| `prefetch`: routes.list gated `can("routes:read")`, fleet buses gated `can("fleet:read")` | ok (avoids prefetched leak) | — | YES |
| Page-level prefetch `schedules.list` | page prefetch (server) | procedure gate | YES (server gated) |

### G. Fleet (ACTIVE impl)
| `operator-fleet-view.tsx` | page itself | `can("fleet:read")` else AccessDenied | fleet:read | YES |
| `operator-fleet-view.tsx` (inside) | **Add Vehicle**, bus Edit, Delete bus | **NONE** (only `can("fleet:read")` at top) | create/update/delete | **NO — leaks** (a `fleet:read`-only role e.g. OPERATIONS sees all add/edit/delete UI, server rejects) |
| `operator-fleet-view.tsx` | "Add Bus Type" | **NONE** | `fleet:create` | **NO — leaks** |
| `operator-fleet-view.tsx` Layouts tab | "Create Custom Layout", "Delete Layout", builder | **NONE** | `fleet:create`/`delete` | **NO — leaks** |
| `fleet/add-bus-type-dialog.tsx`, `add-bus-modal.tsx`, `layout-builder-sheet.tsx` | submit | calls un-gated above | gated above | NO |
| `fleet/{buses-table,bus-edit-modal,add-bus-drawer,delete-bus-dialog,seat-map-drawer}.tsx` | **(dead code** — not imported anywhere) | n/a | — | DEAD |

### H. Revenue
| `operator-revenue-view.tsx` | page (route-guard `revenue:view`) | yes | `getRevenueAnalytics` `revenue:view` | YES |
| `revenue/revenue-header.tsx` | **Export** button | `can("revenue:export")` | `exportBookingsCsv` `revenue:export` | YES |
| `balance-overview-cards` / snapshot | metric | route-guard | `getAccountSnapshot` `revenue:view` | YES |

### I. Withdraw / Financials
| `operator-withdraw-view.tsx` | Request payout card + submit | `can("withdrawals:create")` | `requestWithdrawal` `withdrawals:create` | YES |
| `operator-withdraw-view.tsx` | balances / history (page load) | route-guard `withdrawals:view` | `listWithdrawals` view; but also `getAccountSnapshot` = `revenue:view` + `withdrawalControls` = `withdrawals:view` | **NOIS** — page pulls `getAccountSnapshot` (revenue:view) and `getSettings` (company:view); every current role with withdrawals:easy also has revenue/view & company/view, so latent-only risk |

### J. Reviews
| `operator-reviews-view.tsx` | Respond / edit | `can("reviews:respond")` | `respondToReview` = `reviews:respond` | YES |

### K. Staff
| `operator-staff-view.tsx` | Invite | `can("staff:invite")` | createInvitation `staff:invite` | YES |
| `operator-staff-view.tsx` | Edit perms (deep-link) | `can("staff:update")`, skips OWNER | `updatePermissions` `staff:update` | YES |
| `staff/staff-member-row.tsx` | Edit role / delete | `canUpdate` & `member.role !== "OWNER"` / `canDelete` | `staff:update` / `staff:remove` | YES |
| `staff/role-sheet.tsx`, `invite-sheet.tsx` | role change/reset | (props) | `staff:update`/`invite` | YES |
| `staff/edit-permissions-sheet.tsx` | save perms | (props) | `staff:update` | YES |
| `staff/transfer-ownership-dialog.tsx` | transfer | (props; owner-only UI) | `requireOwner` | YES |
| `staff/remove-staff-dialog.tsx` | remove | `can("staff:remove")` | `staff:remove` | YES |

### L. Settings (`operator/settings/…`)
| `settings/settings-sidebar.tsx` | nav item visibility | `role==="OWNER" || core/perms.includes(...)` | settings page route-guard `company:view` | **YES** (but relies on raw `permissions` incl not `can()`) |
| `settings/components/views/company-profile-view.tsx` | **Save / whole editable form** | **NONE** | `updateCompanyProfile` = `company:profile:update` | **NO — leaks** (a user with `company:view`-only like FINANCE sees the editable editor + Save but server rejects) |
| `settings/components/views/banking-view.tsx` | Add / Edit / Delete account | `can("company:banking:update") || can("financials:view")` | add/update/delete bank = `company:banking:update` | **NO — leaks** (`financials:view` NOT sufficient server-side, so a financials:view-only user sees add/edit/delete — server rejects) |
| `settings/components/views/compliance-view.tsx` | Upload / delete / replace docs | `can("company:compliance:update")` | `company:compliance:update` | **YES** (+ View/sign hidden behind it — minor) |
| `settings/profile-drawer` etc (drawers) | personal profile | everyone | personal = user-level | YES |

---

## Answers

**A. Is the operator nav/sidebar gated?** YES. `operator-sidebar.tsx` NavItem.permissions drives per-tab visibility with `can()` (Overview=any-of trips/booking/company; each tab = its read key). Quick-actions (`operator-quick-actions.tsx`) also gate every action to its matching create key. Weakness: the explicit individual tab lists are manually in sync with `route-guard`, and the **command palette (`operator-search-dialog.tsx`) is NOT permission-filtered** — it shows Staff/Financials/Withdraw/Settings links to every role.

**B. Role selectable in invite/role-sheet vs ASSIGNABLE_ROLES?** MOSTLY CONSISTENT. `InviteSheet`+`RoleSheet` receive `assignableRoles` from `useStaffPermissions` (= `ASSIGNABLE_ROLES[role]`). Curating fallbacks exist: `InviteSheet.tsx:35 INVITABLE_ROLES` and `RoleSheet.tsx:46 FALLBACK_ROLES` which include ADMIN/MANAGER — they only apply if `assignableRoles` is empty (never for staff-invite-visible roles), but they are a **duplicate source of truth that can diverge** and would over-grant if ever hit (fallback: a MANAGER-with-empty would suggest ADMIN/MANAGER). Recommend: pass `assignableRoles` unconditionally (no fallback) or assert `ASSIGNABLE_ROLES` at import.

**C. Permission matrix vs 40-key catalog & grant-hold?** `permission-matrix.tsx` renders the FULL catalog (via `getPermissionsByGroup()`) but filters each key/group through `grantableSet` (`grantable`= the actor's own effective grants from `getMyPermissions`). Keys the actor doesn't hold are hidden and their toggle is ignored; group toggle only touches grantable keys. So the matrix does **NOT** allow granting keys the actor lacks. For OWNER, `getMyPermissions` returns all 40 → full matrix. This matches server `requireCanGrant` (staff.ts:220). **Consistent / correct.**

**D. Route guards & prefetch permission-aware?** Client route guard (`route-guard.tsx`) covers each page + prefix and denies with `AccessDeniedCard`. Page-level server prefetch sys.calls gated procedures (e.g. `schedules.list`, `getRevenueAnalytics`); they do NOT branch on `can()` client-side, but the server enforces the key, so no leak. Because `layout.tsx` prefetches only `getShellContext` (intentionally un-gated) + `getMyPermissions`, the shell is safe. **Risk:** a role directly hitting an unauthorized URL triggers a server-side prefetch of a gated procedure, which throws before the client RouteGuard renders AccessDenied → possible error page instead of clean denial. Low severity.

**E. Hardcoded roles that should/ignore permission checks**
- `staff/staff-member-row.tsx:124,171` `member.role !== "OWNER"` — good (protect owner).
- `staff/role-sheet.tsx:79` owner→ADMIN default; `operator-staff-view.tsx:104` skips OWNER — good.
- `operator-sidebar.tsx:379` `user?.role === "ADMIN"` → "Platform Admin" badge — this is the *platform* user's role (not operator) — benign but distinct refactor.
- `staff.ts:314` / `settings.ts:359,469,509` use `ctx.operator.role !== "OWNER"`/`requireOwner` server-side — correct owner-only policy.
- `trips.ts:647` OWNER/MANAGER Novu notifications (server).
- `onboarding/profile-step.tsx:75` default `OWNER` during onboarding — ok.
- **No** legit client path gates permissions on string-role equality for mutation visibility except banking sidebar (`role === "OWNER" || …`), which is acceptable given OWNER is implicit-all.

**F. TODO / FIXME / dead code**
- **Dead/unused components** (not imported anywhere in `apps/web`, superseded by `operator-fleet-view.tsx`/`operator-*`): `components/fleet/buses-table.tsx`, `bus-edit-modal.tsx`, `add-bus-drawer.tsx`, `delete-bus-dialog.tsx`, `seat-map-drawer.tsx`, and `components/routes/routes-table.tsx`.
- **`bookings:checkin` catalog key (permissions.ts:62) is dead in the operator UI/server:** every operator check-in path (client + server) uses `bookings:update`, so CONDUCTOR (template `bookings:checkin`, no `bookings:update`) cannot actually check in — no client control and no server gate honor it. Either server should accept `bookings:checkin` for checkInBook/bulkCheckIn, or conductor routes should gate on `bookings:checkin`.
- `bookings:cancel` is enforced only on `payments.cancelBooking` (payments.ts:117, alongside `bookings:update`); the operator cancel/bulk-cancel paths never check it, so SUPPORT/OPERATIONS can cancel+refund without it. Half-implemented key.
- `operator-dashboard-view.tsx` **is the live dashboard page** (`app/[locale]/dashboard/operator/(dashboard)/page.tsx:3`). It inlines one-off components vs the shared `operator-dashboard-header`/`stat-card` — consolidation opportunity, and its un-gated actions (see `§A` dashboard rows) are live leaks.

---

## Priority fixes (top findings)
1. **Fleet view** (`operator-fleet-view.tsx`) gates only `fleet:read` at top; all create/update/delete buttons (Add Vehicle, Edit, Delete, Add Bus Type, Create/Delete Layout) need `can("fleet:create"/"fleet:update"/"fleet:delete")`. Currently a `fleet:read`-only role sees admin fleet controls.
2. **Bookings Export CSV** has no client gate; server = `revenue:export`. Gate it with `can("revenue:export")`.
3. **Dashboard** "Scan Check-In" (`operator-dashboard-view.tsx`) has no gate — hide unless `can("bookings:update")`.
4. **Check-in permission key**: align `bookings:checkin` vs `bookings:update` (catalog says "Check in passengers" = `checkin`) across `useStaffPermissions`/server so CONDUCTOR actually gets check-in.
5. **`operator-search-dialog.tsx`** (Quick Navigation) not permission-filtered — filter `operatorSearchItems` by `can()` (or remove sensitive destinations).
6. **Settings `company-profile-view`** no gate on `company:profile:update`; `banking-view` gates edit on `financials:view` (too broad) — use only `company:banking:update`.

## Verdict summary (counts, subjective)
- Strong/exact matches: routes, terminals, schedules, reviews, staff (invite/edit/remove/transfer), with withdrawals(create), quick-actions.
- **Client shows but server rejects (HIGH):** fleet create/update/delete; Dashboard check-in; Bookings Export CSV; DebtorSearch improvements; CompanyProfile Save; Banking edit via `financials:view`.
- **Server allows / client hides (LOW):** none material — the single component case is reversed (fleet updates).
- **Dead key/code:** `bookings:checkin` (no server path), `bookings:cancel` (no server path), and 6 unused fleet component files.