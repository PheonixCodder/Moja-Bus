# 04 — Router Guard Audit (Server-Side Truth)

Every tRPC procedure in the operator surface, its procedure type, and the exact permission guard. **The router is the only real enforcement layer** — everything the client does is cosmetic. All file references are relative to `apps/web/trpc/routers/`.

---

## 0. Procedure-type gates (`trpc/init.ts`)

| Procedure type | Gate |
|---|---|
| `publicProcedure` | None (CSRF on mutations only) |
| `protectedProcedure` | Authenticated |
| `operatorProcedure` | `user.role ∈ {OPERATOR, ADMIN}` |
| `operatorCompanyProcedure` | Authenticated + non-SUSPENDED Operator row with `companyId` |
| `adminProcedure` | `user.role === "ADMIN"` |

Helper notes (`apps/web/lib/permissions/authorize.ts`):
- `requirePermission(ctx, k)` → FORBIDDEN unless `operatorHasPermission`.
- `operatorHasPermission`: `user.role === "ADMIN"` → true; `operator.status === "SUSPENDED"` → false; else `role === "OWNER"` → true; else `stored.includes(k)`.
- `requireAnyPermission(ctx, ks)` → needs ≥1.
- `requireOwner(ctx)` → `user.role === "ADMIN"` OR `operator.role === "OWNER"`.
- `requireCanGrant(ctx, proposed)` → all proposed keys in caller's effective set (OWNER/ADMIN bypass).

---

## 1. `routes` router

| Procedure | Type | Guard |
|---|---|---|
| `routes.list` | operatorCompanyProcedure | `requirePermission("routes:read")` |
| `routes.getCities` | operatorCompanyProcedure | `requireAnyPermission(["routes:read", "terminals:read"])` |
| `routes.get` | operatorCompanyProcedure | `requirePermission("routes:read")` |
| `routes.create` | operatorCompanyProcedure | `requirePermission("routes:create")` |
| `routes.update` | operatorCompanyProcedure | `requirePermission("routes:update")` |
| `routes.delete` | operatorCompanyProcedure | `requirePermission("routes:delete")` |

## 2. `trips` router

| Procedure | Type | Guard |
|---|---|---|
| `trips.create` | operatorCompanyProcedure | `requirePermission("trips:create")` |
| `trips.list` | operatorCompanyProcedure | `requirePermission("trips:read")` |
| `trips.statusCounts` | operatorCompanyProcedure | `requirePermission("trips:read")` |
| `trips.get` | operatorCompanyProcedure | `requirePermission("trips:read")` |
| `trips.getManifest` | operatorCompanyProcedure | `requirePermission("trips:read")` |
| `trips.getSeatMap` | operatorCompanyProcedure | `requirePermission("trips:read")` |
| `trips.assignBus` | operatorCompanyProcedure | `requirePermission("trips:update")` |
| `trips.delay` | operatorCompanyProcedure | `requirePermission("trips:update")` |
| `trips.cancel` | operatorCompanyProcedure | `requirePermission("trips:cancel")` |
| `trips.updateStatus` | operatorCompanyProcedure | `requirePermission("trips:update")` |
| `trips.updateNotes` | operatorCompanyProcedure | `requirePermission("trips:update")` |
| `trips.setGate` | operatorCompanyProcedure | `requirePermission("trips:update")` |
| `trips.toggleSingleTripSeatStatus` | operatorCompanyProcedure | `requirePermission("trips:update")` |

## 3. `schedules` router

| Procedure | Type | Guard |
|---|---|---|
| `schedules.list` | operatorCompanyProcedure | `requirePermission("schedules:read")` |
| `schedules.get` | operatorCompanyProcedure | `requirePermission("schedules:read")` |
| `schedules.create` | operatorCompanyProcedure | `requirePermission("schedules:create")` |
| `schedules.retire` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.delete` | operatorCompanyProcedure | `requirePermission("schedules:delete")` |
| `schedules.updateBasic` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.updateCalendar` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.reconcileFutureTrips` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.updateFare` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.addFare` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.deactivateFare` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.regenerateTrips` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.addException` | operatorCompanyProcedure | `requirePermission("schedules:update")` |
| `schedules.removeException` | operatorCompanyProcedure | `requirePermission("schedules:update")` |

> ⚠️ **Indirect trip cancellation without `trips:cancel`:** `addException(type=CANCELLED)`, `updateBasic`, `updateCalendar`, `reconcileFutureTrips`, `removeException` all trigger `cancelTripWithRefunds` internally via schedule reconciliation, gated only by `schedules:update`. A custom role with `schedules:update` but no `trips:cancel` can cancel booked trips (with refunds). Also `trips.assignBus` (trips:update) and `schedules.updateBasic` can reassign seats on existing bookings.

