# Phase 3 — Schedule & Inventory Integrity

**Priority:** P0 — Block Release  
**Issues:** C11, H12, H13, H19, H22  
**Rationale:** These issues cause incorrect trip inventory — duplicate departures, stale trips, and schedules that stop generating trips silently. Passengers can book ghost trips that will never run, or be denied bookings on valid trips that appear full or missing.

---

## C11 — MODIFIED exceptions / calendar edits leave stale trips

### What Is Wrong
When an operator:
- Adds a `MODIFIED` exception to a schedule (changing the departure time on a specific day), the generator creates a new trip at the override time — but the old trip at the original time is **not cancelled or removed**.
- Changes `departureTime` via `updateBasic` on a schedule, future trips keep the old departure time.
- Updates `calendar` days (e.g., removes Wednesday), existing future trips on Wednesday are not cancelled.

This results in:
- Two trips on the same route on the same day at different times.
- Passengers booking the "ghost" trip that no longer matches the operator's actual schedule.
- Search results showing stale times.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `trpc/routers/search.ts` | Returns both the old and new trip for the same day. Passengers book the wrong one. |
| `operator-trips-view.tsx` | Operator sees duplicate trips, no indication which one is "correct." |
| `operator-schedules-view.tsx` | Exception drawer shows the MODIFIED exception as applied, but no feedback that old trips still exist. |
| `release-escrow cron` | Both trips reach `ARRIVED` if both are operated — escrow released twice (if the operator actually ran both). If only one ran, the other's bookings are stranded. |
| `trip-generator.ts` | On next cron run, the old-time trip already exists in `existingKeys`, so no duplicate is added. But the key is based on `departureDate` (the timestamp) — if the override changes the timestamp by even 1 minute, both timestamps exist in the DB. |
| Passenger notifications | Passengers on the old trip get a departure time that the operator has changed. |
| `operator-bookings-view.tsx` | Bookings appear on both trips — confusing for operators checking in passengers. |

### How to Fix the Issue
1. Create a `reconcileFutureTrips(scheduleId, tx)` shared helper that:
   - Loads the schedule's current `calendar`, `departureTime`, and `exceptions`.
   - Computes all valid future departure timestamps using `getCandidateDepartureDates`.
   - Queries all future trips for this schedule with `status IN (SCHEDULED, DELAYED, BOARDING)`.
   - Cancels (via `cancelTripWithRefunds`) any trip whose `departureDate` is not in the valid set.
   - Returns the count of cancelled / retained trips.
2. Call `reconcileFutureTrips` after:
   - `schedules.addException` (type `MODIFIED` or `CANCELLED`)
   - `schedules.removeException`
   - `schedules.updateCalendar`
   - `schedules.updateBasic` (when `departureTime` changes)
3. For MODIFIED exceptions specifically, after reconcile, run `generateTripsForSchedule` to create the new-time trip.

### How to Fix Each Side Effect
- **Search:** Once stale trips are cancelled, they are excluded from search results (search filters by `status: "SCHEDULED"`).
- **Operator trips view:** Show a "Reconciling..." loading state when a schedule change triggers reconciliation. After completion, the trip list refreshes.
- **Release-escrow:** Cancelled trips with CONFIRMED bookings will have refunds processed by `cancelTripWithRefunds` during reconcile — no extra work needed.
- **Passenger notifications:** `cancelTripWithRefunds` already sends `passenger-trip-cancelled` Novu notification — passengers are informed automatically.

---

## H12 — Fare uniqueness blocks date-windowed prices; deactivate can remove last full-route fare

### What Is Wrong
The `Fare` model in `schema.prisma` has a unique constraint that prevents two fares with the same `(scheduleId, fareClass, isBaseRoute)` from coexisting. This makes it impossible to create promotional fares with `validFrom`/`validUntil` windows alongside the standard fare.

Additionally, `schedules.ts → deactivateFare` does not check whether the fare being deactivated is the only active full-route fare for the schedule. Deactivating it makes the schedule "unsellable" — search finds no valid fare, so the route disappears from results even though trips exist.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `trpc/routers/search.ts` | Trip fare lookup fails to find any active fare — trip is excluded from search results even though seats are available. |
| `operator-schedules-view.tsx` (fare management) | Operator adds a promo fare, receives a unique constraint violation (P2002). No user-friendly error message. The promo cannot be applied. |
| `apps/web/features/payments` | Checkout uses the fare from the trip snapshot. If no fare exists at booking time, checkout fails. |
| `operator-revenue-view.tsx` | Revenue shows 0 for the date range after the last fare was deactivated — trips exist but no one can book them. |

