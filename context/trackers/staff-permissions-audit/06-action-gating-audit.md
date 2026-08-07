# 06 — Action-Gating Audit (View Level)

Every create/edit/delete/cancel/check-in/withdraw/respond action across the operator views, and exactly how it is gated client-side. Views live in `apps/web/features/operator/views/`.

---

## 0. Summary

- **5 of 11 views gate actions client-side** via `useStaffPermissions().can(...)`: **Trips, Schedules, Bookings, Reviews, Staff**.
- **6 of 11 views have ZERO client-side gating** (no `useStaffPermissions` import at all): **Fleet, Routes, Terminals, Revenue, Withdraw, Dashboard**.
- `AccessDeniedCard` (`components/access-denied-card.tsx`) is **dead code** — defined, never imported.
- Server-side gates are correct on every mutation; the gap is purely UI hiding/feedback (bare 403 toast on submit).

---

## 1. Trips (`operator-trips-view.tsx`) — GATED ✅

```ts
const { can } = useStaffPermissions();
const canUpdate   = can("trips:update");
const canCancel   = can("trips:cancel");
const canCheckIn  = can("bookings:update");
const canReadFleet = can("fleet:read");
```
- `fleet.getBuses` fetch gated `enabled: canReadFleet && canUpdate`.
- `TripCard` `canUpdate={canUpdate && canReadFleet}`.
- `ManifestDrawer` receives `canUpdate / canCancel / canCheckIn`.

**Manifest drawer (`manifest-drawer.tsx`) — bulk-action leak:** ⚠️
- ✅ Gated: assign-bus combobox (`canUpdate && buses.length`), gate/notes editors (`canUpdate`), per-row check-in (`canCheckIn && CONFIRMED && !checkedInAt`), scan (`canCheckIn`), Board/Depart/Arrive/Delay (`canUpdate`), Cancel trip (`canCancel`).
- ❌ **NOT gated:** "Check in all" button, per-row **checkboxes**, "Cancel selected" button, and the bulk-cancel form. Visible to a `trips:read`-only staff (opening the manifest needs only `trips:read` via `trips.getManifest`); `bulkCheckInBookings`/`bulkCancelBookings` then 403 server-side (`bookings:update`).

## 2. Schedules (`operator-schedules-view.tsx`) — GATED ✅

```ts
const canCreate = can("schedules:create");
const canUpdate = can("schedules:update");
const canDelete = can("schedules:delete");
```
- Wizard open gated `canCreate`; toolbar `canCreate`; empty-state CTA gated; `ScheduleCard` `canUpdate/canDelete`; edit-fetch guard `if (!canUpdate) return`.
- Auxiliary `routes.list`/`fleet.getBuses` gated via `enabled: can(...)`.

## 3. Bookings (`operator-bookings-view.tsx`) — GATED ✅

```ts
const canCheckIn = can("bookings:update");
```
- Check-in button only rendered when `onCheckIn` prop present AND `status === "CONFIRMED"` AND `!checkedInAt` (`booking-row.tsx`).
- Detail drawer `canCancel = can("bookings:update")`.
- ❌ Note: `bookings/page.tsx` server-prefetches `listBookings` (`bookings:read`) → FORBIDDEN error boundary for non-viewers (no friendly state).

## 4. Reviews (`operator-reviews-view.tsx`) — GATED ✅
- `const canRespond = can("reviews:respond")` gates the respond box; `listReviews` (read) ungated (page prefetch gates the page).

## 5. Staff (`operator-staff-view.tsx`) — GATED ✅
- `canInvite = can("staff:invite")`, `canUpdate = can("staff:update")`.
- Invite button + empty-state CTA gated; edit role/permissions gated on `canUpdate && member.role !== "OWNER"`.
- **Deep-link bypass:** `?member=<id>` opens the `EditPermissionsSheet` for any non-OWNER member **without** checking `can("staff:update")` or `canModify`.
- Details in [`07-staff-management-audit.md`](./07-staff-management-audit.md).

---

## 6. Fleet (`operator-fleet-view.tsx`) — ❌ NOT GATED

No `useStaffPermissions` import. All of the following are visible to any staff with `fleet:read`:
| Action | Component | Server mutation (perm) |
|---|---|---|
| Add bus type | button → `AddBusTypeDialog` | `fleet.createBusType` (`fleet:create`) |
| Add vehicle | button / empty-state CTA → `AddBusModal` | `fleet.createBus` (`fleet:create`) |
| Edit bus | `BusCard` edit → `AddBusModal`/`BusEditModal` | `fleet.updateBus` (`fleet:update`) |
| Delete bus | `BusCard` delete → `DeleteBusDialog` | `fleet.deleteBus` (`fleet:delete`) |
| Create custom layout | buttons → `LayoutBuilderSheet` | `fleet.createCustomLayout` (`fleet:create`) |
| Delete custom layout | `CustomLayoutCard` delete | `fleet.deleteCustomLayout` (`fleet:delete`) |
| Toggle seat | seat map | `fleet.toggleSeatStatus` (`fleet:update`) |

