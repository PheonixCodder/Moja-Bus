# 06 — Passenger Commerce: Bookings, Payments, Tickets, Cancellation & Wallet Audit

> **Audit date:** 2026-08-22 · **Method:** full read of booking/payments/wallet/passenger/public routers, all payment & cancellation services, Paystack webhook + verify routes, signed-token libs, web passenger views/components, traveler booking feature screens/hooks, release-escrow cron. Every claim cites `file:line`.
> **Scope:** search→hold→pay→webhook→confirm chain · ticket issuance/QR/sharing/print · guests · cancel/refund channels+math · escrow tail · wallet · web↔traveler parity.

---

## Flow traces

### 1. Booking chain: search → hold → pay → webhook → confirm

1. **Search** (`trpc/routers/search.ts`) returns offers; pricing recomputed live at hold time (`booking-hold-service.ts:160-163`).
2. **Signed quote**: `payments.getCheckoutPricing` computes base + discounts then HMAC-SHA256-signs `{offerId, seatCount, method, instruments, amounts}` with **5-min TTL**, secret from `BETTER_AUTH_SECRET ?? CHECKOUT_QUOTE_SECRET` (`payments.ts:31-131`; `checkout-quote.ts:5, 26-36`).
3. **Hold creation** `booking.createHold` → `BookingHoldService`: quote verification + input match (`booking-hold-service.ts:49-63`), sold-out/duplicate-seat/per-seat checks (:67-88), live availability re-check (:90-108); schedule inactive / status ∈ {CANCELLED, ARRIVED, DEPARTED} rejected (:147-158); discount re-priced server-side, hard fail on amount mismatch vs signed quote (:195-200); tx (:202-333): trip-row `FOR UPDATE` serialization (:210-212), overlap query CONFIRMED-or-active-hold + JS segment filter (:214-253), HoldGroup ACTIVE + full PricingSnapshot incl. discount freeze (:255-291), per-seat bookings PENDING_PAYMENT w/ stop-order snapshots (:303-323). **TTL = 15 minutes** (`:16`). ⚠️ `passenger-hold-created` outbox enqueued AFTER the tx, best-effort try/catch (`booking.ts:74-149` — see F-PS-14).
4. **Payment init**: ownership assert (`assert-hold-ownership.ts:13-18`), refuses invented guest emails (`payment-service.ts:88-96`), ExternalPayment purpose CHECKOUT + attempt-scoped reference, Paystack initialize w/ callback → `/api/payments/verify`, attempt + INITIALIZED event in tx (`payment-service.ts:120-184`); HttpOnly HMAC checkout-session cookie bound to holdGroup+user, 30-min TTL (`booking.ts:178-186`; `signed-access-tokens.ts:101-154`).
5. **Webhook**: raw-body HMAC-SHA512 verified at route entry before parsing (`webhooks/paystack/route.ts:8-13`; impl `paystack-client.ts:134-149`); dedupe `${event}:${reference}:${data.id}` via webhookEvent upsert + processedAt (`payment-service.ts:303-384`); non-timing-safe compare noted (F-PS-13).
6. **Verify endpoints**: browser GET requires valid checkout-session cookie bound to holdGroupId then verifies (`api/payments/verify/route.ts:26-92`); mobile callback deliberately does NOT complete bookings (`mobile-callback/route.ts:3-19`); traveler verifies via tRPC `booking.verifyPayment` (`booking-detail.tsx:166-181`); amount-mismatch rejection (`payment-service.ts:230-248`). **Ownership hole → F-PS-01.**
7. **Confirmation** `BookingConfirmationService.confirmFromPayment`: idempotent fast-path (:26-36); orphan rescue credits captured-but-expired holds to wallet (:45-58, :719-796); Serializable tx + ACTIVE→CONFIRMED updateMany claim (:73-89, :284-288); per-seat over-sale re-check (:95-126); `issuedAt` stamped, hold cleared, userId attached when provided (:128-155); discount finalize (:157-163); double-entry clearing→fees→escrowed operator credit→commission→convenience + promo legs (:173-281).
8. **Receipt**: post-commit fire-and-forget → outbox keyed `booking-receipt-{holdGroupId}` (`:316-320`; `commercial.ts:19-31`); guest emails skipped, never invented.
9. **Wallet path** `confirmFromWallet`: convenience fee waived, zero-cash guard requires promo coverage (:380-399); wallet row `FOR UPDATE` (:412-418); insufficient-balance pre-check throw now routed into `passenger-wallet-low-balance` Novu alert for BOTH pre-check and ledger failure strings (**P2-4 FIXED**, `:606-634, 679-711`).
10. Hold end-states: expire-or-release releases incentive reservations, expires bookings, closes dangling payments (`expire-or-release-hold.ts:22-149`).

