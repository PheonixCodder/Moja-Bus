# Phase 06 — UX, i18n & privacy (web only)

**Status:** Implemented (web)  
**Depends on:** Phases 00–03 for correct money/hold behavior to translate  
**Unlocks:** Consistent FR/EN web purchase path; safer tickets  
**Findings:** P1-9, P1-20, P2-12…14, P2-17, P2-18, P2-23…25, P3-5, P3-13  
**Locked:** D6 = **defer traveler / mobile app** — no `apps/traveler-app` work in this program
**Notes:** [19-phase-06-privacy-notes.md](./19-phase-06-privacy-notes.md)

## Goal

Make the **web** book → pay → ticket → cancel journey locale-correct and privacy-safer.

## Scope

### In
- i18n for booking dialog, countdown, checkout, refund/cancel copy
- Locale-aware redirects/links
- Ticket token strategy (short-lived presentation / no durable URL secrets)
- Signed checkout session for `/api/payments/verify`
- Search timezone Africa/Abidjan
- Seat deck from source; conflict refresh UX; remove guest remnants
- Wallet prefetch query fix; synthetic email strategy
- Passenger cancel channel UX polish (complements Phase 00)
- Document max 6 seats; legacy phone hold grouping

### Out
- **Traveler / Expo app** (follow-up plan later)
- New marketing pages
- Paystack splits (D7)

## Work items

### 06.1 — i18n & navigation (P2-13)
1. Move literals in `booking-dialog-flow`, `hold-countdown`, `booking-checkout-form`, cancel/refund strings to next-intl catalogs (EN+FR).
2. Replace bare `/search`, `/book/...`, `/dashboard/...` with locale helpers.

### 06.2 — Ticket privacy (P1-9)
1. Stop putting raw `ticketToken` in success query strings.
2. Short-lived signed presentation token for public ticket view **or** auth-only ticket route.
3. Document scanner authorization + revocation (invalidate token / rotate).
4. Minimize public ticket payload.

### 06.3 — Verify callback binding (P1-20)
1. Signed, short-lived checkout session cookie/state bound to user + hold.
2. Locale-safe error redirects.
3. Do not disclose booking ids until session validates (webhook remains independent).

### 06.4 — Search time (P2-12)
1. Day bounds, hour ranges, cheapestByDate keys in `Africa/Abidjan` (or company TZ if multi-TZ later).

### 06.5 — Seat UX (P2-23, P2-24, P2-25)
1. Pass real `deck` from TripSeat.
2. On CONFLICT: clear message + refresh availability + reselect.
3. Remove dead guest/manual checkout branches.

### 06.6 — Misc web polish
1. Fix `listMyCredits` vs `listMyCreditLots` prefetch (P2-17).
2. Synthetic emails (P2-18): prefer omit email / use verified only; never invent `@guest.mojaride.ci` for Novu if undeliverable.
3. Document max 6 seats for operators (P3-5).
4. Legacy phone hold grouping: document support window or remove (P3-13).

## Acceptance criteria

- [x] FR locale: book dialog/checkout/cancel without English critical path strings
- [x] Success URL does not leak long-lived ticket bearer
- [x] Verify callback requires bound session; locale preserved on errors
- [x] Search “today” matches CI local date
- [x] Multi-deck seat maps render correct decks

## Risks

- Token migration breaks existing shared QR links — provide grace period dual-accept

## Exit checklist

- [x] EN/FR web QA checklist signed off (implementation; staging smoke still recommended)
- [x] Traveler follow-up ticket filed (out of this program — D6)
