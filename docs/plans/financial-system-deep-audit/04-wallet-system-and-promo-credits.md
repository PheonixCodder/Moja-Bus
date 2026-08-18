# Chapter 4: Moja Wallet System & Promo Credits

## 1. Two Distinct Value Currencies

Moja Bus features two distinct digital balances available to travelers. While both reduce out-of-pocket costs at checkout, they have fundamentally different legal, accounting, and operational characteristics:

| Property | Moja Wallet (`PASSENGER_WALLET`) | Promo Credits (`PROMO_CREDITS` / `CreditLot`) |
|---|---|---|
| **Underlying Asset** | Real Fiat Cash ($XOF$) | Platform Promotional Subsidy ($XOF$) |
| **Funding Origin** | Passenger Paystack Top-Up or Booking Refund | Referral Reward, Welcome Grant, Goodwill, Loyalty |
| **Legal Status** | Custodial passenger liability owed by platform | Conditional marketing incentive owned by platform |
| **Withdrawable?** | **Yes** (Real cash) | **No** (Ticket discounts only) |
| **Expiration** | **Never** | **Yes** (Configurable date / lot expiry) |
| **Accounting Account** | `accountClass: "PASSENGER_WALLET"` | `accountClass: "PROMO_CREDITS"` |
| **Ledger Balancing Leg** | Funded by `PAYSTACK_CLEARING` | Funded by `PROMO_EXPENSE_PLATFORM` |
| **Checkout Benefit** | **Waives 2.5% Convenience Fee** | Lowers payable ticket base fare |
| **Anti-Fraud Controls** | Standard authentication & SMS OTP | Device Fingerprinting, IP Hash, Self-Referral Lock |

---

## 2. Moja Wallet Architecture

### Database Representation
- Model: `FinancialAccount` with `ownerType: USER`, `accountCategory: LIABILITY`, `accountClass: PASSENGER_WALLET`.
- `postedBalance`, `reservedBalance`, `availableBalance`.
- `allowNegativeBalance: false` (strictly enforced at PostgreSQL row lock level).

### Wallet Operations:
1. **Top-Up Flow**:
   - Traveler chooses an amount in `apps/web/app/[locale]/dashboard/(passenger)/wallet/page.tsx`.
   - Completes Paystack checkout $\rightarrow$ Webhook triggers `PaymentService.processTopUp`.
   - Ledger: Debit `PAYSTACK_CLEARING`, Debit `PAYMENT_PROCESSOR_FEES`, Credit `PASSENGER_WALLET`.
2. **Booking Payment Flow**:
   - Selected as checkout payment method in `booking-checkout-form.tsx`.
   - Waives convenience fee to $0\text{ XOF}$.
   - Ledger: Debit `PASSENGER_WALLET`, Credit `OPERATOR_RECEIVABLE` (escrowed) + `COMMISSION_REVENUE`.
3. **Refund Destination**:
   - When a passenger cancels a booking, choosing `channel: WALLET` immediately credits the full refundable ticket fare back to `PASSENGER_WALLET` without waiting for bank clearance.

---

## 3. Promotional Credits & Lot Mechanics (`CreditLot`)

Unlike cash, promotional credits expire and are tracked in discrete **lots** using First-In-First-Out (FIFO) exhaustion:

```
                                  [ PASSENGER PROMO LOTS ]
               ┌─────────────────────────────────────────────────────────────┐
               │ Lot #1: 1,000 XOF (Referral Grant)   · Expires in 5 Days   │ ◄── FIFO (Drawn First)
               ├─────────────────────────────────────────────────────────────┤
               │ Lot #2: 2,500 XOF (Welcome Promo)    · Expires in 30 Days  │ ◄── Drawn Second
               ├─────────────────────────────────────────────────────────────┤
               │ Lot #3: 5,000 XOF (Marketing Blast)  · Expires in 90 Days  │ ◄── Drawn Last
               └─────────────────────────────────────────────────────────────┘
```

### The `CreditLot` Model:
- `amountXOF`: Initial granted amount.
- `remainingXOF`: Unredeemed active amount.
- `reservedXOF`: Amount locked in active checkout hold groups.
- `source`: `REFERRAL`, `LOYALTY`, `ADMIN`, `PROMO_GRANT`, `GOODWILL`, `MARKETING_GRANT`.
- `status`: `PENDING` $\rightarrow$ `ACTIVE` $\rightarrow$ `PARTIALLY_REDEEMED` $\rightarrow$ `REDEEMED` / `EXPIRED` / `REVOKED`.

### Promo Grant Lifecycle:
1. **Grant Issued**: `CreditLot` created with `status: ACTIVE`.
2. **Ledger Recognition**: `postPromoCreditGrantLedger` executes:
   - Debit `PROMO_EXPENSE_PLATFORM` (Marketing expense recognized).
   - Credit `PROMO_CREDITS` (User liability recognized).
3. **Checkout Reservation**:
   - `QuoteService` calculates max usable credits from active lots.
   - Sets `reservedXOF` on `CreditLot` and creates `DiscountRedemption` with `status: RESERVED`.
4. **Checkout Confirmation**:
   - `finalizeDiscountRedemptions` permanently decreases `remainingXOF`.
   - If hold expires without payment, `releaseDiscountReservations` restores `reservedXOF` back to active balance.

---

## 4. Referral Program & Anti-Fraud Engine

Moja Bus features an automated referral reward pipeline configured in `ReferralProgram` and tracked via `ReferralEdge`:

```
 [ USER A (Referrer) ]                                  [ USER B (Referee) ]
       │                                                         │
       │ Shares referral code "UBAID-99"                         │
       └────────────────────────────────────────────────────────►│
                                                                 │ Signs up with code
                                                                 │ Creates ReferralEdge (ATTRIBUTED)
                                                                 │
                                                                 │ Completes Paid Booking
                                                                 ▼
                                                  [ REFERRAL QUALIFIED (48h Delay) ]
                                                  • Verifies Paid Confirmed Trip
                                                  • Anti-Abuse Checks Passed
                                                                 │
                                                                 ▼
                                                  [ REWARD ISSUED: CreditLot ]
                                                  • Referrer gets 1,000 XOF Lot
                                                  • Referee gets Welcome Coupon
```

### Fraud Prevention Rules:
- **`selfReferralBlock`**: Users cannot refer themselves or their own linked accounts.
- **`sameDeviceBlock`**: Browser fingerprint hash (`deviceHash`) is compared against prior claims.
- **`samePhoneBlock`**: Prevents recycling phone numbers across multiple referral accounts.
- **`rewardDelayHours` (Default 48h)**: Referral bonuses are held in `PENDING` state until 48 hours after the referee's bus departs, preventing instant booking-and-cancellation reward farming.
- **`maxQualificationsPerReferrerPerDay` (Default 10)**: Rate limits referral reward velocity.

---

## 5. Discount Campaign Funding Types

Moja Bus supports three discount funding models defined on `DiscountCampaign`:

1. **`PLATFORM`**:
   - 100% funded by Moja Bus.
   - The operator receives their full contracted net revenue.
   - Platform absorbs the discount as `PROMO_EXPENSE_PLATFORM`.
2. **`OPERATOR`**:
   - Funded by the bus operator (e.g. seasonal flash sale for a specific route).
   - The operator's net payout is reduced by the discount amount.
   - Tracked in `PROMO_CONTRA_OPERATOR` for financial reporting.
3. **`HYBRID`**:
   - Shared between platform and operator based on `platformShareBps` and `operatorShareBps` (e.g. 50/50 split).