## 4. `fleet` router

| Procedure | Type | Guard |
|---|---|---|
| `fleet.getBusTypes` | operatorCompanyProcedure | `requirePermission("fleet:read")` |
| `fleet.getPermissions` | operatorCompanyProcedure | **NO PERMISSION CHECK** (returns `canManageFleet` bool = `fleet:create \|\| fleet:update`) |
| `fleet.getLayoutTemplates` | operatorCompanyProcedure | `requirePermission("fleet:read")` |
| `fleet.getCustomLayouts` | operatorCompanyProcedure | `requirePermission("fleet:read")` |
| `fleet.getBuses` | operatorCompanyProcedure | `requirePermission("fleet:read")` |
| `fleet.getBusDetails` | operatorCompanyProcedure | `requirePermission("fleet:read")` |
| `fleet.createBus` | operatorCompanyProcedure | `requirePermission("fleet:create")` |
| `fleet.updateBus` | operatorCompanyProcedure | `requirePermission("fleet:update")` |
| `fleet.deleteBus` | operatorCompanyProcedure | `requirePermission("fleet:delete")` |
| `fleet.toggleSeatStatus` | operatorCompanyProcedure | `requirePermission("fleet:update")` |
| `fleet.createCustomLayout` | operatorCompanyProcedure | `requirePermission("fleet:create")` |
| `fleet.deleteCustomLayout` | operatorCompanyProcedure | `requirePermission("fleet:delete")` |
| `fleet.createBusType` | operatorCompanyProcedure | `requirePermission("fleet:create")` |
| `fleet.deleteBusType` | operatorCompanyProcedure | `requirePermission("fleet:delete")` |

## 5. `terminals` router

| Procedure | Type | Guard |
|---|---|---|
| `terminals.list` | operatorCompanyProcedure | `requirePermission("terminals:read")` |
| `terminals.create` | operatorCompanyProcedure | `requirePermission("terminals:create")` |
| `terminals.update` | operatorCompanyProcedure | `requirePermission("terminals:update")` |
| `terminals.delete` | operatorCompanyProcedure | `requirePermission("terminals:delete")` |

## 6. `captures` router (geo capture links)

| Procedure | Type | Guard |
|---|---|---|
| `captures.createCapture` | operatorCompanyProcedure | `requirePermission("terminals:update")` |
| `captures.approveCapture` | operatorCompanyProcedure | `requirePermission("terminals:update")` |
| `captures.rejectCapture` | operatorCompanyProcedure | `requirePermission("terminals:update")` |
| `captures.getInfo` | publicProcedure | none |
| `captures.submit` | publicProcedure | none |
| `captures.confirm` | publicProcedure | none |

> Geo-capture rides on `terminals:update`, so a `terminals:read`-only staff can view terminal capture status but cannot mint/approve/reject.

## 7. `operator` router (`operator.ts`)

### Onboarding / account
| Procedure | Type | Guard |
|---|---|---|
| `operator.checkAccountStatus` | publicProcedure | none |
| `operator.initSignup` | publicProcedure | none |
| `operator.getOnboardingStatus` | operatorProcedure | none |
| `operator.completeOnboarding` | operatorCompanyProcedure | **NO PERMISSION CHECK** ⚠️ (flips company → `PENDING_VERIFICATION`) |
| `operator.resubmitVerification` | operatorCompanyProcedure | **NO PERMISSION CHECK** ⚠️ |
| `operator.validateSlug` | operatorCompanyProcedure | none |
| `operator.saveOnboardingStep` | operatorCompanyProcedure | **NO PERMISSION CHECK** ⚠️ HIGH — writes company (`name`, `registrationNumber`, `taxId`, `slug`), **bank account (re-registers Paystack recipient)**, compliance documents, personal profile |
| `operator.reopenOnboardingStep` | operatorCompanyProcedure | **NO PERMISSION CHECK** |
| `operator.logOnboardingEvent` | operatorCompanyProcedure | none |
| `operator.getShellContext` | operatorCompanyProcedure | none (intentional — sidebar shell) |

