# Findings — Refunds/Cancellation (Tier 2), Booking Holds (Tier 3), Passenger UI (Tier 5)

Files READ this session:
- apps/web/features/payments/services/cancellation-service.ts (393)
- apps/web/lib/cancel-trip-with-refunds.ts (221)
- apps/web/features/payments/services/booking-receipt-email.ts (99)
- apps/web/features/booking/services/booking-hold-service.ts (298)
- apps/web/features/booking/services/seat-availability-service.ts (103)
- apps/web/features/booking/lib/assert-hold-ownership.ts
- apps/web/features/booking/lib/hold-group.ts (referenced), segment-overlap / trip-segments (referenced)
- apps/web/features/passenger/components/wallet-card.tsx, passenger/views/passenger-wallet-view.tsx
- apps/web/features/operator/components/revenue/* (money display)
- packages/db/prisma/schema.prisma (Booking model constraints)

---

## ✅ STRONG CONTROLS CONFIRMED

### Cancellation / refunds
1. **Refund ledger is correct double-entry.** WALLET channel: DEBIT OPERATOR_RECEIVABLE
   (`proportionalOperatorNet`, `releaseFromReserve` if not yet cleared), DEBIT PLATFORM_COMMISSION
   (`commissionAmount`), CREDIT PASSENGER_WALLET (`refundAmountXOF`). Sum of debits = sum of credits
   (`commissionAmount = refundAmountXOF - proportionalOperatorNet`). ✅
2. **Convenience fee is correctly RETAINED on refund.** `refundAmountXOF = proportionalBase` = the
   passenger's share of `subtotalBaseXOF` (base fare only, excludes convenience). Platform keeps the
   convenience fee. Matches spec 15-refunds. ✅
3. **Commission is clawed back** (DEBIT PLATFORM_COMMISSION) on refund. ✅
4. **Strong idempotency.** `idempotencyKey: REFUND_WALLET_${bookingId}` / `REFUND_OFFLINE_${bookingId}`,
   AND a pre-ledger status guard (`lockedBooking.status !== "CONFIRMED" → throw`). Re-calling cancel on
   an already-cancelled booking is blocked before the ledger posts. ✅
5. **Atomic.** The booking status flip + ledger post happen inside one `$transaction`. ✅
6. **Per-seat proportional math is exact** (last seat absorbs residual; `hold_group FOR UPDATE`
   serializes concurrent seat cancels in a hold). An invariant check (`refundedSum + remainingSum ===
   subtotalBaseXOF`) logs `REFUND_INVARIANT_VIOLATION` on drift. ✅
7. **Routes to WALLET (not card).** `channel` WALLET → PASSENGER_WALLET; CASH/VOUCHER →
   OFFLINE_REFUND_PAYABLE. No Paystack card-refund API call anywhere. Honors "card refunds deprecated." ✅

### Booking holds
8. **Fare is server-recomputed, never trusted from client.** `createHold` uses
   `TripDetailsService.getTripDetails(...).priceXOF` (live) and writes an immutable `PricingSnapshot`;
   confirm uses the snapshot. Global "trusts client fare" 🔴 check PASSED. ✅
9. **`seat-availability-service` correctly excludes** CONFIRMED and unexpired PENDING_PAYMENT bookings
   from availability (matches spec deprecation note on SeatStatus). ✅
10. **`assertHoldOwnedByUser` enforced** in the booking router for passenger-held actions. ✅

---

## 🟠 / 🟡 FINDINGS

### 🟠 F-16 — Double-booking (over-sale) race  [see 03-findings file for full detail]
The conflict check in `createHold` is a non-locked read-then-insert; `Booking` has no unique constraint
on active seat bookings; `confirmFromPayment` does not re-verify cross-hold-group seat exclusivity.
Two concurrent holds for the same seat can both confirm → over-sale. **(Full analysis + fix in
audit/03-findings-withdrawal-admin-settlements.md F-16.)**

### 🟡 F-24 — Cancellation no-snapshot fallback mis-handles commission  [see 03-findings]
When `pricingSnapshot` is missing, `proportionalOperatorNet = farePaid` (base fare) → `commissionAmount
= 0` → platform commission not clawed back, operator receivable over-debited by the commission portion.
Passenger base-fare refund remains correct. Contingent on missing snapshot. **(Full detail in
audit/03.)**

### 🟡 F-GUEST-RESOLVED — "Guest loses fare on trip cancel" is NOT applicable
Earlier draft flagged `cancelTripWithRefunds` hardcoding `channel = "WALLET"` as a risk for guest
bookings. **User confirmed bookings require login (no guest checkout)** — every booking has a `userId`,
so the WALLET-only refund is safe and the guest branch is dead code. The `assertHoldOwnedByUser` /
cancellation-service `if (!lockedBooking.userId) throw` guards are defensive-only. No finding.

### 🟡 F-31 — `cancelTripWithRefunds` swallows per-booking refund failures → passenger stranded
If `cancellationService.cancelBooking` throws for a booking (e.g. the F-24 no-snapshot
"Insufficient funds" path, or a genuinely broke operator), the loop catches, force-cancels the booking,
and writes a `CANCEL_WITHOUT_REFUND` marker — but the passenger receives **no refund**. On an
operator-initiated trip cancellation, a passenger could lose their fare with no return path. The trip
is already cancelled so they can't travel. Money stays in operator receivable with no route back.
Mitigation: in normal flow the operator's escrowed receivable covers the refund, so this is contingent.
Still worth flagging for passenger-leverage analysis.

### 🟢 F-27 / F-28 — Passenger wallet UI display bugs  [see 03-findings]
`passenger-wallet-view.tsx` passes `postedBalance.toString()` as `walletId` (copy-paste bug);
`wallet-card.tsx` uses `availableBalance.toLocaleString()` without the XOF helper. Cosmetic/data bugs,
no money math. Operator revenue components correctly use `toSafeDisplayNumber`/`formatXOF`. ✅

---

## Booking-receipt-email — clean
Uses `confirmed.totalAmountXOF ?? snapshot.chargeAmountXOF` (actual paid amount) for the receipt; no PPI
leak beyond necessary (refs, amount, names). No money math. ✅

## Note on schema: `Booking` has no seat-exclusivity constraint
`packages/db/prisma/schema.prisma` `Booking` model: `seatId`, `status @default(PENDING_PAYMENT)`,
`bookingReference @unique`, `holdGroupId?`. Indexes (`@@index([tripId, seatId, status])`, etc.) are
**non-unique**. There is no partial unique index preventing two active bookings for one seat → this is
the structural root cause of F-16 and should be fixed at the schema level (deferred unique index or
advisory lock), not just in app code.
