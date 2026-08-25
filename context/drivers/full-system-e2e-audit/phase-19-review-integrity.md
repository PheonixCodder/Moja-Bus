# Phase 19 — Review Integrity

> **Closes:** F-PS-07, F-PS-08, F-PS-09 · Evidence: `07-passenger-tracking-reviews.md`.
> **Status: ✅ CODE COMPLETE 2026-08-23** — gates green (19/19 · web **441/441** incl. the new review-request contract case · biome clean). Staging legs: submit a review → email CTA lands on bookings?tab=past; lazy submission (no sub-ratings touched) leaves driver aggregates unchanged; API attempt on a future trip → PRECONDITION_FAILED.

## Objective
Reviews are honest signals: only completed trips are rateable, only explicit sub-ratings count, and the request email lands somewhere real.

## Tasks
- [x] Review-request CTA → `${getAppOrigin()}/dashboard/bookings?tab=past` (replacing hardcoded host + nonexistent `/dashboard/tickets/{ref}/review`); in-app redirect aligned to the same screen. Payload schema extracted (`passengerReviewRequestPayloadSchema`, municipality fields declared) and added to the contract harness — this workflow is now regression-guarded like its Phase 07/08 siblings.
- [x] Traveler ReviewSheet explicit-only (F-PS-08): overall starts 0 with submit disabled until chosen; sub-ratings start null and their keys are OMITTED from the payload (never implicit 5s — sending explicit null would fail the Zod contract). Reset mirrors. Matches web precedent exactly.
- [x] `submitReview` completed-trip guard (F-PS-09): rejects PRECONDITION_FAILED unless `booking.completedAt != null` — the same predicate as `getPendingReviews`, one source of truth. Documented consequence: pre-tracking legacy trips (null completedAt) stay unreviewable, consistently.
- [x] Dependency note satisfied: Phase 08 landed first, so these requests reach real subscribers.

## Acceptance criteria
Driver averages move only on explicit ratings ✓ (client omits unset; server aggregates non-null only — both sides enforced); review email CTA opens the app ✓ (URL now resolves to a real route; click-through QA pending staging).
