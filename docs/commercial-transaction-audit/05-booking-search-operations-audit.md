# Seat holds, search, trips, schedules, and operations UI

## Seat/segment lifecycle

The hold service is one of the strongest areas. It validates duplicate selected seats, checks availability, locks the trip row, then rechecks overlapping segment bookings before creating pending bookings. Confirmation repeats the overlap defense. Availability evaluates segment overlap, so the same physical seat can be sold on non-overlapping legs.

### Gaps

- The UI does not reserve a seat at selection time; a selected seat can become held/sold before checkout. The server returns a conflict, but the dialog needs an explicit refresh/reselect recovery state.
- Holds last 15 minutes but no universal expiry worker was located. Expired bookings become unavailable only through query predicates until an action cleans state; incentives and groups can stay stale.
- Checkout commits `createHold` before calling wallet confirmation. If confirmation fails, there is no client compensation/release call; the resulting pending hold continues to reserve the selected seats and every frozen incentive. This is directly observable as credits disappearing from a later pending-booking/payment attempt because quote availability is `remainingXOF - reservedXOF`.
- The pending booking page does render a credits row, but its preview has the same self-reservation problem. It does not mean the UI lacks the component; it is fed `creditAppliedXOF = 0` because the quote treats the selected hold's own reserved lots as unavailable. Its subsequent refreeze repeats the incorrect ordering and can discard the reservation.
- `SeatAvailabilityService` returns `deck: 1` even while source seats include a `deck`; multi-deck layouts cannot be represented faithfully.
- The booking dialog requires login before checkout, but form code still includes guest/manual passages. This is confusing dead/legacy UI logic and conflicts with account-only hold/payment ownership.

## Search and checkout UX

```text
Search results -> booking dialog
  Seats -> [login redirect if no session] -> Checkout
  Checkout: passenger assignment + quote + instrument selection + payment choice
```

The search page server-prefetches query/data correctly, but the booking flow mixes message catalog strings with hard-coded English and direct path literals. Critical states that need explicit design/test coverage: stale price, stale quote, hold expiry during popup, provider success but confirmation pending, provider cancellation, failed wallet debit, booking conflict after seat selection, and a fully credit-covered checkout.

## Operator/admin surfaces

The requested booking, trip, promotion, campaign, and abuse pages are server shells that prefetch tRPC data and defer to views. Strengths are pagination/filter parameter modules and permission-gated router mutations. Weaknesses are operational: refund failure and reservation leak states have no dedicated queue or remediation UI; campaign performance is based on `FINALIZED` redemptions and can disagree with reserved/unreleased exposure; abuse events are logged but the inspected model contains no review owner/state/resolution metadata.

## UI consistency defects

| Area | Evidence | Impact |
|---|---|---|
| Localization | Booking flow literals such as “Book your trip”, “Complete payment”, “Payment Options”; dashboard pages use translations. | Mixed-language purchase and failure screens. |
| Locale navigation | Dialog builds `/search`, `/book/.../success`; wallet links use `/dashboard/wallet`. | Locale can be dropped after login/payment/navigation. |
| Responsive/data states | Page shells have loading fallbacks, but checkout has no explicit retry/refresh rendering for a seat conflict or post-payment confirmation delay. | User repeats a payment or assumes failed booking. |
| Ticket transport | Success route receives references/tokens in URL. | Sensitive booking capability leaks into history/logs. |

## Trip/schedule controls

Trip generation is cron-driven for active schedules with a preferred bus. The cancellation helper expires pending holds, marks the trip cancelled, and attempts refunds in one transaction; its failure behavior is P0. Any trip status change must define how it affects active holds, confirmed bookings, refunds, scheduled notifications, and future generated trips.