## 7. Routes (`operator-routes-view.tsx`) — ❌ NOT GATED

No `useStaffPermissions`. Visible to any `routes:read` staff:
| Action | Server mutation (perm) |
|---|---|
| Create route | `routes.create` (`routes:create`) |
| Edit route | `routes.update` (`routes:update`) |
| Delete route | `routes.delete` (`routes:delete`) |

(`RouteFormDrawer`, `DeleteRouteDialog` unconditionally mounted.)

## 8. Terminals (`operator-terminals-view.tsx`) — ❌ NOT GATED

No `useStaffPermissions`. Visible to any `terminals:read` staff:
| Action | Server mutation (perm) |
|---|---|
| Add location | `terminals.create` (`terminals:create`) |
| Edit terminal | `terminals.update` (`terminals:update`) |
| Toggle terminal | `terminals.update` |
| Delete terminal | `terminals.delete` (`terminals:delete`) |
| Approve / Reject geo-capture | `captures.approveCapture`/`rejectCapture` (`terminals:update`) |

## 9. Revenue (`operator-revenue-view.tsx`) — ❌ NOT GATED
- Page effectively gated by server prefetch (`revenue:view`) — non-viewers crash at render.
- `transaction-ledger-table.tsx` Export CSV → `operator.exportLedgerCsv` (`revenue:view`) — server-enforced.
- **`revenue-header.tsx` Export button has NO onClick and NO gating — dead button** (renders but does nothing).

## 10. Withdraw (`operator-withdraw-view.tsx`) — ❌ NOT GATED
- "Send code" 2FA button → `operator.requestWithdrawalChallenge` (`withdrawals:create`).
- "Request withdrawal" button → `operator.requestWithdrawal` (`withdrawals:create`).
- ⚠️ **View-but-not-act:** page prefetches `getAccountSnapshot` (`revenue:view`) + `listWithdrawals` (`withdrawals:view`). A staff with `withdrawals:view` but **without** `withdrawals:create` sees the full payout form and only discovers denial on submit (403 toast). Should gate the payout card on `can("withdrawals:create")`.

## 11. Dashboard (`operator-dashboard-view.tsx`) — ❌ NOT GATED
- "Scan check-in" quick action opens `TicketScanner` → `operator.checkInBooking` (`bookings:update`). Server allows the page with `trips:read` OR `bookings:read` OR `company:view` — a `trips:read`-only staff sees the scanner and gets 403 on use.
- "New route" / "Manage fleet" are nav links (safe).

---

## 12. Header quick actions (`operator-quick-actions.tsx` — rendered on every dashboard page)

**5 buttons, ZERO permission gating:**

| Button | Target | Server gate of target |
|---|---|---|
| New Terminal | `/terminals?action=new` | `terminals:read`/`create` |
| New Route | `/routes?action=new` | `routes:read`/`create` |
| New Schedule | `/schedules?action=new` | `schedules:read` |
| Add Vehicle | `/fleet?action=new` | `fleet:read` |
| Dispatch Board | `/trips` | `trips:read` |

SUPPORT sees "New Terminal", "New Route", "Add Vehicle" and clicks into FORBIDDEN pages.

---

## 13. AccessDeniedCard — dead code
Defined in `apps/web/features/operator/components/access-denied-card.tsx`, imported by **nothing**. No page/view renders it on FORBIDDEN.

---

## 14. View-level findings

| # | Finding | Severity |
|---|---|---|
| V1 | Fleet/Routes/Terminals show create/edit/delete controls to view-only staff (server 403 on submit) | MEDIUM |
| V2 | Withdraw form + 2FA buttons shown to `withdrawals:view`-only staff | MEDIUM |
| V3 | Dashboard "Scan check-in" shown to staff without `bookings:update` | MEDIUM |
| V4 | Manifest drawer bulk actions ("Check in all", checkboxes, "Cancel selected") not gated | MEDIUM |
| V5 | Header quick actions ungated → FORBIDDEN page jumps for SUPPORT | MEDIUM |
| V6 | `AccessDeniedCard` dead code; error boundary is the only fallback | LOW |
| V7 | Revenue header Export button is dead (no handler) | LOW |
| V8 | Bookings/Withdraw pages server-prefetch gated queries → error boundary instead of friendly state | LOW |

Continue to [`07-staff-management-audit.md`](./07-staff-management-audit.md).