### Bookings (operator)
| Procedure | Type | Guard |
|---|---|---|
| `operator.listBookings` | operatorCompanyProcedure | `bookings:read` |
| `operator.exportBookingsCsv` | operatorCompanyProcedure | `bookings:read` |
| `operator.getBooking` | operatorCompanyProcedure | `bookings:read` |
| `operator.checkInBooking` | operatorCompanyProcedure | `bookings:update` |
| `operator.cancelBooking` | operatorCompanyProcedure | `bookings:update` ⚠️ destructive (refunds) |
| `operator.bulkCheckInBookings` | operatorCompanyProcedure | `bookings:update` |
| `operator.bulkCancelBookings` | operatorCompanyProcedure | `bookings:update` ⚠️ destructive |
| `operator.globalSearch` | operatorCompanyProcedure | none (soft per-section `operatorHasPermission` on `bookings:read`/`trips:read`/`staff:read`; denied → `[]`) |

### Reviews
| Procedure | Type | Guard |
|---|---|---|
| `operator.listReviews` | operatorCompanyProcedure | `reviews:read` |
| `operator.respondToReview` | operatorCompanyProcedure | `reviews:respond` |

### Revenue / ledger / dashboard
| Procedure | Type | Guard |
|---|---|---|
| `operator.getRevenueAnalytics` | operatorCompanyProcedure | `revenue:view` |
| `operator.getLedgerEntries` | operatorCompanyProcedure | `revenue:view` |
| `operator.exportLedgerCsv` | operatorCompanyProcedure | `revenue:view` |
| `operator.getSnapshotTimeSeries` | operatorCompanyProcedure | `revenue:view` |
| `operator.getAccountSnapshot` | operatorCompanyProcedure | `revenue:view` |
| `operator.getDashboardMetrics` | operatorCompanyProcedure | `requireAnyPermission(["trips:read", "bookings:read", "company:view"])`; bus count soft-gated by `fleet:read` |

### Withdrawals
| Procedure | Type | Guard |
|---|---|---|
| `operator.getWithdrawalControls` | operatorCompanyProcedure | **NO PERMISSION CHECK** ⚠️ (returns platform 2FA flag, frequency window, min amount) |
| `operator.requestWithdrawalChallenge` | operatorCompanyProcedure | `withdrawals:create` |
| `operator.requestWithdrawal` | operatorCompanyProcedure | `withdrawals:create` |
| `operator.listWithdrawals` | operatorCompanyProcedure | `withdrawals:view` |

### Settings (spread from `operator/settings.ts`)
| Procedure | Type | Guard |
|---|---|---|
| `operator.getSettings` | operatorCompanyProcedure | `company:view` |
| `operator.updateCompany` | operatorCompanyProcedure | `company:update` |
| `operator.updateProfile` | operatorCompanyProcedure | `company:update` |
| `operator.updateBankAccount` | operatorCompanyProcedure | `company:update` |
| `operator.updateBank` | operatorCompanyProcedure | `company:update` |
| `operator.revealBankAccount` | operatorCompanyProcedure | `company:view` + inline `operator.role !== "OWNER"` → FORBIDDEN |
| `operator.listBankAccounts` | operatorCompanyProcedure | `company:view` |
| `operator.addBankAccount` | operatorCompanyProcedure | `company:update` |
| `operator.setDefaultBankAccount` | operatorCompanyProcedure | `company:update` |
| `operator.deleteBankAccount` | operatorCompanyProcedure | `company:update` |
| `operator.addDocument` | operatorCompanyProcedure | `company:update` |
| `operator.deleteDocument` | operatorCompanyProcedure | `company:update` |

> `revealBankAccount` is the **only** sensitive endpoint with an OWNER-only inline check. Bank/payout management otherwise requires only `company:update`, held by both OWNER and ADMIN — so a company **ADMIN** can change the payout destination and even delete the default's sibling accounts.

## 8. `staff` router (`staff.ts`)

| Procedure | Type | Guard |
|---|---|---|
| `staff.getMyPermissions` | operatorCompanyProcedure | none (self) |
| `staff.getMyRole` (deprecated) | operatorCompanyProcedure | none (self) |
| `staff.listStaff` | operatorCompanyProcedure | `staff:read` |
| `staff.updatePermissions` | operatorCompanyProcedure | `staff:update` + `requireCanGrant(input.permissions)` + `assertCanModifyTarget` (hierarchy) |
| `staff.updateRole` | operatorCompanyProcedure | `staff:update` + `requireCanGrant(ROLE_TEMPLATES[role])` + `canAssignRole` + OWNER-only-ADMIN rule |
| `staff.updateStatus` | operatorCompanyProcedure | `staff:update` + `assertCanModifyTarget` + no-OWNER-suspend |
| `staff.removeStaff` | operatorCompanyProcedure | `staff:remove` + `assertCanModifyTarget` + not-self |
| `staff.requestTransferOtp` | operatorCompanyProcedure | `requireOwner` |
| `staff.transferOwnership` | operatorCompanyProcedure | `requireOwner` + OTP verify + not-already-owner + target active |
| `staff.listInvitations` | operatorCompanyProcedure | `staff:read` |
| `staff.createInvitation` | operatorCompanyProcedure | `staff:invite` + `requireCanGrant` + `canAssignRole` + OWNER-only-ADMIN |
| `staff.cancelInvitation` | operatorCompanyProcedure | `staff:invite` + OWNER/ADMIN/inviter-only |
| `staff.resendInvitation` | operatorCompanyProcedure | `staff:invite` |
| `staff.getActivityLog` | operatorCompanyProcedure | `staff:read` |
| `staff.getPermissionCatalog` | operatorCompanyProcedure | `staff:invite` (unused by client) |