### 2. Tickets

- **QR payload**: `${APP_URL}/tickets/{encodeURIComponent(ticketToken)}` — **raw durable token embedded in a URL** (`booking-read-service.ts:440-474`). Web renders via react-qr-code (`digital-ticket-card.tsx:52-56`); traveler identical (`ticket-sheet.tsx:149-155`).
- **Scanner mismatch**: driver scanner passes scanned strings through unchanged except JSON unwrap (`scanner.tsx:77-89`); `checkInPassenger` exact-matches `ticketToken` (`drivers.ts:1281-1283`); `batchSyncCheckIns` same (:1403-1405). The URL-parsing fix already exists for operator-web scanning (`features/operator/lib/parse-ticket-token.ts`, tested) but was never applied to the driver path → **F-PS-03 (launch blocker)**.
- **Signed presentation tokens**: `pt.<b64url>.<hmac>` 1-h TTL; success URLs embed only pt. tokens (`booking-success-url.ts:10-14`); resolver accepts pt. + raw ≥16-char grace — TTL decision documented as ACCEPTED v1 RISK at the enforcement point (`api/tickets/verify/route.ts:6-14`).
- **Public share page**: no login; publicProcedure returns full DTO for any CONFIRMED booking matching token-or-reference (`booking.ts:276-292`; `[locale]/tickets/[token]/page.tsx:29-46` 404s invalid).
- **Share UI shipped both surfaces**: web email dialog w/ locale-prefixed URL + idempotent transactionId (`passenger-tickets-view.tsx:90-115`; `booking.ts:368-442`); traveler email + native OS share (`booking-detail.tsx:446-574`; `ticket-sheet.tsx:64-76`). D6 FIXED.
- **Print stylesheet**: dedicated @media print block + button (web only).
- **Guests (userId null)**: phone-match read access with auto-claim-on-read (`booking-read-service.ts:55-100, 173-208`); WALLET refunds blocked for guests (`cancellation-service.ts:60-66`); BUT no current flow can create guests — protected createHold always sets userId (**F-PS-11** dead-capability cost).

### 3. Cancel / refund

