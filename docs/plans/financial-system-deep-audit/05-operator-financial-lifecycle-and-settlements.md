# Chapter 5: Operator Financial Lifecycle & Settlements

## 1. Operator Onboarding & Bank Verification

Every bus operator company in Moja Bus must configure and verify a corporate bank account or Mobile Money payout account before receiving payouts.

```
       [ OPERATOR ONBOARDING: BANK STEP ]
  (apps/web/features/operator/components/onboarding/bank-step.tsx)
                      │
                      ▼
       [ 1. PAYSTACK BANK LIST QUERY ]
       (trpc.payments.listBanks -> Paystack /bank API)
                      │
                      ▼
       [ 2. FORM SUBMISSION & ENCRYPTION ]
       • Bank Name & Bank Code
       • Account Holder Name (Must match legal company name)
       • Account Number (Encrypted at rest with 'enc:v1:' AES-GCM)
       • SWIFT / IBAN / Branch
                      │
                      ▼
       [ 3. PAYSTACK RECIPIENT CREATION ]
       • Calls Paystack /transferrecipient
       • Returns `RCP_xxxxxxxxx` code
       • Stores `paystackTransferRecipientCode` on BankAccount & Company
                      │
                      ▼
       [ 4. ADMIN VERIFICATION / COMPLIANCE ]
       • Admin checks company registration & bank verification document
       • Marks `isVerified: true`
```

---

## 2. Revenue Generation & Escrow Lifecycle

When a passenger books a seat on an operator's trip, the operator receives net ticket revenue, but **the funds are held in escrow** until the trip is safely completed.

### Financial Breakdown at Booking:
$$\text{Base Fare} - \text{Platform Commission} = \text{Operator Net}$$
- Example: $10,000\text{ XOF} - 500\text{ XOF (5\%)} = 9,500\text{ XOF}$.
- `AccountingEngine` records $9,500\text{ XOF}$ with `reserveOnCredit: true`.
- **Operator Balance Impact:**
  - `postedBalance`: $+9,500\text{ XOF}$ (Appears in Total Gross / Total Bookings metrics).
  - `reservedBalance`: $+9,500\text{ XOF}$ (Locked in trip escrow).
  - `availableBalance`: $+0\text{ XOF}$ (Cannot be withdrawn yet).

---

## 3. Automated Escrow Release Cron (`release-escrow`)

Moja Bus runs a scheduled automated cron job (`/api/cron/release-escrow`) to release escrow funds into the operator's withdrawable balance:

```
                            [ SCHEDULED CRON: /api/cron/release-escrow ]
                                                  │
                                                  ▼
                               [ SCAN UNCLEARED CONFIRMED BOOKINGS ]
                               • status = CONFIRMED
                               • clearedAt IS NULL
                               • trip.status = ARRIVED
                               • actualArrival < (Now - 24 Hours)
                                                  │
                                                  ▼
                               [ BATCH BY HOLD GROUP & COMPANY ]
                               • Check for any cancelled seats
                               • Calculate proportional net
                                                  │
                                                  ▼
                               [ POSTGRESQL ADVISORY LOCK ]
                               • pg_advisory_xact_lock(companyHash)
                               • Prevents concurrent release race conditions
                                                  │
                                                  ▼
                               [ POST DOUBLE-ENTRY LEDGER ]
                               • Debit  OPERATOR_RECEIVABLE (releaseFromReserve)
                               • Credit OPERATOR_RECEIVABLE (available balance)
                                                  │
                                                  ▼
                               [ MARK BOOKINGS: clearedAt = now() ]
                               • Funds are now withdrawable by the operator!
```

### Safety Rules in Escrow Release:
- **24-Hour Settlement Buffer**: Protects passengers if an issue or dispute arises during or immediately after the journey.
- **Cancelled Seat Exclusions**: If a seat in a multi-passenger booking was cancelled, `computeEscrowReleaseNet` subtracts the cancelled proportion.
- **Snapshot Missing Fallback (H3)**: If a legacy booking lacks a `PricingSnapshot`, the cron falls back to `(farePaid * (10000 - defaultCommissionBps)) / 10000` so operator funds are never stranded indefinitely.

---

## 4. Operator Withdrawal Flow & Security Controls

Operators manage withdrawals in `apps/web/app/[locale]/dashboard/operator/(dashboard)/withdraw/page.tsx`.

```
                     [ OPERATOR REQUESTS WITHDRAWAL ]
                                     │
                                     ▼
                     [ 1. PERMISSION & GATING CHECK ]
                     • Role has "withdrawals:create"
                     • Verified bank account exists with `paystackTransferRecipientCode`
                                     │
                                     ▼
                     [ 2. PLATFORM RULES ENFORCEMENT ]
                     • Amount >= minWithdrawalAmount (Default 5,000 XOF)
                     • Last withdrawal older than withdrawalFrequencyHours (Default 24h)
                                     │
                                     ▼
                     [ 3. TWO-FACTOR AUTHENTICATION (F-18) ]
                     • If require2FAForWithdrawals is TRUE:
                       - Operator clicks "Send 2FA Code"
                       - Email OTP is hashed in `withdrawal_2fa_challenge`
                       - Operator provides code, verified with TTL & rate limits
                                     │
                                     ▼
                     [ 4. ATOMIC LEDGER POSTING ]
                     • Row-level lock on OPERATOR_RECEIVABLE
                     • Verify availableBalance >= requestedAmount
                     • Debit  OPERATOR_RECEIVABLE (Reduces available balance)
                     • Credit PAYSTACK_CLEARING   (Reduces physical gateway balance)
                                     │
                                     ▼
                     [ 5. PAYSTACK TRANSFER API DISPATCH ]
                     • POST https://api.paystack.co/transfer
                     • transfer_code received
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
             [ TRANSFER QUEUED ]             [ SYNC REJECTION ]
             Awaits Webhook                  • Execute PAYOUT_REVERSAL
                                             • Restore Operator Balance
                                             • Surface Error to User
```

---

## 5. Operator Rebooking System (Voucherless Rescheduling)

If a passenger misses their bus or requests a schedule change:
- Operator staff with `bookings:update` use `BookingDetailDrawer` (`apps/web/features/operator/components/bookings/booking-detail-drawer.tsx`).
- Reschedules the booking to a candidate upcoming trip on the same route/schedule.
- **Financial Architecture Advantage:**
  - Avoids refund fees and payment gateway interchange loss.
  - Links the original booking (`rebookedFromBookingId`) to the new booking (`rebookedToBooking`).
  - Preserves the original `PricingSnapshot` and escrow release timeline tied to the new departure date.
