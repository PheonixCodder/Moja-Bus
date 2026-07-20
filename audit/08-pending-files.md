# Pending Files — What still needs reading, and what to look for

Read order = highest money-risk first. For EACH file: read fully, then append findings to the matching
`audit/02-findings-*.md` (or create a new one) and update `audit/01-tracker.md` status.

==================================================================
TIER 1 — HIGHEST RISK (money moves / leaves platform here)
==================================================================

### routers/operator.ts  (2,514 lines) — CRITICAL
- Find `requestWithdrawal` (or similar). VERIFY:
  - Does it `SELECT availableBalance ... FOR UPDATE` BEFORE validating (deadlock/race)?
  - Does it require role OWNER (spec 19-security)?
  - Does the Paystack transfer `reference` equal the `FinancialTransaction.id`? (F-webhook-2 depends on this)
  - Does it CREDIT PAYSTACK_CLEARING at withdrawal (so the success-path only flips status)? (F-webhook-3)
  - Is there a separate PAYMENT_PROCESSOR_FEE post for the outbound transfer fee? (Spec 09-settlement)
  - Does it handle Paystack API failure with a PAYOUT_REVERSAL (compensating) like the spec's Scenario A?
  - Idempotency: double-click race → only one payout. Any ledger idempotency key?
- Also scan: any manual adjustment / settlement endpoints an admin can trigger.
- This is the most important unread file.

### api/webhooks/paystack/route.ts  (43 lines) — CRITICAL
- Verify HMAC-SHA512 signature check is actually performed and returns 401 on mismatch (spec 19-security).
- Confirm runtime is Node (not Edge) so `require("node:crypto")` works (F-13).
- Confirm it calls `paymentService.handleWebhookEvent` and returns 200 on duplicate.

### api/cron/release-escrow/route.ts  (306 lines) — HIGH
- Verify the escrow release math: group by holdGroup, last-seat absorbs rounding residual, aggregate by
  company, atomic update of reserved/available, set clearedAt (idempotency). Compare to spec 06-escrow
  Step 5 and 17-ledger ESCROW_RELEASE.
- NOTE the spec says release-escrow directly updates balance fields (exception to "only engine writes")
  — confirm code does this and that it's intentional, and that postedBalance is unchanged.

### api/cron/reconcile-payments/route.ts  (138 lines) — HIGH
- Verify it catches stale PENDING ExternalPayments (charge) and stale OPERATOR_PAYOUT transactions (>5 min),
  calls Paystack verify, and triggers confirmFromPayment / rescueOrphanedPayment / PAYOUT_REVERSAL.
- CRITICAL: confirm the cron's reversal path does NOT double-reverse with the webhook path (F-07b).

### api/cron/release-reservations/route.ts  (56 lines) — MED
- Verify wallet reservation expiry returns funds reserved→available atomically.

### api/cron/snapshot-accounts/route.ts  (51 lines) — LOW
- Confirm it calls SnapshotService.takeDaily/Weekly/Monthly.

### api/payments/verify/route.ts  (38 lines) — MED
- Verify it calls verifyAndConfirm and that the callback URL flow is safe (no open-redirect).

==================================================================
TIER 2 — REFUNDS / CANCELLATION (money returns to passenger)
==================================================================

### features/payments/services/cancellation-service.ts  (393 lines) — HIGH
- Verify REFUND ledger: debit OPERATOR_RECEIVABLE (reserved if pre-trip / available if post-trip),
  debit PLATFORM_COMMISSION (clawback), credit PASSENGER_WALLET. (Spec 15-refunds, 17-ledger REFUND.)
- Verify convenience fee is NOT refunded (platform keeps it) per spec.
- Verify idempotency (paymentStatus==REFUNDED guard) to prevent double refund.
- Verify it routes to wallet (not card) — spec says card refunds deprecated.

### lib/cancel-trip-with-refunds.ts  (221 lines) — HIGH
- Operator/trip cancel → refunds all bookings. Verify per-booking math and that escrow funds are clawed back.

### features/payments/services/booking-receipt-email.ts — LOW
- Email only; scan for leaked amounts/PPI.

==================================================================
TIER 3 — BOOKING HOLD / SEAT INVENTORY (double-booking risk)
==================================================================

### features/booking/services/booking-hold-service.ts  (298) — HIGH
- Verify hold creation locks seats (unique constraint on tripId+seatId+status), sets 10-min expiry,
  creates PricingSnapshot via PricingResolver. Double-booking prevention.