- Eligibility: CONFIRMED-only, not checked-in, pre-departure (`cancellation-service.ts:53-96`); settlement must be cancellable.
- Channels: schema CASH/WALLET/PAYSTACK; passengers restricted to WALLET+PAYSTACK at API level (`payments.ts:179-188`) — but web UI offers WALLET|CASH only; traveler WALLET only.
- Math — single source `computeRefundQuote` (`cancellation-policy.ts:39-81`): proportional per-seat base (last seat absorbs remainder), convenience fee NEVER refunded, snapshot-missing fallback via commission bps; executed under hold-group FOR UPDATE with idempotency `CANCEL_{bookingId}_{channel}` (`cancellation-service.ts:116-199`).
- Ledger: WALLET ⇒ instant credit + operator receivable debit (`releaseFromReserve` pre-clearance); non-WALLET ⇒ OFFLINE_REFUND_PAYABLE liability; CASH ⇒ PENDING_FULFILMENT with admin fulfilment FSM. **PAYSTACK channel never calls any Paystack refund API and isn't visible in the OWED queue → F-PS-02.**
- Refund invariant watchdog writes ActivityLog REFUND_INVARIANT_VIOLATION on drift (:376-414).
- Self-cancel notification **P1-6 FIXED**: `enqueueBookingRefunded` inside the cancel tx, keyed `booking-refunded-{refundId}`, guests skipped (`cancellation-service.ts:201-223`); operator trip-cancel passes false and fans out `passenger-trip-cancelled` with refund amount instead (`cancel-trip-with-refunds.ts:145-150, 225-284`).
- Operator trip-cancel: expire pendings, cancel groups, per-booking refunds in one tx; failed refunds leave durable REFUND_PENDING obligations; checked-in passengers block cancel (:56-215).
- Refund dialog amounts: **P2-12 web FIXED** — dialog queries `passenger.getRefundQuote` using the SAME policy fn (`passenger.ts:515-579`; `passenger-tickets-view.tsx:67-74, 290-315`). **Traveler NOT fixed → F-PS-04.**

### 4. Escrow / money tail

Operator revenue credited escrowed at confirmation; `clearedAt` written ONLY by release-escrow cron (ARRIVED + 24 h, advisory lock + row lock + idempotency keys + H2/H3 anti-stranding fallbacks w/ ops alerting — `release-escrow/route.ts:20-239`). Pre-release cancellations debit reserved funds so refunds can't spend unreleased escrow twice.

### 5. Wallet

Balance/ledger/top-up flows complete on both surfaces (min 100 XOF, purpose TOP_UP, exactly-once ledger via unique constraint + P2002 tolerance, `payment-service.ts:566-666`); traveler polls 5 s × 24 after WebView return. **Top-up confirmation notification can never fire** — real initiators omit `meta.userId`; the procedure that sets it is dead code targeting a nonexistent route (**F-PS-05**). Low-balance alert fires on failed wallet checkout only (no standing monitor).

## Verified-working strengths

1. Layered over-sale defense: FOR UPDATE at hold + active-status overlap query + independent per-seat clash re-check under Serializable isolation + P2002 idempotent recovery.
2. Quote integrity: HMAC-signed 5-min quotes; client cannot dictate price (amount equality enforced at hold).
3. Webhook integrity: SHA512 gate before parse, idempotency dedupe, amount-mismatch rejection, reconcile cron replays through same handler.
4. Money-loss safety nets: orphan-payment wallet rescue; refund-sum invariant watchdog; durable REFUND_PENDING obligations on partial trip-cancel failures.
5. Escrow discipline triple protection (advisory lock + row lock + idempotency key) with ops alerting fallbacks.
6. Atomic refund notification (the pattern other notices should copy).
7. Ticket presentation hygiene: pt.-only success URLs, server-side public validation + 404, consciously documented raw-grace risk.
8. Honest mobile Paystack loop: WebView return never asserts completion; authenticated tRPC verify; top-up polls until settled.

## Findings

