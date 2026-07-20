# Phase 2 — Security & Tenant Isolation

**Priority:** P0 — Block Release  
**Issues:** C4, C5, C8, C9, C10, C12, H1  
**Rationale:** These issues allow authenticated attackers or bugs to corrupt data across tenant boundaries, cancel trips without issuing refunds, and send payouts to the wrong bank account. All are exploitable without any special access beyond a valid operator or passenger session.

---

## C4 — trips.updateStatus can set CANCELLED without refunds or trips:cancel

### What Is Wrong
`trpc/routers/trips.ts → updateStatus` accepts the full `tripStatusEnum` (including `CANCELLED`) and only requires `trips:update` permission. The `assertTripTransition` helper in `lib/trip-status.ts` allows `SCHEDULED → CANCELLED`, `BOARDING → CANCELLED`, and `DELAYED → CANCELLED`. When an operator (or any API client) calls `updateStatus` with `CANCELLED`, the trip is cancelled **without any refund processing** and **without requiring `trips:cancel`**.

This means:
- Passengers with `CONFIRMED` bookings are silently left with cancelled tickets.
- No `Refund` rows are created.
- No ledger entries are written.
- Passengers are not notified.
- Operator's reserved balance is never clawed back.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `lib/trip-status.ts` | `canTransitionTripStatus` returns `true` for `→ CANCELLED`. This function is also used by `nextTripActions` which drives the UI action buttons. The cancel button in the UI calls the `trips.cancel` procedure (correct), but any direct API call to `updateStatus` bypasses all safety. |
| `operator-trips-view.tsx` | Manifest drawer's "Update Status" dropdown currently allows CANCELLED to appear as an option if the UI uses `nextTripActions`. If so, a user clicking the dropdown can cancel a trip without refunds. |
| `apps/web/trpc/routers/trips.ts → updateStatus` | The mutation runs without the `cancelTripWithRefunds` helper. Bookings remain `CONFIRMED`, holds remain `PENDING_PAYMENT`. |
| `cancellation-service.ts` | Never called — refunds are skipped entirely. |
| Passenger notifications | `passenger-trip-cancelled` Novu workflow is never triggered. |
| `release-escrow` cron | On the next escrow release cycle, the trip will be `CANCELLED` (not `ARRIVED`), so the cron won't touch it — operator's reserved balance is locked forever. |

### How to Fix the Issue
1. In `trips.ts → updateStatus`, **exclude `CANCELLED` and `DELAYED` (as a terminal)** from the accepted input enum. Define a restricted enum: `updateStatusInput = z.enum(["BOARDING", "DEPARTED", "ARRIVED", "DELAYED"])`.
2. Update `lib/trip-status.ts → TRANSITIONS` to remove `CANCELLED` from all source states (it should only be reachable via the dedicated `trips.cancel` procedure).
3. Keep `canCancel` in `nextTripActions` returning `true` — but route the UI cancel button exclusively to `trips.cancel`, never to `updateStatus`.

### How to Fix Each Side Effect
- **operator-trips-view.tsx:** Remove `CANCELLED` from any status dropdown that calls `updateStatus`. Ensure the cancel flow uses `trips.cancel` exclusively (already appears to be the case in the UI, but verify the manifest drawer).
- **trip-status.ts:** Remove `CANCELLED` from `TRANSITIONS` map entries for all states. Add a comment: "CANCELLED is a terminal state reachable only via trips.cancel."
- **Escrow / reserved balance:** No direct fix needed here — preventing the bug prevents the stuck balance.

---

## C5 — Trip cancel is non-atomic; post-departure force-cancels without money; holds survive