### features/booking/services/booking-read-service.ts  (411) — MED
- Search/manifest reads; check no money logic.

### features/booking/services/seat-availability-service.ts  (103) — MED
- Verify availability query excludes CONFIRMED/PENDING_PAYMENT (per schema deprecation note on SeatStatus).

### features/booking/services/trip-details-service.ts — MED
- Trip pricing display.

### features/booking/lib/* (hold-group, assert-hold-ownership, booking-reference, etc.) — MED
- `assert-hold-ownership` is security-relevant (prevents one user confirming another's hold). Verify it's
  called in the wallet confirm path (booking-confirmation-service.confirmFromWallet uses userId — check
  ownership assertion).

==================================================================
TIER 4 — ROUTERS (money-adjacent) + WALLET/REVENUE UI
==================================================================

### routers/payments.ts (428) — HIGH
- Top-up init, verify, pricing preview. Verify top-up creates ExternalPayment + PricingSnapshot + wallet.

### routers/booking.ts (301) — HIGH
- createHold flow; confirm it calls booking-hold-service and returns paystack url. Verify no money posted here.

### routers/wallet.ts (120) — HIGH
- Wallet balance/top-up/withdraw (passenger wallet). Verify reads use FinancialAccountService correctly.

### routers/admin.ts (2,533) — HIGH
- Settlements, treasury, manual adjustments, verifications, withdrawals oversight. Verify admin actions
  post correct ledger entries and are audit-logged (spec 08-audit: admin manual adjustments need reason).

### routers/passenger.ts (396) — MED
- Passenger wallet/booking views.

### routers/trips.ts (1,082) — MED
- cancelTrip, check-in, updateStatus. Verify cancel triggers refund path; verify status transitions
  (cannot skip BOARDING, etc.).

### routers/schedules.ts (1,136) / staff.ts (934) / search.ts / public.ts / invitation.ts / fleet.ts /
  routes.ts / terminals.ts — LOW-MED (mostly operational; scan for any direct Prisma balance writes
  that bypass AccountingEngine — that would be a 🔴 spec violation).

==================================================================
TIER 5 — SUPPORTING LIBS + UI (lower risk, still scan)
==================================================================

### lib/escrow-release.ts (30) — MED
- Thin wrapper? Confirm it delegates to the cron logic, not a divergent implementation.

### lib/financial-calculations.ts (207) — MED
- Any manual balance math? Must go through engine. Verify no raw `availableBalance` writes.

### lib/platform-settings.ts (115) — LOW
- Commission/convenience bps, min withdrawal. Verify defaults match schema (500/250/5000).

### lib/cron-auth.ts — MED
- CRON_SECRET bearer check on all cron routes (spec says fail-closed). Verify every cron route enforces it.

### lib/bank-crypto.ts / bank-account.ts / bank-access.ts — MED
- Bank account encryption (docs say enc:v1: prefix). Verify secrets not logged, access logged.

### features/operator/components/revenue/* — MED
- Balance overview, transaction ledger, arrears banner. Verify displayed balances come from
  FinancialAccount (ledger truth), formatted via lib/money.ts (toSafeDisplayNumber), not raw Number().

### features/wallet + features/passenger/* — MED
- Wallet top-up UI, passenger bookings/tickets. Scan for money display bugs (e.g. showing raw BigInt,
  wrong currency formatting).

### features/payments/providers/paystack-provider.ts (91) / registry.ts / types.ts / hooks/* / scripts/* — LOW
- Provider abstraction; scan for money math or signature issues.

==================================================================
GLOBAL CHECKLIST (apply to every file)
==================================================================
[ ] Does any code write `financialAccount.update({ availableBalance: ... })` OUTSIDE AccountingEngine?
    → 🔴 spec violation (Rule 5). EXCEPTION: release-escrow cron direct field update (documented).
[ ] Does any code do `UPDATE users SET balance = ...` style? → 🔴 fatal.
[ ] Any `Number(bigint)` coercion for arithmetic/compare? → use lib/money.ts.
[ ] Any missing idempotency key on a money-moving engine.commit? → leak risk.
[ ] Any money path reachable without auth / without OWNER / ADMIN check? → security.
[ ] Any place that trusts client-supplied fare/amount instead of the immutable PricingSnapshot? → 🔴.
[ ] Any place Paystack amount is computed with the wrong ×100/÷100 (F-11)? → catastrophic.
