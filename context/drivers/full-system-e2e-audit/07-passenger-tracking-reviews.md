# 07 — Passenger Tracking, Boarding Flags & Reviews Audit

> **Audit date:** 2026-08-22 · **Method:** read of trip-arrival lib, completeTrip arrival path, review submission router + schemas, traveler review/prompt/tracking screens and web review UI. Every claim cites `file:line`.
> **Scope:** boarding/completion flag writers · ARRIVED-triggered review requests · multi-criteria reviews (both surfaces) · live-tracking entry points · i18n leakage on these surfaces.

---

## Flow traces

### 1. Boarding & completion flags

- Writers of `checkedInAt`/`boardedAt`: `drivers.checkInPassenger` (scan), `manualCheckInPassenger`, `batchSyncCheckIns` (exact-token keyed). Duplicate scan → `alreadyBoarded`; cancelled/refund_pending/expired tickets rejected (`drivers.ts:1309-1413`). **Assignment-binding gap on all three → F-IN-01** (see 09-security file).
- `completedAt` writer: shared `finalizeTripArrival` stamps it on CONFIRMED bookings and fans out `passenger-review-request` per booking — called from driver `completeTrip` DEPARTED→ARRIVED guard (`drivers.ts:1549-1582`) and operator arrival path (`trips.ts:1291`) via `lib/trip-arrival.ts:17-24, 91-111`. Idempotent per trip+booking.
- **`booking.status === "COMPLETED"` is never written anywhere in the repo** (grep) — only `completedAt` is stamped (**F-PS-10**): the traveler's organic "Review Trip" button gates on the fictional status and never renders; web past-filter keys off CONFIRMED-with-past-departure instead.

### 2. Reviews flow

- **Submission** `passenger.submitReview` (`passenger.ts:381-491`): ownership validated; one-per-booking via unique bookingId; ratings ranges enforced; driverId/busId/tripId derived from booking.trip; **driver aggregates updated only from non-null driverRating** (Phase-13 semantics, `:431-454`); Novu `passenger-review-submitted`.
- **ARRIVED trigger**: implemented + idempotent (trace 1). Email CTA links to a nonexistent route → **F-PS-07**.
- **Traveler UX**: ReviewSheet with overall+driver+bus+punctuality+content; opened from launch prompt (P2-5 FIXED: `getPendingReviews` = completed-unreviewed w/ completedAt gate, per-booking dismissal persisted — `_layout.tsx:233`, `pending-review-prompt.tsx:26-68`, `passenger.ts:585-641`) and from a dead status-gated button (F-PS-10). No edit support.
- **Critical aggregation defect**: traveler sheet initializes sub-ratings to 5 and ALWAYS sends them → every casually-submitted review mass-inflates driver scores with implicit 5s, defeating exactly the scale-mixing rule Phase-13 wrote (**F-PS-08**). Web correctly omits unset sub-ratings.
- **Web input**: P3-7 FIXED — optional "Rate driver" 5-star control with clear action in Activity tab (`booking-details.tsx:799-839`; `passenger-bookings-view.tsx:50, 185-192`). Web reviews cover seats[0] only.
- **My-reviews**: traveler `/reviews` lists rating/content/operator-response block (`reviews.tsx:98-136`; backed by getUserReviews selecting response fields). Web has NO my-reviews listing page.
- **Server-side gap**: no completed-trip requirement at submit — API clients can rate future trips (**F-PS-09**).

### 3. Live-tracking entry points (18.4 state)

- Traveler booking-detail "Track Live Bus in Realtime": shown only for CONFIRMED AND compile-time gated behind `EXPO_PUBLIC_LIVE_TRACKING_ENABLED === "true"` (default OFF, `.env.example` documents "set true only after WS consumer ships") — misleading pre-departure CTA is moot while gated.
- Tracking screen today = honest "coming soon" status card displaying the passed reference; no simulation, no map consumer (`app/tracking/[tripId].tsx:6-56`). The old simulated map component exists but nothing imports it.
- Latent wrong-ID wiring preserved behind the flag: passes `seats[0].bookingId || bookingReference` into the `[tripId]` slot (`booking-detail.tsx:421-434`) — must resolve real tripId before enabling (F-TM-15).
- Web passenger surface: no tracking affordance anywhere (consistent with zero real consumers platform-wide).
- Operator-side consumption is the 10 s `getLivePositions` poll into a simulated radar view (see 02/05 files).

### 4. i18n leakage on money/review moments (F-PS-12)

Web cancel dialog hardcodes French literals beside adjacent `t()` usage; traveler tracking screen fully French-hardcoded; traveler ReviewSheet + PendingReviewPrompt fully English-hardcoded. Locale key-parity itself is clean in both apps' booking namespaces (script-verified 149=149 and 182=182 keys) — the leak is hardcoded literals bypassing i18n entirely.

## Verified-working strengths

1. Review-request fan-out idempotent per trip+booking with completedAt as source of truth.
2. One-per-booking invariant enforced by DB unique constraint, not just app logic.
3. Phase-13 driver-aggregate semantics correct server-side (only explicit driverRating counts).
4. P2-5 launch prompt shipped end-to-end with persistent dismissal.
5. Tracking de-simulation honest: feature-flag OFF by default, screen admits "coming soon", old simulator orphaned.

## Findings

| ID | Sev | Finding | Evidence | Fix sketch |
|---|---|---|---|---|
| F-PS-07 | P2 | Review-request EMAIL CTA links to nonexistent `/dashboard/tickets/{ref}/review`; bypasses getAppOrigin() locale-prefix pattern used by ticket-share | workflows/operator/review-request.ts:17 vs actual flat tickets page | Link to `/dashboard/bookings?tab=past` via getAppOrigin() |
| F-PS-08 | P2 | Traveler review sheet always sends implicit 5s for driver/bus/punctuality → mass-inflation of driver aggregates, defeating Phase-13 explicit-only semantics (web correct by contrast) | review-sheet.tsx:31-49 vs passenger-bookings-view.tsx:185-192; passenger.ts:435-454 | Default sub-ratings null; omit nulls from payload |
| F-PS-09 | P2 | submitReview has no completed-trip validation — API can rate future trips, skewing driver + operator public ratings before travel | passenger.ts:384-413 vs :594-603 definition of reviewable | Reject unless completedAt != null / trip ARRIVED |
| F-PS-10 | P3 | Booking status COMPLETED never written anywhere; traveler organic "Review Trip" entry is dead code; partial fiction in status taxonomy | repo-wide grep; trip-arrival.ts:17-24; booking-detail.tsx:133, 467-475 | Stamp COMPLETED in finalizeTripArrival or gate on completedAt |
| F-PS-12 | P3 | Hardcoded FR/EN literals bypass clean i18n on cancel dialog / tracking screen / review sheet / review prompt — mixed-language UI on money+review moments | passenger-tickets-view.tsx:304-313; tracking/[tripId].tsx:29-46; review-sheet.tsx:77-155; pending-review-prompt.tsx:89-115 | Move strings to locales (key parity already verified) |

*(F-PS-01…06, 11, 13–15 live in 06-passenger-commerce-tickets.md; scanner mismatch F-PS-03 also there.)*

## Prior-findings scorecard (this domain)

| Prior ID | State |
|---|---|
| P2-5 launch-time review prompt | ✅ FIXED |
| P3-7 web driverRating input | ✅ FIXED |
| P2-5 dependency on broken push delivery | ✅ moot post-16.3 subscriber unification (pending notifications-file confirmation) |

**Severity roll-up:** P2×3 · P3×2.