### What Is Wrong
In `lib/cancel-trip-with-refunds.ts`:
1. **Non-atomic:** The trip is set to `CANCELLED` (line 62–68) **before** refunds are processed (lines 103–143). If the server crashes between these, the trip is cancelled but bookings are still `CONFIRMED` and no refunds have been issued.
2. **Post-departure force-cancel:** If `departureDate <= now` and the status is still `SCHEDULED/BOARDING/DELAYED`, the function allows cancellation with `forceAfterDeparture: true`. The catch block (line 127) force-sets bookings to `CANCELLED` with no ledger entry.
3. **PENDING_PAYMENT holds survive:** The code expires holds (`PENDING_PAYMENT → EXPIRED`) before the trip is cancelled (line 51–60). **This is correct order.** However, the hold group status is never updated to `CANCELLED`, leaving `HoldGroup.status = "ACTIVE"` for all the expired individual booking holds.
4. **Actor spoofing:** The old `userRole: "ADMIN"` spoof has been removed per the current code reading — `actor.role` maps to `"OPERATOR" | "ADMIN"` and is passed through. Verify no internal spoof remains.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-bookings-view.tsx` | Bookings stuck in `CONFIRMED` after a partial cancel show as active in the operator view — operators don't know a refund failed. |
| `trpc/routers/trips.ts → cancel` | Calls `cancelTripWithRefunds`. Non-atomic nature means partial failures are possible with no rollback. |
| `trpc/routers/operator.ts → cancelBooking` | Operator tries to cancel individual bookings on a partially-cancelled trip — might succeed or fail depending on booking status. |
| `release-escrow cron` | CONFIRMED bookings on a CANCELLED trip will never meet the cron's `trip.status: "ARRIVED"` filter — reserved balance is locked forever. |
| `HoldGroup.status` | Stays `ACTIVE` after trip cancel if holds are expired but group status isn't updated. Search/booking flows that check hold group status may behave unexpectedly. |
| Passenger notifications | If refund loop fails partway, some passengers get notified and some don't. |

### How to Fix the Issue
1. **Two-phase cancel inside a transaction:** Wrap the entire cancel in a `$transaction`. Within it: (a) expire holds, (b) cancel the trip, (c) cancel all `CONFIRMED` bookings, (d) write a `FinancialTransaction` for each refund. Commit atomically.
2. **Block post-departure cancel without force:** Add a hard block: if `departureDate <= now` and trip is not `BOARDING` or `SCHEDULED`, throw an error rather than allowing `forceAfterDeparture`. Ops must handle post-departure cancellations via admin tools with explicit money movement.
3. **Update HoldGroup status:** After expiring individual booking holds, also update `HoldGroup.status = "CANCELLED"` for all affected groups.
4. **On refund failure, write a CANCEL_WITHOUT_REFUND transaction:** Instead of silently setting `status: "CANCELLED"`, write a `FinancialTransaction` of type `CANCEL_NO_REFUND` with metadata explaining why the refund failed. This creates an ops audit trail.
5. **Remove `forceAfterDeparture` from public-facing cancel:** Make it an internal admin-only flag not exposed via the `trips.cancel` tRPC procedure.

### How to Fix Each Side Effect
- **operator-bookings-view.tsx:** Show a warning badge on bookings that have `status: "CANCELLED"` but `paymentStatus` still showing as `PAID` (refund not issued). These are "cancelled without refund" cases.
- **release-escrow cron:** Add a secondary query for bookings on `CANCELLED` trips that are still `CONFIRMED` — alert ops, do not auto-release.
- **HoldGroup:** Add a `cancelHoldGroupsForTrip(tripId)` helper called inside the cancel transaction.

---

## C8 — Bank update can keep verified Paystack recipient for old account

### What Is Wrong
`trpc/routers/operator.ts → updateBank` encrypts the new account number and saves it. However, it does **not** clear `isVerified` or `paystackTransferRecipientCode` on the bank account row. The subsequent `requestWithdrawal` procedure uses the stored `paystackTransferRecipientCode` to initiate a Paystack transfer. If the code is stale (pointing at the old account), the payout goes to the old bank account while the UI shows the new account's last 4 digits.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `operator-settings-view.tsx` (bank section) | UI shows "Verified" badge and new last4 digits, giving false confidence the new account is the payout destination. |
| `operator-withdraw-view.tsx` | Withdrawal initiated against the stale recipient code. Paystack transfers to old account. |
| `trpc/routers/operator.ts → requestWithdrawal` | Reads `bank.paystackTransferRecipientCode` without checking if it matches the current account. |
| `lib/bank-account.ts` | `createPaystackRecipient` is called during verification, not during account number change. The re-verification flow might not be triggered. |
| Operator onboarding flow | If an operator updates their bank during onboarding (before first withdrawal), the recipient is never invalidated — the problem is invisible until first payout. |

### How to Fix the Issue
1. In `operator.ts → updateBank`: when `accountNumber` or `bankCode` changes, set `isVerified = false` and `paystackTransferRecipientCode = null` on the bank account row in the same update.
2. In `requestWithdrawal`: before initiating a transfer, assert `bank.isVerified === true && bank.paystackTransferRecipientCode !== null`. If not, throw a `BAD_REQUEST` with message "Please re-verify your bank account before requesting a withdrawal."
3. In `operator-settings-view.tsx`: after a bank update, display a banner: "Your bank details have changed. Please verify your new account before withdrawing."

### How to Fix Each Side Effect
- **UI badge:** Clear the "Verified" state in the settings view on successful bank update (invalidate `trpc.operator.getBank` query).
- **Withdraw page:** Show a blocking warning if `isVerified = false` — user must complete re-verification before the withdraw button is enabled.
- **Onboarding:** The `isOnboardingComplete` check should include `bank.isVerified` — already partially in place, confirm it validates `paystackTransferRecipientCode !== null`.

---

## C9 — Duplicate trips under concurrent generation (no unique constraint)

### What Is Wrong
`trip-generator.ts` checks for existing trips in memory via `existingKeys` set (line 113). Under concurrent cron runs, two invocations can both read the same `existingTrips` array (both see no trip for date X), both pass the in-memory check, and both attempt `tx.trip.create` for the same `(scheduleId, departureDate)`. Without a DB-level unique constraint, both succeed — creating two trips for the same schedule on the same day.

The generator does handle `P2002` (line 213) — but this only works if the unique constraint exists in the schema. **If the `@@unique` constraint on `(scheduleId, departureDate)` does not exist in `schema.prisma`, `P2002` will never fire.**

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| Search (`trpc/routers/search.ts`) | Search returns both duplicate trips to passengers. Same seat can be "booked" on both trips — inventory is split across duplicates. |
| `operator-trips-view.tsx` | Operator sees two trips for the same route and date. No UI distinction. |
| `release-escrow cron` | Both trips reach `ARRIVED` and trigger escrow release — operator gets paid twice for the same passengers. |
| `operator.getRevenueAnalytics` | Revenue is double-counted for the duplicate trip day. |
| `assignBus` / seat map | `TripSeat` rows created for both trips. Same physical seats appear available on both trips — double-booking is possible. |

### How to Fix the Issue
1. Add `@@unique([scheduleId, departureDate])` to the `Trip` model in `packages/db/prisma/schema.prisma`.
2. Create and run a migration: `pnpm prisma migrate dev --name add-trip-unique-schedule-departure`.
3. Before migration, run a one-off SQL query to detect and clean existing duplicates:
   ```sql
   SELECT "scheduleId", "departureDate", COUNT(*) FROM "trip" 
   GROUP BY "scheduleId", "departureDate" HAVING COUNT(*) > 1;
   ```
4. For any existing duplicates, keep the trip with the most bookings and delete/merge the other.
5. The `P2002` catch in `trip-generator.ts` (line 213) is already correct — it will now reliably fire when a race occurs.

### How to Fix Each Side Effect
- **Search:** Once duplicates are removed and the constraint added, search naturally returns one trip per slot.
- **Revenue view:** Run a one-time audit to identify and zero-out duplicate revenue ledger entries from the duplicate trips.
- **Operator trips view:** After cleanup, duplicates disappear. No UI change needed.

---

## C10 — Trip generator does not scope bus to schedule company

### What Is Wrong
In `trip-generator.ts` (line 46–58), the `bus.findFirst` query already includes `companyId: schedule.companyId`. Reading the current code shows this **is already fixed**. The bus lookup now requires `companyId` match, `deletedAt: null`, and `status: "ACTIVE"`.

**What still needs verification:**
- `busIdOverride` parameter: when a caller passes a `busIdOverride`, the query still includes `companyId: schedule.companyId`. Confirm this prevents cross-tenant override.
- The admin override path (if any admin can call `schedules.regenerateTrips` with an arbitrary `busId`) should also be company-scoped.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `trpc/routers/schedules.ts → regenerateTrips` | Passes `busIdOverride` to the generator. If an admin accidentally passes a busId from another company, the company check prevents it. Verify this is the case. |
| `apps/web/app/api/cron/generate-trips` | Calls `generateTripsForSchedule` without `busIdOverride`. Company scope is enforced by the findFirst query — correct. |
| Seat assignment | `TripSeat` rows are created from the resolved bus's seats. If the wrong bus was used, seats would be wrong class/count — now prevented. |

### How to Fix the Issue
1. Verify `busIdOverride` path in `schedules.ts → regenerateTrips` passes through the company-scoped `findFirst`. **Current code appears correct.**
2. Add a test case: attempt to regenerate trips for Company A's schedule with Company B's busId — confirm a `404/FORBIDDEN` error is thrown.

### How to Fix Each Side Effect
No functional changes needed if the current code is confirmed correct. Document the fix in the changelog to prevent regression.

---

## C12 — Route create/update does not verify terminal ownership

### What Is Wrong
`trpc/routers/routes.ts → createRoute` and `updateRoute` accept `originTerminalId`, `destTerminalId`, and `waypointTerminalIds`. These are validated as valid UUIDs but **not checked** to confirm:
1. They belong to `ctx.companyId` (tenant isolation).
2. They have `isTerminal: true` (the location is actually a bus terminal).
3. They have `isActive: true` (the terminal is currently operational).

An operator can wire any terminal — even one from a competitor company — into their route.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| Search (`trpc/routers/search.ts`) | Passengers searching from City A → City B see the route. The origin terminal is actually Company B's private terminal — passengers show up at the wrong location. |
| `operator-routes-view.tsx` | Route is created successfully. No validation error shown. Operator may not notice the wrong terminal. |
| `trip-generator.ts` | `TripStop` rows are created for the incorrect terminal. `TripStop.terminalId` references a terminal owned by another company. |
| `operator-terminals-view.tsx` | Company B's terminal appears in Company A's trip stops — cross-tenant data exposure in terminal analytics. |
| Booking / seat map | Passengers booking see the wrong pickup terminal. |

### How to Fix the Issue
1. In `routes.ts`, before creating/updating a route, batch-load all provided terminal IDs:
   ```ts
   const terminals = await ctx.prisma.terminal.findMany({
     where: {
       id: { in: [originTerminalId, destTerminalId, ...waypointTerminalIds] },
       companyId: ctx.companyId,  // tenant check
       isTerminal: true,          // must be a terminal
       isActive: true,            // must be active
     },
   });
   if (terminals.length !== totalExpected) throw new TRPCError({ code: "BAD_REQUEST", ... });
   ```
2. Return a specific error identifying which terminal ID failed and why (not owned / not a terminal / inactive).

### How to Fix Each Side Effect
- **Search:** Once routes are validated on create/update, existing bad routes need a one-time audit. Run a query to find routes whose terminals don't belong to the route's company.
- **trip-generator:** No change needed — the route is already stored; fixing route creation prevents future bad data.
- **operator-routes-view.tsx:** Show a validation message if the user selects a terminal from a different company (client-side, terminals are already filtered by company — confirm the terminal picker query includes `companyId` filter).

---

## H1 — releaseHold / payment init lack hold ownership

### What Is Wrong
`trpc/routers/booking.ts → releaseHold` and `initiatePayment` accept a `holdGroupId` and act on it without checking `holdGroup.userId === ctx.user.id`. Any authenticated user who discovers another user's `holdGroupId` (e.g., via a URL, shared link, or enumeration) can:
- Release (destroy) another user's hold, causing their booking session to fail.
- Initiate payment against another user's hold using their own payment method (if the hold's price matches what they want to pay).

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `apps/web/app/book/` | Booking flow passes `holdGroupId` via URL. Shareable URLs expose hold IDs. |
| `trpc/routers/booking.ts → checkoutWithWallet` | Same lack of ownership check — an attacker can complete payment against another user's hold using their own wallet balance. |
| `features/payments/services/booking-confirmation-service.ts` | Once payment is initiated, confirmation proceeds regardless of who triggered it. |
| `apps/web/app/api/payments/route.ts` (webhook) | Webhook confirms by hold group ID from Paystack metadata — this path is system-initiated and does not need user ownership check. |
| Passenger booking list | A passenger whose hold was killed by another user sees a confusing "session expired" error. |

### How to Fix the Issue
1. Add `assertHoldOwnedBy(holdGroup, ctx.user.id)` helper:
   ```ts
   function assertHoldOwnedBy(holdGroup: { userId: string | null }, userId: string) {
     if (holdGroup.userId !== null && holdGroup.userId !== userId) {
       throw new TRPCError({ code: "FORBIDDEN", message: "This booking session does not belong to you." });
     }
   }
   ```
2. Call this in `releaseHold`, `initiatePayment`, and `checkoutWithWallet` after loading the hold group.
3. For guest holds (`holdGroup.userId = null`), allow the hold to be claimed by the first authenticated user who presents it — but block anyone other than the claimant from acting on it once `userId` is set.
4. Apply the same check in `CancellationService` when called by a passenger (not operator/admin).

### How to Fix Each Side Effect
- **Book page URL:** Use short-lived session tokens (stored in cookies/server session) instead of raw `holdGroupId` in the URL. Or add HMAC signature to the URL parameter.
- **checkoutWithWallet:** Add ownership assert before reading the pricing snapshot.
- **Passenger booking list:** If hold is released by another user, show "Your booking session was cancelled" instead of a generic error.