### How to Fix the Issue
1. **Schema change:** Remove or relax the unique constraint on `Fare`. Replace it with an application-level overlap check:
   - For a new fare on `(scheduleId, fareClass)`, ensure no other active fare for the same class has an overlapping `(validFrom, validUntil)` window.
   - `NULL` `validFrom`/`validUntil` means "always valid" — enforce that only one "always valid" fare can exist per `(scheduleId, fareClass)`.
2. **deactivateFare guard:** Before deactivating, count active fares for the schedule where `isBaseRoute = true`. If count is 1, block deactivation with error: "Cannot deactivate the only active fare for this schedule. Add a replacement fare first."
3. Migration: `pnpm prisma migrate dev --name relax-fare-unique-add-overlap-check`

### How to Fix Each Side Effect
- **Search:** Once overlapping fares are supported, search can pick the correct fare for the booking date. Update `search.ts` fare lookup to filter by `validFrom <= bookingDate <= validUntil`.
- **Operator schedules view:** Show a conflict error when a new fare overlaps with an existing one, with details on the conflicting dates.
- **Payments checkout:** Fare selection at checkout should use the fare valid at the trip's `departureDate` — no change to checkout if the search fare lookup is fixed.

---

## H13 — Preferred bus inactive still selected by cron; regenerate override not persisted

### What Is Wrong
When an operator sets a bus to `MAINTENANCE` or `RETIRED` status via `fleet.ts → updateBus`, the schedule's `preferredBusId` is not cleared. On the next cron run (`generate-trips`), the generator calls `bus.findFirst({ where: { id: preferredBusId, status: "ACTIVE" } })` — this returns `null`. The generator then clears `preferredBusId` (line 62–66 of `trip-generator.ts`) and throws an error for that schedule. **The schedule silently stops generating trips.**

Additionally, when an operator calls `schedules.regenerateTrips` with a `busIdOverride`, the override is used for one run only. Future cron runs still use `preferredBusId` (now `null` after the error above), causing continued failures.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `apps/web/app/api/cron/generate-trips` | The cron fails for the affected schedule, logs an error, and moves on. No operator notification. Trips stop being created for the next 14 days. |
| `operator-schedules-view.tsx` | Schedule still shows as `ACTIVE`. No health warning. Operator has no idea trips stopped generating. |
| `operator-trips-view.tsx` | Trip list becomes empty as existing trips are operated and no new ones are created. |
| Search | Route disappears from search results after the last pre-generated trip date passes. |
| Passenger UX | Route suddenly "unavailable" with no explanation. |

### How to Fix the Issue
1. In `fleet.ts → updateBus`: when status changes to anything other than `ACTIVE`, run:
   ```ts
   await ctx.prisma.schedule.updateMany({
     where: { preferredBusId: busId, companyId: ctx.companyId },
     data: { preferredBusId: null },
   });
   ```
2. Show a warning in the response: "This bus was the preferred vehicle for N schedule(s). Those schedules now have no preferred bus and will stop generating trips."
3. In `schedules.regenerateTrips`: persist the `busIdOverride` as `preferredBusId` on the schedule if a `persist: true` flag is passed (or always persist if no current preferred bus exists).
4. In `operator-schedules-view.tsx`: show a health badge "⚠️ No preferred bus — trips will not generate" on schedules where `preferredBusId = null`.

### How to Fix Each Side Effect
- **generate-trips cron:** Add an alert/metric when a schedule fails due to missing preferred bus — send an ops notification or write to a health table.
- **operator-schedules-view.tsx:** Health badge is the primary fix (see above).
- **Search:** Once trips resume generating after the operator assigns a new preferred bus, the route reappears. No search code change.

---

## H19 — Exception ServiceException no unique (scheduleId, date); removeException incomplete

### What Is Wrong
`packages/db/prisma/schema.prisma` `ServiceException` model does not have `@@unique([scheduleId, date])`. The application does an app-level duplicate check in `schedules.ts → addException`, but under concurrent requests, two exceptions for the same `(scheduleId, date)` can be created.

