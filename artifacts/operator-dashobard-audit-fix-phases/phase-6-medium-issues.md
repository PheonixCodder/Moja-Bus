# Phase 6 — Medium Priority Issues

**Priority:** P2 — Quality & Correctness  
**Issues:** M1–M28  
**Rationale:** These issues affect operational quality, data accuracy, and UX consistency. None are money-critical on their own, but several compound with P0/P1 issues to create worse outcomes.

---

## M1 — Gate/notes cannot clear to null

| Item | Detail |
|------|--------|
| **Location** | `manifest-drawer.tsx` |
| **Problem** | Draft state uses `draft \|\| trip.gate` — setting gate to empty string falls back to the existing value. Operators cannot clear a gate assignment. |
| **Side Effect** | Passengers receive notifications with the old gate even after it was intentionally removed. Manifest shows stale gate. |
| **Fix** | Track `null` explicitly in draft state: `draft !== undefined ? draft : trip.gate`. Send `null` (not empty string) to the update mutation when clearing. Update `trips.ts → updateManifest` to accept `null` for gate/notes and set them to `null` in DB. |
| **Side Effect Fix** | Gate notification (if sent) should not fire when gate is null. |

---

## M2 — Trip status chips count current page only

| Item | Detail |
|------|--------|
| **Location** | `operator-trips-view.tsx` |
| **Problem** | Status chips (SCHEDULED: N, BOARDING: M) count trips in the current page, not all trips for the operator. Misleading — clicking "SCHEDULED" shows 5 when there are 50 scheduled trips total. |
| **Side Effect** | Operators make operational decisions (e.g., "all buses are scheduled") based on wrong counts. |
| **Fix** | Add a separate `trpc.trips.statusCounts` query that returns `{ SCHEDULED: N, BOARDING: M, ... }` using a Prisma `groupBy` — no pagination. Display these counts in the chips. |
| **Side Effect Fix** | Ensure `statusCounts` is invalidated on trip status changes. |

---

## M3 — updateStatus(DELAYED) without minutes

| Item | Detail |
|------|--------|
| **Location** | `trips.ts → updateStatus` |
| **Problem** | Setting status to `DELAYED` does not require `delayMinutes`. A trip can be marked DELAYED with no delay time — passengers receive a "delay" notification with 0 minutes. |
| **Side Effect** | Novu `passenger-trip-delayed` notification fires with `delayMinutes: 0`. Passengers are alarmed for no reason. |
| **Fix** | In `updateStatus`: if `newStatus === "DELAYED"`, require `delayMinutes > 0`. Zod schema: `z.number().int().min(1).optional()` becomes required when DELAYED. |
| **Side Effect Fix** | Update Novu payload to use actual `delayMinutes` field. |

---

## M4 — Delay concurrency double-shifts

| Item | Detail |
|------|--------|
| **Location** | `trips.delay` |
| **Problem** | Two concurrent calls to `trips.delay` both read `currentDelayMinutes`, both add `additionalMinutes`, both write back. The second write overwrites the first — delay total is wrong. |
| **Side Effect** | `departureDate` on the trip is shifted by only the last write's increment, not both. Passengers are told wrong departure time. |
| **Fix** | Use a `$queryRaw` `UPDATE ... SET "delayMinutes" = "delayMinutes" + $1 RETURNING *` atomic increment inside a transaction, or use Prisma's `increment` operation with a `FOR UPDATE` lock. |
| **Side Effect Fix** | After the atomic update, re-read `delayMinutes` from the DB and send the accurate value in the Novu notification. |

---

## M5 — boardedAt/completedAt never written

