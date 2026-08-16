# Phase 06 — Privacy & ops notes

## Ticket presentation tokens (P1-9)

- Success URLs use short-lived signed `pt` query params (`signTicketPresentationToken`), not durable `ticketToken`.
- `/tickets/[token]` and `getTicketByToken` accept:
  1. `pt.*` presentation tokens (HMAC, ~1h TTL)
  2. Raw durable tokens (grace for existing QR / scanner links)
- Scanner authorization remains operator boarding tools; revocation = booking cancel / status change (token lookup requires `CONFIRMED`).
- Rotate presentation secret via `BETTER_AUTH_SECRET` / `CHECKOUT_QUOTE_SECRET` rotation.

## Checkout verify session (P1-20)

- On `initiatePayment`, server sets HttpOnly `moja_checkout_session` bound to `userId` + `holdGroupId` (+ optional locale).
- `/api/payments/verify` requires a valid cookie matching `holdGroupId` before confirming; redirects preserve locale.
- Paystack webhooks (if any) remain independent of this browser session.

## Synthetic emails (P2-18)

- Paystack initialize **requires** a real payer email (`session.user.email` or explicit `payerEmail`).
- Never invent `@guest.mojaride.ci` for Paystack or Novu.
- Novu triggers already gate on `user?.email`.

## Max seats (P3-5)

- Passenger seat map / hold creation caps selection at **6 seats** per checkout (`maxSelection` / passenger count from search).
- Operators should not rely on >6 in a single hold group for web checkout.

## Legacy phone hold grouping (P3-13)

- `holdGroupWhere` still supports pre-`holdGroupId` rows: same `tripId` + `holdExpiresAt` + `passengerPhone`.
- New holds always set `holdGroupId`. Support window: keep read path until inventory shows zero legacy PENDING/CONFIRMED rows without `holdGroupId`, then remove the phone branch.
