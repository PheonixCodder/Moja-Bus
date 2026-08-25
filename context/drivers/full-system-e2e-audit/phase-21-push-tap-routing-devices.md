# Phase 21 — Push Tap-Routing & Device Registry

> **Closes:** F-NF-05, F-NF-06 (both P2) · Evidence: `08-notifications-novu-outbox.md` findings.
> **Status: ✅ CODE COMPLETE 2026-08-23** — gates green (19/19 · web **445/445** · driver-app 10 · schemas 86). Staging leg: the D8 device QA matrix (driver-only / passenger-only / dual-app / two devices) on real Expo pushes.

## Objective
Tapping a notification opens the right screen on the right device, every time, for both apps a user may hold.

## Tasks
- [x] **Traveler-audience overrides (11 workflows)** — every existing push step now returns `overrides.expo.data` with `type` strings matching the traveler handler map verbatim: booking-confirmed / booking-refunded / hold-created / review-request / review-submitted / trip-cancelled / trip-delayed / trip-gate-updated / wallet-low-balance / wallet-topup (+ trip-boarding). Reference-bearing types include `bookingReference` so taps deep-link to `/booking/[reference]`.
      Three workflows intentionally stay override-less because the traveler map has no route for them: campaign-starting, promo-incentives ×3, profile-updated (follow-up when routes exist).
- [x] **Driver-side push steps ADDED** (these workflows previously had NO push step at all): driver-offer-received → `driver-offer-received`; countered → `offer-counter`; expiring-soon → `offer-expiring`; expired → `offer-expired`; trip-assigned → `trip-assigned`; unassigned → `trip-unassigned`; dispatch-urgent → **new `dispatch-urgent` case added to the driver handler** routing to /(tabs)/trips. All fr-first copy reusing each payload's fields; every override carries its offerId/tripId.
- [x] Deliberately excluded: marketplace featured/suspended, license-status, roster-removed pushes (no time-criticality); admin pushes (web inbox only).
- [x] `registerPushToken` (F-NF-06) switched from REPLACE (`credentials.update`) to **APPEND** (`credentials.append`) — driver + traveler apps share one user.id subscriber, and replace-semantics meant whichever app registered last killed the other's push forever. `platform` input remains validated-but-informational (Novu's Expo credential has no per-token platform field — documented).

## Acceptance criteria
Every mapped type arrives intact in Expo push `data` on staging devices; dual-app users keep working notifications on both apps. *(Device matrix pending staging.)*
