# Phase 33 — Booking Taxonomy & Guest Strategy

> **Closes:** F-PS-10, F-PS-11, F-PS-16 · Evidence: `06-passenger-commerce-tickets.md` / `07-passenger-tracking-reviews.md`.
> `booking.status COMPLETED` written nowhere — traveler's organic review entry dead (`booking-detail.tsx:133/:467-475`, only `completedAt` stamped at `trip-arrival.ts:17-24`); guest capability dead at creation yet paid for globally (unbounded in-memory claim scan, `booking-read-service.ts:78-100`); rebooking "SMS" is a console.log stub presented as notified (`rebooking-notifier.ts:30-34`).

## Decision blocks
- **Taxonomy:** either stamp `status:"COMPLETED"` in `finalizeTripArrival`'s updateMany, or change traveler gates to `completedAt != null`. Recommend stamping (makes status taxonomy honest everywhere incl. badges).
- **Guest strategy:** recommend adding a `passengerPhone` index + phone-equality predicate now, and scheduling real guest checkout as roadmap-or-drop.

## Tasks
- [ ] Execute taxonomy decision; align web badges/lists + traveler review button to the single source.
- [ ] Guest claim query: indexed + predicate-bounded; stop mutating ownership as a read side effect OR make claim explicit — pick and document.
- [ ] Rebooking notification routed through the outbox like every passenger notice (+ contract test).

## Acceptance criteria
One truthful definition of "completed" platform-wide; dashboard load no longer scans all unlinked bookings; rebooked passengers actually get notified.

## Dependencies
Phase 07 harness (contract test), Phase 19 (review gating shares the completed semantics decision — sequence after 19).
