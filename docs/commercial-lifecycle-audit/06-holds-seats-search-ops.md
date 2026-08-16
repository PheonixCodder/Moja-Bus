# 06 — Holds, seats, search, booking ops

## E2E: search → seat → hold → pay

1. **Search** — nuqs params; `search.search` + `cheapestByDate`; geo resolve; segment fare match; occupancy; page size 15.
2. **Offer** — `{tripId}_{originStopId}_{destStopId}` → dialog loads trip details + seat map.
3. **Availability** — seats occupied if overlapping CONFIRMED or non-expired PENDING_PAYMENT (`segmentsOverlap`).
4. **Auth** — guests → login with offer + seats; `createHold` protected.
5. **Checkout** — quote + schedule voucher filter; createHold 15m; freeze discounts.
6. **Pay** — Paystack or wallet/zero-cash; success → `/book/[offerId]/success`.
7. **Pending pay** — list countdown; PaymentTab can refreeze + repay.

Hold duration: `HOLD_DURATION_MS = 15 * 60 * 1000`.

---

## Hold expiry / release / refreeze

| Mechanism | Behavior |
|-----------|----------|
| Soft expiry | Availability/confirm treat expired PENDING as free; **status not auto-flipped** |
| Hard release | `releaseHold` → release discounts + EXPIRED bookings/holdGroup |
| Trip cancel pending | Expire bookings; may CANCEL holdGroup; **no discount release** |
| Paystack fail reconcile | Expire bookings; **no discount release**; holdGroup may stay ACTIVE |
| Refreeze | Quote outside tx → release RESERVED → delete snapshot → freeze again |
| Orphan pay | Expired hold + SUCCESS → wallet rescue (logged-in) |

**Gap:** No cron sweeps expired holds to release promo budget, voucher reservedAmount, credit reservedXOF, coupon redemptionCount. Seats free; instruments stuck until explicit release or finalize.

**Combined with P1 amount desync:** pending-pay refreeze + Paystack re-init is a high-frequency failure path.

---

## Oversell / concurrency / segments

### Mitigations

- `createHold`: `SELECT … FROM trip … FOR UPDATE` then overlap conflict.
- Per-seat map + Paystack confirm clash re-check.
- Overlap: `boarding < dest && dropoff > origin` — correct half-open reuse at shared stop (A→B and B→C same seat OK).

### Risks

| Sev | Risk |
|-----|------|
| P1 | Occupancy `_count` sums overlapping **booking rows**, not distinct seats / max concurrent load on path → false SOLD_OUT while map shows AVAILABLE |
| P2 | `confirmFromWallet` omits clash re-check (weaker than Paystack) |
| P2 | BOARDING allowed in trip details but search only SCHEDULED\|DELAYED — stale deep links |
| — | Soft-expired rows still PENDING until release — inventory OK via holdExpiresAt filters; discounts not OK |

**P0 live double-sale of same seat under concurrency:** not confirmed; trip lock + conflict check is sound for hold creation.

---

## Operator cancel channels & checked-in

Documented in [05-cancellations-refunds.md](./05-cancellations-refunds.md). Summary:

- Drawer + bulk: WALLET/CASH/VOUCHER; guests→CASH; checked-in skipped/hidden.
- Trip cancel: hard block if any checked-in; `skippedCheckedIn` always 0 (API shape misleading — P3).

---

## Search / time zone issues (P2)

- Departure hour ranges / day bounds use UTC in repository.
- `cheapestByDate` buckets by `toISOString().split("T")[0]` (UTC date).
- CI local evening near midnight can land in wrong day/bucket.
- Hold email Abidjan vs shareTicket UTC inconsistency (booking router).

---

## UI / locale (booking path)

| Issue | Where |
|-------|--------|
| Hardcoded EN dialog | `booking-dialog-flow.tsx` |
| Hardcoded EN countdown | `hold-countdown.ts` |
| Checkout mostly EN | `booking-checkout-form.tsx` (discounts.* i18n only) |
| `" · schedule"` hardcode | pending pay voucher label in booking-details |
| Passenger/operator bookings largely next-intl | better than search→book funnel |

Full UI notes: [09-ui-i18n-inconsistencies.md](./09-ui-i18n-inconsistencies.md).

---

## Pending-pay discount parity

Recent hardening added promo/voucher/credits UI + `refreezeHoldDiscounts` on pending PaymentTab. Traveler-app parity still open.

**Compound critical gap (P1-17 / Trace C):** the pending page **does** render a credits row, but preview feeds `creditAppliedXOF = 0` because availability is `remainingXOF - reservedXOF` and the selected hold’s own reservation is still counted. Refreeze quotes **before** release, then can freeze a zero-credit quote. This is not “missing UI”; it is incorrect quote ordering. Same class of bug after wallet confirm failure post-`createHold` without client release (P1-18).

## Additional ops / UX gaps (from transaction pack)

| Issue | Detail |
|-------|--------|
| Seat selection timing | No reserve at seat tap; conflict only at createHold — needs explicit refresh/reselect (P2-24) |
| Multi-deck | `SeatAvailabilityService` returns `deck: 1` ignoring source seat deck (P2-23) |
| Guest form remnants | Checkout still has guest/manual passages despite login-required hold (P2-25) |
| Ops queues | No dedicated UI for refund failure or reservation-leak remediation; abuse lacks review owner/state; campaign KPIs FINALIZED-only (P2-26) |
| Trip status changes | Must define effects on active holds, confirmed bookings, refunds, notifications, future generated trips |

---

## Edge cases (holds/seats)

| Scenario | Actual |
|----------|--------|
| Two users same seat same segment | One CONFLICT — OK |
| Same seat A→B and B→C | Both allowed — OK |
| Search A→C with mid-route reuse | Remaining understated — P1 |
| Hold expires, no releaseHold | Seats free; discounts reserved — P1 |
| Paystack success after expiry | Wallet rescue if logged in — OK |
| Cancel Paystack popup after hold | Seats held 15m — OK |
| Pending pay + change promo + Paystack | Verify may fail amount mismatch — P1 |
| Zero-cash | Wallet path — OK if credits funded |
| Max 6 seats | Schema max — P3 document |
| Stale offer price | Live fare at hold — OK |

---

## File inventory (this domain)

Search: `app/[locale]/search`, `features/search/**`, `trpc/routers/search.ts`  
Booking: `features/booking/**`, `trpc/routers/booking.ts`, success page  
Ops: operator bookings/trips components, `cancel-trip-with-refunds.ts`, trips/operator routers  
Coupled: payment-service, booking-confirmation, quote-service, reconcile-payments cron