Additionally, `schedules.ts → removeException` deletes the exception row but does **not** call `reconcileFutureTrips` — if a `MODIFIED` or `CANCELLED` exception is removed, the trips created for it persist even though the exception no longer exists.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `trip-generator.ts` | On the next cron run, the generator processes two `MODIFIED` exceptions for the same date. It may create two override-time trips (if timestamps differ by a second due to race). |
| `operator-schedules-view.tsx` | Exception list shows duplicate entries for the same date. UX is confusing. |
| `release-escrow cron` | Both exception trips may reach `ARRIVED` and trigger dual escrow release. |
| Search | Two trips for the same route on the same day — both visible to passengers. |
| Remove exception | Removing a `CANCELLED` exception should re-enable the trip for that day. Without reconcile, the day stays empty (no trip is generated). |
| Remove exception | Removing a `MODIFIED` exception should restore the original departure time. Without reconcile, the override-time trip persists. |

### How to Fix the Issue
1. Add `@@unique([scheduleId, date])` to `ServiceException` in `schema.prisma`.
2. Migration: `pnpm prisma migrate dev --name add-service-exception-unique`
3. In `schedules.ts → addException`: catch `P2002` and return a user-friendly error: "An exception for this date already exists. Remove it first."
4. In `schedules.ts → removeException`: after deleting the exception, call `reconcileFutureTrips(scheduleId, tx)` to cancel/regenerate trips for the affected date.

### How to Fix Each Side Effect
- **Operator UI:** After remove, invalidate the exceptions list and trips list queries so the UI reflects the reconciled state.
- **Search / escrow:** Reconcile ensures stale trips are cancelled (with refunds) before they appear in search or trigger escrow.

---

## H22 — Partial calendar update can clear all weekdays

### What Is Wrong
`trpc/routers/schedules.ts → updateCalendar` accepts a partial `ScheduleCalendar` payload. The Zod schema (`updateCalendarSchema`) validates that **the incoming payload** has at least one `true` day. However, if the existing calendar has Monday–Friday enabled and the update only sets `{ monday: false }`, the merge in the DB will not zero all days — only Monday becomes false. **This part is fine.**

The actual bug is: `updateCalendar` does a `prisma.scheduleCalendar.update` with only the fields present in the input. If a future refactor changes this to `upsert` or `create`, or if the merge logic is wrong, the result could zero all days. More importantly, the validation only checks the input, not the **result** of the merge. An operator who sends `{ tuesday: false }` when `monday` was the only true day would pass validation (the input has... wait, `tuesday: false` alone would fail the schema's "at least one true" check).

**Real verified issue:** The schema `updateCalendarSchema` uses `z.object({ monday: z.boolean().optional(), ... }).refine(data => Object.values(data).some(Boolean))`. This refine only applies when those keys are present. An empty `{}` payload passes the refine because `Object.values({})` is `[]` and `.some(Boolean)` returns `false` — but the `refine` returns `true` for an empty object because... let's clarify: `[].some(Boolean)` returns `false`, so `refine` returns `false` → validation fails for `{}`. But a payload `{ monday: false }` alone: `[false].some(Boolean)` = `false` → refine returns `false` → validation fails. This seems correct.

**The real remaining bug:** If `validFrom` and `validUntil` are updated without re-checking the merged calendar still has operating days within the new window, a schedule could be active with zero operating dates in the valid range.

### Side Effects Across the App
| Surface | Side Effect |
|---------|-------------|
| `trip-generator.ts` | `getCandidateDepartureDates` returns empty array — no trips generated for the next 14 days. Schedule silently stops generating trips. |
| `operator-schedules-view.tsx` | Calendar shows the updated days. No health warning about empty generation window. |
| Search | Route disappears as pre-generated trips are operated. |
| `release-escrow cron` | Existing trips complete normally — only future generation is affected. |

### How to Fix the Issue
1. After applying a `updateCalendar` update, load the merged calendar from DB and validate that at least one day in `[monday...sunday]` is `true`.
2. Validate that the `validFrom`–`validUntil` window contains at least one occurrence of an enabled weekday.
3. If either check fails, rollback the update with a user-friendly error.
4. Add the same merged-calendar validation in `updateBasic` when `validFrom`/`validUntil` are changed.

### How to Fix Each Side Effect
- **trip-generator:** Once the validation is in place, the generator will always have at least one active day to work with.
- **operator-schedules-view.tsx:** Show a health warning if the next generation window would produce zero trips (compute client-side using the schedule's calendar + exceptions).