> ⚠️ `staff.updateRole` **always** resets permissions to the target role template (privilege-retention guard), regardless of the `resetPermissions` field the client sends (see file 07).

## 9. `invitation` router (`invitation.ts`) — public staff-invite accept

| Procedure | Type | Guard |
|---|---|---|
| `invitation.validateToken` | publicProcedure | none (token lookup; marks EXPIRED on past expiry) |
| `invitation.accept` | publicProcedure | none (token; requires logged-in email == invite email; restores soft-deleted membership; copies `invitation.permissions` to operator; upgrades `User.role` to OPERATOR) |

## 10. `payments` router — operator-relevant procedures

| Procedure | Type | Guard |
|---|---|---|
| `payments.cancelBooking` | protectedProcedure | **NO PERMISSION CHECK** ⚠️ — branches on `user.role`; for OPERATOR it resolves the company and delegates to `CancellationService` (relies on service scoping to the operator's company). Any operator staffer can call it regardless of `bookings:update`. |
| `payments.getHoldPricing` | protectedProcedure | none — any authenticated user can read a pricing snapshot by `holdId` with **no ownership assertion** (unlike `booking` router's `assertHoldOwnedByUser`). |
| `payments.getCheckoutPricing` | publicProcedure | none |
| `payments.listBanks` | publicProcedure | none |
| `updatePlatformSettings`, `listCommissionTiers`, `create/update/deleteCommissionTier`, `listLedgerEntries`, `getTreasuryOverview`, `exportOperatorLedger`, `recordSettlement`, `listSettlementHistory` | adminProcedure (in-file) | role ADMIN only |

## 11. `admin` router (`admin.ts`)
All 46 procedures (KPIs, company verification, ledger, users, roles, suspension, withdrawals `listAllWithdrawals`/`resolveWithdrawal`/`getWithdrawalStats`, onboarding funnel, blog CRUD, dispatch `listDispatchTrips`/`getDispatchTrip`/`getTripAudit`, routes, logs, webhooks) — **role ADMIN only, no permission keys.** Correct for a platform console.

## 12. Other routers
- `booking`, `wallet`, `passenger`, `blog`, `contact`, `storage`, `public`, `search`, `locations` — passenger/public/admin; not part of the operator staff IAM (details noted where they leak into operator flow, e.g. `storage.presignDownload` only checks `operator.companyId === doc.companyId` — **no `company:view`/`company:update` key check**).

---

## Critical findings from the router layer

| # | Finding | Severity |
|---|---|---|
| R1 | `operator.saveOnboardingStep` writes company + **bank account + Paystack recipient** with no permission key (membership only) | CRITICAL |
| R2 | `operator.completeOnboarding` / `resubmitVerification` flip company verification state with no permission key | HIGH |
| R3 | `payments.cancelBooking` has no `bookings:update` guard (relies on `CancellationService` scoping) | HIGH |
| R4 | `operator.cancelBooking` / `bulkCancelBookings` destructive cancel under `bookings:update` (SUPPORT can refund) | MEDIUM |
| R5 | Schedule edits can cancel booked trips without `trips:cancel` | MEDIUM |
| R6 | `operator.getWithdrawalControls` returns platform payout config to any staff member | LOW |
| R7 | `payments.getHoldPricing` lacks ownership assertion (pattern divergence) | LOW |
| R8 | `storage.presignDownload` (compliance docs) gated by company membership, not `company:view` | LOW |
| R9 | `fleet.getPermissions` / `staff.getMyPermissions` / `getShellContext` / `getWithdrawalControls` ungated (informational) | INFO |

Continue to [`05-page-route-audit.md`](./05-page-route-audit.md).