| Item | Detail |
|------|--------|
| **Location** | `schema.prisma Booking` |
| **Problem** | `Booking.boardedAt` and `completedAt` fields exist in the schema but are never set by any current flow. Check-in doesn't set `boardedAt`. Trip `ARRIVED` doesn't set `completedAt`. |
| **Side Effect** | No-show tracking is impossible (can't distinguish "checked in" from "not checked in"). Occupancy heatmaps have no data. Audit trail is incomplete. |
| **Fix** | In `operator-booking-service.ts → checkIn`: set `boardedAt = new Date()`. In `trips.ts → updateStatus` for `ARRIVED`: set `completedAt = new Date()` on all `CONFIRMED` bookings for the trip. |
| **Side Effect Fix** | Once `boardedAt` is set, no-show tracking is possible — add to operator analytics (future feature). |

---

## M6 — routeSnapshotJson may be double-encoded string

| Item | Detail |
|------|--------|
| **Location** | `trips.create` |
| **Problem** | `routeSnapshotJson: { ...route, version: 1 }` — if `route` includes a field that is already a JSON string (double-encoded), the snapshot stores `"{...}"` as a string instead of an object. |
| **Side Effect** | Search and booking views that parse `routeSnapshotJson` may fail to read route details, showing "Unknown" for cities. |
| **Fix** | Before saving, assert `typeof routeSnapshotJson === "object"` and strip any string-encoded JSON fields. Alternatively, select only the specific fields needed for the snapshot (origin terminal, dest terminal, waypoints, estimated minutes) rather than spreading the entire route object. |
| **Side Effect Fix** | Run a one-time data fix to identify trips where `routeSnapshotJson` is a string and re-parse them. |

---

## M7 — Assign bus matches seat by label only

| Item | Detail |
|------|--------|
| **Location** | `assignBus` |
| **Problem** | When reassigning a bus, existing `TripSeat` records are matched to new bus seats by seat label (e.g., "A1"). If two buses have different seat classes at the same label, the match is wrong. |
| **Side Effect** | A passenger who booked seat "A1 (VIP)" on Bus 1 is mapped to "A1 (Standard)" on Bus 2. Their booking shows wrong class. |
| **Fix** | When reassigning a bus with existing bookings, block the operation (as described in H7). When no bookings exist, delete and recreate all `TripSeat` rows from the new bus's layout — no label matching needed. |
| **Side Effect Fix** | None needed if the H7 block-on-booking is implemented. |

---

## M8 — Proportional refund remainder race

| Item | Detail |
|------|--------|
| **Location** | `cancellation-service.ts` |
| **Problem** | Multi-seat holds compute "last seat" remainder by counting cancelled bookings before their own cancel. Two concurrent cancels can both see `cancelledSoFar = 0`, both believe they are NOT the last seat, both use `standardBase` instead of the remainder amount. The total refunded ends up less than the original charge. |
| **Side Effect** | Passenger receives less refund than they paid. Operator receives more than the net. Accounting is unbalanced. |
| **Fix** | The hold group `FOR UPDATE` lock (already in place at line 80) serializes concurrent cancels within the same hold group. Verify this lock is correctly preventing the race. Add an assertion after the cancel: `sum(refunded) + sum(remaining confirmed farePaid) === totalCharge`. |
| **Side Effect Fix** | If assertion fails, write an ops alert and a `BALANCE_CORRECTION` ledger entry. |

---

## M9 — Bookings nuqs status/tripId no UI

| Item | Detail |
|------|--------|
| **Location** | `booking-search-params`, `operator-bookings-view.tsx` |
| **Problem** | `status` and `tripId` URL params are parsed but no UI controls exist to set them. Deep links with these params work server-side but users have no way to generate them from the UI. |
| **Side Effect** | Operators cannot filter bookings by status or trip from the dashboard. Must use exports or external tools. |
| **Fix** | Add a `status` multi-select filter chip bar to the bookings view. Add a `tripId` filter that auto-populates when navigating from the trip manifest. Wire both params to the `trpc.operator.getBookings` input. |
| **Side Effect Fix** | Update server prefetch in `bookings/page.tsx` to include status and tripId filters. |

---

## M10 — Trips prefetch q vs client debounce mismatch

| Item | Detail |
|------|--------|
| **Location** | `trips/page.tsx`, `operator-trips-view.tsx` |
| **Problem** | Server prefetch runs with the raw `q` URL param. Client uses a debounced value. On initial load, the server-fetched data (with `q`) and the client's immediate query (without debounce) use different query keys — the prefetch is not used. |
| **Side Effect** | Extra network request on initial load. Slight flicker as client overwrites server data. |
| **Fix** | Either (a) don't debounce `q` (use the raw nuqs value directly), or (b) use the same debounced key on both server and client by not prefetching `q`-specific data. Option (a) is simpler — the DB query with ILIKE is fast enough. |
| **Side Effect Fix** | No data correctness impact — visual flicker only. |

---

## M11 — Fleet/layouts overfetch seat graphs

| Item | Detail |
|------|--------|
| **Location** | `fleet.ts`, schedule wizard |
| **Problem** | `getBuses` includes full seat graph (all `TripSeat` records) even on the fleet list page where only bus metadata is needed. Schedule wizard also fetches full bus list with seats just to show a bus picker. |
| **Side Effect** | Large operators (50+ buses) experience slow page loads and high DB query time. |
| **Fix** | Add a `slim: true` option to `getBuses` that omits seats/layout details. Use slim on the fleet list and schedule wizard bus picker. Load full details only on bus detail view. |
| **Side Effect Fix** | Update all callers of `getBuses` to use the appropriate detail level. |

---

## M12 — Schedule create trips outside transaction

| Item | Detail |
|------|--------|
| **Location** | `schedules.create` |
| **Problem** | `schedules.create` creates the schedule record first, then calls `generateTripsForSchedule`. If trip generation fails (no preferred bus, DB error), the schedule is persisted without any trips — it's in an inconsistent state. |
| **Side Effect** | Schedule appears active but generates no trips. Operator doesn't know why. |
| **Fix** | Wrap schedule creation and initial trip generation in a `$transaction`. If trip generation fails, the transaction rolls back and the schedule is not created. Show a user-friendly error: "Schedule saved but no trips could be generated. Please assign a preferred bus." |
| **Side Effect Fix** | If the decision is to allow schedules without initial trips (operator will assign a bus later), don't wrap in a transaction — but add a health warning on the schedule. |

---

## M13 — Waypoint stopOrder can collide with dest order

| Item | Detail |
|------|--------|
| **Location** | `routes/schedules types` |
| **Problem** | Waypoints use `stopOrder` values set by the user. The destination stop is assigned `lastWaypointOrder + 1` in `trip-generator.ts`. If a waypoint is assigned `stopOrder = 99` and the destination gets `100`, ordering is correct — but if a waypoint gets `stopOrder` equal to the destination's computed value, stops appear out of order. |
| **Side Effect** | Passengers see incorrect route order in the seat map / trip detail. Check-in stop tracking is wrong. |
| **Fix** | Normalize stopOrder on save: origin = 0, waypoints = 1..N-1 (sequential, no gaps), destination = N. Reject any user-provided stopOrder that would collide with origin (0) or the computed destination. |
| **Side Effect Fix** | Run a one-time normalization migration on existing routes. |

---

## M14 — updateFare allows price 0

| Item | Detail |
|------|--------|
| **Location** | `schedules` schemas |
| **Problem** | `updateFare` Zod schema has `z.number().min(0)` while `createFare` has `z.number().min(1)`. Updating a fare to 0 creates a free trip — passengers can book for free. |
| **Side Effect** | Operator accidentally sets price to 0. All subsequent bookings are free. Revenue is 0. |
| **Fix** | Change `updateFare` schema to `z.number().min(1)` to match `createFare`. |
| **Side Effect Fix** | Add a confirmation dialog in the UI when lowering fare significantly (>50% reduction). |

---

## M15 — Retired schedule booked trips still sellable

| Item | Detail |
|------|--------|
| **Location** | `search + retire` |
| **Problem** | When a schedule is retired (`isActive: false`), existing future trips with `status: SCHEDULED` remain searchable. Passengers continue booking trips for a retired schedule. |
| **Side Effect** | Operator has retired a route but still receives new bookings. Cancelling all those bookings requires manual work. |
| **Fix** | When retiring a schedule: (a) cancel all future `SCHEDULED` trips via `cancelTripWithRefunds`, or (b) mark future trips `isVisible: false` and exclude them from search. Option (b) is safer (no mass refunds for already-sold seats — those trips still run). Product decision needed. |
| **Side Effect Fix** | Show a confirmation dialog: "Retiring this schedule will affect N future trips. Existing bookings will still be honored." |

---

## M16 — reconcile-payments fakes charge.success

| Item | Detail |
|------|--------|
| **Location** | `apps/web/app/api/cron/reconcile-payments/route.ts` |
| **Problem** | The reconcile cron may call `confirmFromPayment` by faking a `charge.success` event rather than calling Paystack's verify endpoint to get actual payment status. |
| **Side Effect** | Bookings are confirmed for payments that Paystack may have declined. Operator receives revenue for non-existent payments. |
| **Fix** | Call Paystack's `GET /transaction/verify/{reference}` endpoint. Only call `confirmFromPayment` if `data.status === "success"`. For failed payments, expire the hold and notify the passenger. |
| **Side Effect Fix** | Add a payment status audit log: every reconciliation run records which references were verified and what their status was. |

---

## M17 — Reveal bank with only OWNER + company:view

| Item | Detail |
|------|--------|
| **Location** | `operator.ts → revealBankAccount` |
| **Problem** | Revealing bank account details (decrypting the account number) requires only `OWNER` role + `company:view` permission — no step-up authentication (re-enter password, OTP, etc.). |
| **Side Effect** | Anyone with physical access to an OWNER's logged-in session can reveal bank details. |
| **Fix** | Add step-up auth: before revealing bank account, require the user to re-enter their password or an OTP. Use Better Auth's session management to mark the session as "elevated" for 5 minutes after step-up. |
| **Side Effect Fix** | `operator-settings-view.tsx`: Show a "Verify Identity" modal before revealing bank details. |

---

## M18 — Multi-seat Math.round remainder dust

| Item | Detail |
|------|--------|
| **Location** | `cancellation-service.ts`, `release-escrow` |
| **Problem** | Per-seat net is computed via `Math.round(operatorNetXOF / seatCount)`. The remainder (due to integer division) is assigned to the last seat. But if concurrent cancels happen, the remainder calculation (`isLastSeat`) uses the count of already-cancelled bookings — a race can assign the remainder to the wrong seat. |
| **Side Effect** | Total refunded/released ≠ total charged. Small amounts (usually < 10 XOF) are "lost" in the accounting. |
| **Fix** | Pre-compute per-seat amounts at checkout time and persist them in the `PricingSnapshot` (e.g., `perSeatNetXOF: number[]` array). Avoid runtime division. |
| **Side Effect Fix** | The hold group `FOR UPDATE` lock (already present) mitigates most races — the main fix is pre-computed amounts. |

---

## M19 — ActivityLog metadata often stringified

| Item | Detail |
|------|--------|
| **Location** | Staff activity logging |
| **Problem** | `ActivityLog.metadata` is stored as `JSON.stringify({...})` (a string) instead of a Prisma `Json` object. Reading the logs requires a double-parse. |
| **Side Effect** | Admin audit trail is unreadable without manual parsing. Log viewer UIs cannot display structured data. |
| **Fix** | Pass plain objects to Prisma's `Json` field: `metadata: { key: value }` (not `JSON.stringify`). Audit all `activityLog.create` calls. |
| **Side Effect Fix** | Run a one-time migration to re-parse existing stringified metadata into proper JSON. |

---

## M20 — Dual revenue parsers

| Item | Detail |
|------|--------|
| **Location** | `operator/lib/revenue-params.ts` vs `operator/lib/revenue-search-params.ts` |
| **Problem** | Two files exist with similar/duplicate revenue URL param definitions. One may be stale (not connected to any view). |
| **Side Effect** | Developers editing revenue params update the wrong file. Silent behavior change. |
| **Fix** | Identify the active file (the one imported by `operator-revenue-view.tsx`). Delete the unused one. Consolidate into a single `revenue-search-params.ts`. |
| **Side Effect Fix** | Update all imports. Run `pnpm biome check` to catch dead code. |

---

## M21 — FINANCE cannot read bookings

| Item | Detail |
|------|--------|
| **Location** | `ROLE_TEMPLATES` in `permissions.ts` |
| **Problem** | FINANCE role has `revenue:read`, `withdrawals:view`, `bookings:read` — wait, verify: does FINANCE have `bookings:read`? If not, FINANCE staff cannot see bookings, making it impossible to reconcile payments with booking records for disputes. |
| **Side Effect** | FINANCE staff must ask ADMIN/OWNER for booking details — delays dispute resolution. |
| **Fix** | Add `bookings:read` to `ROLE_TEMPLATES.FINANCE` (read-only, no cancel). |
| **Side Effect Fix** | Existing FINANCE staff must have their permissions updated (see H9 fix — template reset). |

---

## M22 — OPERATIONS lacks trips:cancel

| Item | Detail |
|------|--------|
| **Location** | `ROLE_TEMPLATES` in `permissions.ts` |
| **Problem** | OPERATIONS role does not have `trips:cancel`. Operations staff who manage departures cannot cancel a trip if needed — they must escalate to ADMIN/OWNER. This may be intentional (trip cancel triggers mass refunds — high-risk). |
| **Side Effect** | Operations bottleneck at ADMIN/OWNER for any trip cancellation. |
| **Fix** | Product decision: either grant `trips:cancel` to OPERATIONS with dual-approval requirement, or document explicitly that cancellations are ADMIN+OWNER only and add a clear message in the UI ("Contact your company admin to cancel this trip"). |
| **Side Effect Fix** | Update AGENTS.md / docs to document role capabilities. |

---

## M23 — Manifest mixes holds + confirmed

| Item | Detail |
|------|--------|
| **Location** | `trips.get / manifest drawer` |
| **Problem** | The trip manifest includes `PENDING_PAYMENT` (hold) bookings alongside `CONFIRMED` bookings. Operators may count hold bookings as confirmed passengers and over-prepare. |
| **Side Effect** | Operator thinks 30 seats are sold, but only 20 are confirmed — 10 are unpaid holds. Misaligned logistics (catering, vehicle selection). |
| **Fix** | Split the manifest into two sections: "Confirmed Passengers" and "Pending Holds". Show counts separately. Use visual distinction (full opacity vs dimmed) for hold bookings. |
| **Side Effect Fix** | Update `trips.get` to return `confirmedBookings` and `holdBookings` as separate arrays. |

---

## M24 — Soft-remove staff transferredAssignments: 0

| Item | Detail |
|------|--------|
| **Location** | `staff.ts → removeStaff` |
| **Problem** | `removeStaff` sets `transferredAssignments: 0` in the metadata — this field does not exist in the schema. It's dead code that does nothing. |
| **Side Effect** | No functional impact, but wastes a DB write and creates confusion for future developers. |
| **Fix** | Remove the dead `transferredAssignments` field from the `removeStaff` mutation. |
| **Side Effect Fix** | None. |

---

## M25 — Novu delay payloads use UTC

| Item | Detail |
|------|--------|
| **Location** | `trips.ts` Novu trigger for delays |
| **Problem** | Delay notifications send `departureDate.toISOString()` (UTC format) in the payload. Passengers see "10:00 GMT" instead of "10:00 Abidjan time." |
| **Side Effect** | Passengers misread their departure time. They may arrive at the wrong time. |
| **Fix** | Use `toLocaleString("en-US", { timeZone: "Africa/Abidjan" })` for all times in Novu payloads. Use `lib/timezone.ts` helpers. |
| **Side Effect Fix** | Check all other Novu triggers (`passenger-trip-cancelled`, `passenger-booking-confirmed`, etc.) for the same UTC issue. |

---

## M26 — Schedule UI date parse local browser

| Item | Detail |
|------|--------|
| **Location** | `schedule-search-params.ts` |
| **Problem** | Date defaults in nuqs parsers are computed at module load time using `new Date()` (local browser time). If a developer in UTC-5 loads the app, the "today" default is 5 hours behind Abidjan's "today." |
| **Side Effect** | Schedule date filter shows wrong default day in non-Abidjan timezones. Affects developers testing in different timezones and any user accessing from outside West Africa. |
| **Fix** | Compute defaults dynamically using `startOfAppCalendarDay(new Date())` from `lib/timezone.ts` (server-side on first render), or always use Abidjan date logic client-side. |
| **Side Effect Fix** | Check all other nuqs date defaults for the same issue. |

---

## M27 — getDashboardMetrics exposes bus counts without fleet:read

| Item | Detail |
|------|--------|
| **Location** | `operator.ts → getDashboardMetrics` |
| **Problem** | The overview dashboard queries total bus count and active bus count and returns them in the metrics object — without checking `fleet:read` permission. A SUPPORT staff member (without fleet:read) sees bus counts on the overview. |
| **Side Effect** | Minor information leak — bus count is low-sensitivity, but it violates the IAM model. |
| **Fix** | Either (a) move bus metrics to a separate procedure gated by `fleet:read`, or (b) return `null` for bus metrics when `fleet:read` is absent and hide the bus metric cards in the UI when `null`. |
| **Side Effect Fix** | `operator-dashboard-view.tsx`: conditionally render bus metric cards based on `fleet:read` permission. |

---

## M28 — Search resume offer staleness

| Item | Detail |
|------|--------|
| **Location** | `offer-card` + `createHold` |
| **Problem** | When a passenger searches, sees an offer (price), logs in, and resumes booking — the offer card may show a stale price from before login. The hold is created with the stale price. If the actual fare has changed since the search, the passenger pays the wrong amount. |
| **Side Effect** | Passenger books at wrong price. Operator receives wrong net. Platform commission is wrong. |
| **Fix** | On login resume (when `bookingOfferId` is in the URL): revalidate the offer by refetching the fare before creating the hold. Show "Price updated: X XOF → Y XOF" if the fare has changed. Require re-confirmation. |
| **Side Effect Fix** | `features/search/` offer card: add an `isStale` indicator when the fare was fetched more than 10 minutes ago. |
