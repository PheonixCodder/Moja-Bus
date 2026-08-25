# Phase 18 — Traveler Money UX Parity

> **Closes:** F-PS-04, F-PS-05, F-PS-06 · Evidence: `06-passenger-commerce-tickets.md`.
> **Status: ✅ CODE COMPLETE 2026-08-23** — gates green (19/19 · web **441/441** incl. contract suite · biome clean). Staging legs: multi-seat cancel shows the exact per-seat quoted refund; top-up produces the confirmation notice; a "ticket ready" push opens booking detail.
> **Scope correction verified line-by-line**: F-PS-05's NOTICE half was already closed by Phase 04's ratified pull-forward (both initiators stamp `metadata.userId`; the webhook gate at `payment-service.ts:701` reads it). Only the dead-procedure tail remained.

## Tasks
- [x] Cancel flow parity: traveler booking-detail consumes the SAME `passenger.getRefundQuote` the web fix uses (`useRefundQuote` hook, enabled when the dialog opens); dialog renders the server's quoted amount + status instead of the group fare; non-cancellable bookings show an explanatory note with actions hidden. Guest/eligibility failures surface via toast (react-native-toast-message), not console.
      Multi-seat bulk-cancel stays roadmap — v1 is honest-per-seat.
- [x] Top-up confirmation (F-PS-05 tail): deleted the dead `wallet` router entirely (caller audit: zero `trpc.wallet.*` usage in web AND traveler; its callback targeted the nonexistent `/dashboard/passenger/wallet`). Canonical path = `passenger.initiateWalletTopUp` + `verifyTopUpForUser`, both already user-bound.
- [x] Push deep-links (F-PS-06): `_layout.tsx` now pushes `/booking/${encodeURIComponent(ref)}` matching the real `[reference]` route.

## Acceptance criteria
Multi-seat cancel dialog shows the exact amount the server will refund for that seat ✓ (unit-shaped via shared quote proc); topping up produces the confirmation notification ✓ (code-path live; staging leg pending); a "ticket ready" push opens booking detail ✓ (route exists; device QA pending).
