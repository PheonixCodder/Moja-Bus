# Memory — Phase 4 Domain Features & Architecture Refactoring

Last updated: 2026-07-09

## What was built

- **Completed Phase 4 Audit Items (Missing Domain Features & Architecture)**, excluding the explicitly deferred Notifications System.
- **Database & Auth:** Added `reviews Review[]` relation to the `User` schema in `schema.prisma`.
- **Advanced Route & Trip Architecture:** 
  - Added `version: 1` versioning to `routeSnapshotJson` for trips generated in `trip-generator.ts`.
  - Added reconciliation logic to `trpc/routers/routes.ts` so edits on routes surface a warning if they affect unbooked future trips.
  - Implemented a `trips.create` TRPC mutation for ad-hoc trip creation.
  - Set Booking Hold expiry to 15 minutes in `booking-hold-service.ts`.
- **UI Monolith Refactoring:** Split the massive `operator-bookings-view.tsx` into targeted sub-components (`bookings-list.tsx`, `booking-row.tsx`, `booking-detail-drawer.tsx`, `check-in-badge.tsx`).
- **Seat Layout Builder:** Built a new `SeatLayoutBuilder` component using `@dnd-kit/core` for drag-and-drop seat layouts.
- **Seed Data Enhancement:** Updated `generateSeats` in `seed.ts` to automatically leave space for a `DRIVER_AREA` and `EMPTY_SPACE` aisles based on grid columns.

## Decisions made

- Notifications System is explicitly excluded from Phase 4 scope per user instruction.
- Addressed `operator-bookings-view.tsx` as the primary target for monolithic UI refactoring.
- Designed the `@dnd-kit/core` layout builder as a flexible drop-in replacement that provides a draggable reorder view.

## Problems solved

- Fixed strict null-check TypeScript errors in `trip-generator.ts` where `departureTime.split(":")` returned potentially undefined array elements, resolving the build failure for `api` and `web`.

## Current state

- Phase 4 is structurally and functionally complete.
- The `web` and `api` apps build and typecheck successfully.
- `app` (Expo Native App) has some persistent typecheck failures tied to the removal of the Better Auth `emailOtp` plugin from a prior phase, which is known and currently out of scope.

## Next session starts with

- Either test the new Seat Layout Builder UI and Trip Generation workflows, or proceed to scoping and executing the next phase (Phase 5).

## Open questions

- The `SeatLayoutBuilder` is implemented but needs to be formally wired into the `SeatLayoutTemplate` creation/editing flow when that is fully built out in the operator portal.
