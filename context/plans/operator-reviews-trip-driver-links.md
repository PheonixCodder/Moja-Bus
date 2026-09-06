# Plan — Operator Reviews ↔ Trip / Driver Links

Status: **IMPLEMENTED — ready for manual QA**  
Last updated: 2026-09-06  
Related surfaces: `reviews/page.tsx`, `operator-reviews-view.tsx`, `operator.listReviews`, `trips?manifest=`, `bookings?detail=`, `drivers/[id]`

---

## What we are building

Enrich Operator **Reviews** inbox cards so each review shows **trip context** (corridor, full departure datetime), **booking reference** (linked), and **full live trip crew** (primary, relief, conductor), with permission-gated deep-links into existing surfaces: trip manifest (`/trips?manifest=<tripId>`), booking detail (`/bookings?detail=<bookingId>`), and driver passport (`/drivers/[id]`). No new pages, no schema migration. **This phase: reviews cards only** — not the driver passport Reviews tab.

---

## Language we agreed on

- **Review**: A `Review` row tied to one completed `Booking` (1:1 via `bookingId`), with denormalized `tripId` / `driverId` / `busId` written at submit time.
- **Trip context**: The concrete departure (`Trip`), not the reusable schedule/route template.
- **Crew**: Primary driver, optional relief driver, optional conductor (operator staff). Conductors are staff, not `DriverProfile`.
- **Manifest link**: `/trips?manifest=<tripId>` opens existing `ManifestDrawer`.
- **Driver link**: `/drivers/[id]` passport page.
- **Booking link**: `/bookings?detail=<bookingId>` opens existing `BookingDetailDrawer`.

---

## Decisions made

| # | Decision | Resolved as |
|---|----------|-------------|
| D1 | Surfaces | Reviews inbox cards only this phase |
| D2 | New pages | None — reuse trips/bookings/drivers |
| D3 | API | Extend `operator.listReviews`; include live `Review.trip` crew + booking ref + snapshot for corridor fallback |
| D4 | Corridor label | Schedule→route cities first; **fallback** to `routeSnapshotJson` |
| D5 | Trip CTA | Link to `trips?manifest={tripId}` |
| D6 | Driver CTA | Primary + relief names link to `drivers/[id]` when permitted |
| D7 | Conductor | Name only (no staff detail route) |
| D8 | Permissions | Text always; links need `trips:read` / `drivers:read` / `bookings:read` |
| D9 | Crew display | **Full crew**; missing primary → muted “No driver assigned” |
| D10 | Booking ref | **Show + link** via `bookings?detail={bookingId}` |
| D11 | i18n | Move hard-coded Driver/Bus/Punctuality labels into en/fr |
| D12 | Schema / backfill | No migration; no historical backfill |
| D13 | Crew identity | **Live trip** for crew row; rating chips still use review’s stored driver/bus ratings |

---

## Assumptions

1. Traveler `submitReview` path unchanged — already writes `tripId` / `driverId` / `busId`.
2. If `Review.trip` is null (deleted), crew row falls back to denormalized `Review.driver` when present; otherwise “No driver assigned”.
3. Locale-aware `Link` patterns match other operator dashboard pages.
4. Departure display uses a fuller datetime than today’s `MMM d` (e.g. `MMM d, yyyy · HH:mm` or existing operator trip formatting helper if one exists).
5. Driver-detail Reviews tab enrichment is a later follow-up, not this phase.

---

## How to build it

1. **API** — Update `operator.listReviews`:
   - Include `trip` on the review: `id`, `departureDate`, `routeSnapshotJson`, `driver` (+ user name), `reliefDriver` (+ user name), `conductorStaff` (+ user name), `bus` (plate/name)
   - Ensure `booking` select includes `id`, `bookingReference`
   - Keep existing `driver` / `bus` includes for rating chips
2. **Helper** — Pure corridor-label helper: schedule route cities → else snapshot JSON → else em dash / “—”
3. **UI** — `operator-reviews-view.tsx`:
   - Meta: corridor · full departure · booking ref (link if `bookings:read`)
   - Crew row from live trip: primary, relief, conductor
   - “View trip” CTA if `tripId` + `trips:read`
   - Driver/relief links if `drivers:read`
   - Respond flow unchanged
4. **Permissions** — `useStaffPermissions` for the three link types
5. **i18n** — en + fr for new strings and existing hard-coded chips
6. **Verify** — With/without crew; each perm off → text only; manifest + booking drawers open from deep links
7. **`graphify update .`** after code changes

---

## Out of scope (this phase)

- Driver passport Reviews tab enrichment
- `/trips/[id]` or `/reviews/[id]` pages
- Conductor detail page
- Review submit / Novu changes
- Schema migration or backfill
- Admin trip-audit parity
- Reviews list filter/search

---

## Acceptance criteria

- [x] Card shows corridor + full trip datetime (not date-only ambiguity)
- [x] Corridor survives missing schedule via `routeSnapshotJson` fallback
- [x] Full crew from live trip; missing primary is explicit
- [x] Conductor name when assigned
- [x] `trips:read` → View trip opens manifest; without perm → no trip link
- [x] `drivers:read` → primary/relief link to passport; without perm → text
- [x] Booking ref shown; `bookings:read` → opens detail drawer; without perm → text
- [x] en + fr for new/hard-coded labels
- [x] Respond-to-review unchanged
- [x] Typecheck green on touched packages
- [ ] Manual QA in browser (with/without crew, perm combinations, deep links)

---

## Files touched

- `apps/web/trpc/routers/operator.ts` (`listReviews`)
- `apps/web/features/operator/views/operator-reviews-view.tsx`
- `apps/web/features/operator/lib/reviews/corridor-label.ts`
- `apps/web/features/operator/lib/reviews/__tests__/corridor-label.test.ts`
- `apps/web/features/operator/messages/en.json` + `fr.json`
- `apps/web/package.json` (test script entry)

No Prisma migration.
