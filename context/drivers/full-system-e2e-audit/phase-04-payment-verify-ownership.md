# Phase 04 — Payment Verification Ownership

> **Closes:** F-PS-01 (P1) · Evidence: `06-passenger-commerce-tickets.md` trace 1 + F-PS-01.
> `booking.ts:191-206` (`verifyPayment` — no `assertHoldOwnedByUser`, unlike `:167-168/:217-218/:236-237/:308-309/:341-342`) → `payment-service.ts:208-211` (resolves ANY payment by reference) → `booking-confirmation-service.ts:128-140` (stamps caller's userId).

## Objective
Only the owner of a hold can drive its payment verification/confirmation through tRPC. A leaked or guessed `paystackReference` must never let another account confirm someone else's hold onto their own user record.

## Tasks
- [x] In `booking.verifyPayment`: resolve the holdGroup from the reference, `assertHoldOwnedByUser(holdGroup, ctx.user.id)` before `verifyAndConfirm`.
- [x] Keep the webhook/system path able to confirm without a user (userId stays undefined there) — separate the internal entry from the user-facing mutation.
- [x] Ensure `confirmFromPayment` stamps `userId` ONLY on the owner-driven path.
- [x] Tests: user B verifying user A's reference → error; bookings remain A's; webhook path still confirms unowned (guest) holds.

> **Executed 2026-08-23** (code complete; typecheck clean on touched files + 383/383 web tests green). Rulings: FORBIDDEN denial · service-level split · rescue attribution fixed beyond phase text (`rescueOrphanedPayment` now always credits `holdGroup.userId`; caller-precedence that diverted expired-hold funds to the caller's wallet removed) · F-PS-13 binding half pulled forward (`verifyTopUpForUser`, userId stamped at both top-up initiation sites — timing-safe webhook compare stays in Phase 32). Webhook handler left calling `confirmFromPayment` directly (already userId-less); routing it through `verifyAndConfirmSystem` would have added a redundant Paystack verify per event. Staging probes pending per checklist.

## Acceptance criteria
Repro from the audit now fails closed; legitimate owner + webhook flows unchanged.

## Verification
Staging: attempt cross-user verify via tRPC client → FORBIDDEN/NOT_FOUND; owner checkout still completes.