| ID | Sev | Finding | Evidence | Fix sketch |
|---|---|---|---|---|
| **F-PS-01** | **P1** | `booking.verifyPayment` has NO ownership assertion (unlike initiate/confirm/release/wallet/refreeze): resolves ANY payment by paystackReference and confirms, stamping caller's userId onto someone else's bookings — reference holders can claim/steer unpaid-for tickets | booking.ts:191-206 vs :167-168 etc.; payment-service.ts:208-211; booking-confirmation-service.ts:128-140 | Resolve holdGroup from reference → assertHoldOwnedByUser before verify/confirm |
| **F-PS-02** | **P1** | PAYSTACK refund channel never refunds to Paystack: no refund API exists in paystack-client (grep zero), paystackRefundId hardcoded null, mapped COMPLETED while money sits in OFFLINE_REFUND_PAYABLE; admin OWED queue filters CASH only so PAYSTACK rows invisible. Passenger told "completed", card never credited | cancellation-policy.ts:3-7; cancellation-service.ts:185-199, :302-359; offline-refund-fulfilment.ts:17-21; payments.ts:182 | Implement Paystack refund API or remove channel from passenger reach + map to PENDING_FULFILMENT |
| **F-PS-03** | **P1** | Driver-app QR scanning cannot read issued QR codes: passenger QR = URL-wrapped raw token; scanner passes string through; server exact-matches ticketToken → EVERY standard gate scan fails "Invalid ticket"; drivers forced to manual manifest check-in. Parser fix exists for operator-web only | booking-read-service.ts:472; scanner.tsx:77-89; drivers.ts:1281-1283, :1403-1405; features/operator/lib/parse-ticket-token.ts | Move parser to shared package; apply in schema preprocess or both procedures |
| F-PS-04 | P2 | Traveler cancel dialog shows GROUP-TOTAL fare as refund while cancelling only seats[0]; bypasses computeRefundQuote (frozen discounts ignored); WALLET-only; guest errors console-logged *(prior P2-12 unresolved on traveler)* | booking-detail.tsx:480-486, :188-200; cancel-dialog.tsx:76-81 | Per-seat getRefundQuote → quoted amount/status into dialog |
| F-PS-05 | P2 | Wallet top-up confirmation unreachable: initiators omit meta.userId (notify gated on it); correct procedure `wallet.topUp` dead code w/ nonexistent callback route `/dashboard/passenger/wallet` | payment-service.ts:636-665; passenger.ts:713-758; wallet.ts:43-52 | Add userId metadata; delete/wire wallet.topUp |
| F-PS-06 | P2 | Push deep-links navigate to nonexistent route: pushes `/bookings/${ref}` but detail route is `app/booking/[reference]` — ticket-ready taps land on not-found | traveler _layout.tsx:143-157 vs app/booking/[reference]/index.tsx; bookings.tsx:80-82 | Push `/booking/${ref}` |
| F-PS-11 | P3 | Guest capability dead at creation yet paid for globally: auto-claim scans ALL unlinked bookings per list/get (in-memory filter, O(n) growth); side-effect ownership mutation on read | booking.ts:63-72; booking-read-service.ts:78-100 | Phone index + predicate, or drop guest branch until guest checkout exists |
| F-PS-13 | P3 | Webhook compare not timing-safe (pt./quote tokens do this correctly); `verifyWalletTopUp` lacks reference-ownership binding (can only complete legit credits but allows third-party force-verify side effects) | paystack-client.ts:148; payment-service.ts:261-287; passenger.ts:774-782 | timingSafeEqual; bind ref→userId at initiation |
| F-PS-14 | P3 | Commercial notices mostly post-commit best-effort (hold-created, receipt, trip-cancelled fan-out) — crash between commit and enqueue permanently loses the notice; only refund notice is atomic | booking.ts:120-148; booking-confirmation-service.ts:316-320; cancel-trip-with-refunds.ts:225-284 | Copy the enqueue-inside-tx refund pattern |
| F-PS-15 | P3 | Raw durable bearer ticket token printed on-screen in traveler sheet beneath QR — screenshot/share leaks permanent credential | ticket-sheet.tsx:152-154 | Show booking reference instead |

## Prior-findings scorecard (this domain)

| Prior ID | State |
|---|---|
| P1-6 self-cancel refund notice | ✅ FIXED (atomic in-tx) |
| P2-4 low-balance alert | ✅ FIXED (both failure paths) |
| P2-12 refund display | 🟡 PARTIAL — web fixed, traveler not (F-PS-04) |
| P3-8 ticket TTL ruling | ✅ DECIDED — documented accepted v1 risk w/ grace window |
| D6 ticket-share | ✅ FIXED both surfaces |
| P1-9/P1-20 (earlier hardening) | ✅ holding (pt.-only success URLs; cookie-bound verify GET) |

**Severity roll-up:** P1×3 · P2×3 · P3×4.
