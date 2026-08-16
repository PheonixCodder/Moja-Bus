# 09 — UI and i18n inconsistencies

## Booking funnel (highest customer impact)

| Area | Issue | Evidence |
|------|-------|----------|
| Book dialog | Hardcoded English titles/CTAs/sold-out | `booking-dialog-flow.tsx` |
| Hold countdown | Hardcoded English units/copy | `hold-countdown.ts` |
| Checkout form | Mostly English toasts/labels (“Fare”, “Total”, “Select a passenger…”) | `booking-checkout-form.tsx` |
| Discounts slice | Uses `discounts.*` messages | Partial i18n only |
| Pending voucher label | `" · schedule"` literal | `booking-details.tsx` |
| Locale routing | Some redirects/links omit locale prefix | payments verify error redirect; various `/search`, `/dashboard` links |

Passenger bookings list/details/tickets and operator bookings/manifest are comparatively next-intl’d — contrast with search→book.

## Payments / success

| Area | Issue |
|------|-------|
| Success URL | Embeds booking refs / ticket tokens in query (history, analytics, referrer) |
| Verify route | Error redirects not locale-prefixed |
| Mobile callback | “Payment complete” UX without server confirm |
| Wallet error remap | Promo ledger insufficient → “Insufficient wallet balance” / low-wallet Novu |

## Cancel UX

| Area | Issue |
|------|-------|
| Passenger cancel | Always `channel: "WALLET"` — fails for guests and wallet-paid seats |
| Operator drawer | Channels coherent; checked-in disabled with copy |
| Trip cancel API | `skippedCheckedIn: 0` always when hard-blocked — misleading for clients |
| Refund wording | Status COMPLETED implies provider refund for card payers |

## Incentives UIs

| Surface | Issue |
|---------|-------|
| Admin referral card | Fraud blocks hardcoded `true` on save — toggles not effective |
| Admin promo credits | Raw user cuid; no search |
| Abuse pause | Needs campaignId; referral abuse often lacks it |
| Wallet page | Prefetch `listMyCredits` vs panel `listMyCreditLots` |
| Operator promotions | Generally coherent opt-in + own campaigns |
| Passenger referrals | Share/apply/funnel OK; pending applier clears on many errors |

## Search UX

| Area | Issue |
|------|-------|
| Time-of-day filters | UTC hours vs CI local |
| Cheapest-by-date strip | UTC date keys |
| Promo card | Present on search; ensure schedule voucher messaging matches checkout |
| Capacity | False sold-out vs seat map AVAILABLE under mid-route reuse |

## Accessibility / polish (P3)

- Novu failures swallowed (`.catch(() => {})`) — silent missing emails/SMS.
- Mixed timezone in hold vs share ticket notifications.
- English-only critical payment/refund copy increases support burden in FR locales.

## Additional UX defects from transaction pack

| Area | Issue |
|------|-------|
| Seat conflict recovery | No explicit refresh/reselect after createHold CONFLICT mid-dialog |
| Multi-deck | Seat map forces `deck: 1` |
| Guest remnants | Form still shows guest/manual paths after login gate |
| Pending credits | Row exists but shows 0 when own reservation counted (P1-17 — not missing component) |
| Ops | No queue UI for refund failures / stuck reservations |

## Recommended UI fix themes (not a full redesign)

1. Move book dialog, countdown, checkout, cancel/refund status copy into message catalogs.
2. Locale-aware helpers for all redirects.
3. Channel picker for passenger cancel; disable WALLET for guests.
4. Honest refund status labels by channel (wallet credit vs offline payable vs provider pending).
5. Fix pending-pay quote so own-hold credits/vouchers reappear (P1-17).
6. Traveler-app parity for pending-pay instruments (open item from memory).
