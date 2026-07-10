# Moja Ride — Complete Payment Systems Guide

This document describes the end-to-end architecture, data models, transaction lifecycles, and configuration rules for the payment system implemented in the Moja Bus platform. 

The system relies on **Paystack** for secure customer collections and automatic merchant split payments, backed by a robust transactional database ledger for operator reconciliation.

---

## 1. The Three Payment Systems

Moja Ride is a two-sided marketplace. Therefore, the payment system serves three distinct user roles: **Passengers**, **Operators**, and **Admins**.

### A. Passenger Payment System
**Goal:** A seamless, localized, and secure checkout experience.
- **Seat Reservation (HoldGroups):** When passengers select seats, a `HoldGroup` is created, holding the seats in a `PENDING` state (typically for 10 minutes) to prevent double-booking.
- **Dynamic Pricing:** The passenger is charged the **Base Fare** (set by the operator) plus a **Convenience Fee** (configured globally by the platform).
- **Checkout Process:** Passengers are redirected to a Paystack checkout URL. They can pay using Local Cards, International Cards, or Mobile Money.
- **Confirmation & Ticketing:** Upon successful payment, a webhook and an idempotent callback page verify the transaction. The booking is marked `CONFIRMED`, and a digital ticket (with a `ticketToken` for QR generation) is issued via SMS/Email.

### B. Operator Payment System
**Goal:** Automated payouts, transparent accounting, and full ERP integration.
- **Subaccount Onboarding:** During registration, operators provide their Bank Code and Account Number. The system encrypts this data (AES-256-GCM) and automatically creates a **Paystack Subaccount** for the operator.
- **Automated Split Payments:** When a passenger pays, the funds are automatically split by Paystack at the time of transaction. The operator instantly receives their cut (`operatorNetXOF`) directly into their subaccount/bank.
- **The Ledger System (`OperatorLedgerEntry`):** The platform maintains a double-entry ledger for every operator. Every successful ticket sale logs a `CREDIT` entry. This allows operators to view real-time revenue dashboards in their portal.
- **Offline / Cash Bookings:** Operators can manually log cash transactions via physical terminals. These bypass Paystack but are tracked in the system for full occupancy and revenue reporting.

### C. Admin Payment System
**Goal:** Revenue control, ledger auditing, and dispute resolution.
- **Platform Settings & Fees:** Admins control global financial parameters via `PlatformSettings`, setting the `defaultCommissionBps` (platform's cut) and `defaultConvenienceFeeBps` (passenger fee).
- **Dynamic Commission Tiers:** Admins can configure `CommissionDistanceTier` rules. This enables the platform to charge higher or lower commission percentages depending on the route's distance (e.g., lower commission for short routes, higher for long intercity routes).
- **Settlement & Ledger Auditing:** While Paystack handles automated splits, the Admin Dashboard includes a **Settlements Ledger**. If an operator's subaccount was pending during a sale, funds go to the master account. Admins can manually pay the operator and log a `DEBIT` entry to balance the operator's ledger.
- **Refund Management:** Admins handle disputes and initiate `Refund` records, selecting channels like `CASH`, `VOUCHER`, or `PAYSTACK`.

---

## 2. Pricing & Fee Calculations

All values are calculated in **CFA Francs (XOF)** using basis points ($1\% = 100 \text{ bps}$) to prevent floating-point rounding errors in financial transactions.

1.  **Commission Rate (`commissionBps`)**: The percentage the platform takes from the operator's base fare. It is dynamically determined by checking the route's distance against the `CommissionDistanceTier`. If no tier matches, it falls back to `defaultCommissionBps`.
2.  **Convenience Fee (`convenienceFeeBps`)**: The extra percentage charged to the passenger on top of the base fare, derived from `PlatformSettings`.

### Breakdown Formula:
For a booking of `seatCount` seats at `baseFareXOF`:
*   `subtotalBaseXOF = baseFareXOF * seatCount`
*   `convenienceFeeXOF = (subtotalBaseXOF * convenienceFeeBps) / 10,000`
*   `commissionXOF = (subtotalBaseXOF * commissionBps) / 10,000`
*   `chargeAmountXOF = subtotalBaseXOF + convenienceFeeXOF` (Total passenger pays)
*   `operatorNetXOF = subtotalBaseXOF - commissionXOF` (Total operator receives)
*   `platformGrossXOF = convenienceFeeXOF + commissionXOF` (Total platform revenue)

A `PricingSnapshot` record captures these exact figures at the moment of checkout to guarantee financial immutability, even if global rates change later.

---

## 3. Core Financial Database Models

The Prisma schema enforces strict transactional integrity across several models:

*   **PlatformSettings**: Stores global basis points for fees (`defaultCommissionBps`, `defaultConvenienceFeeBps`, and Paystack channel fees).
*   **CommissionDistanceTier**: Stores dynamic commission logic based on route distance (`minDistanceKm`, `maxDistanceKm`).
*   **HoldGroup & Booking**: Handles cart state. `HoldGroup` expires if unpaid, releasing seats. `Booking` represents the individual seat reservations.
*   **PricingSnapshot**: Frozen financial state attached to a `HoldGroup`.
*   **Payment**: Stores the payment intent (`provider`, `amountXOF`, `paystackReference`). Statuses: `INITIALIZED`, `PENDING`, `SUCCESS`, `FAILED`, `DISPUTED`, `REFUNDED`.
*   **PaymentAttempt**: Tracks retry attempts if a passenger's initial card fails.
*   **WebhookEvent**: Idempotently logs Paystack webhooks to prevent duplicate payment processing.
*   **OperatorLedgerEntry**: A double-entry style financial journal tracking operator balances.
    *   `CREDIT` entries increase the operator's balance (ticket purchases).
    *   `DEBIT` entries decrease their balance (payout settlements).
*   **Refund**: Tracks refunds (`amountXOF`, `channel: CASH | VOUCHER | PAYSTACK`, `status`).

---

## 4. End-to-End Transaction Lifecycle

1.  **Initialize Checkout**: 
    *   The web app makes a call to `PaymentService.initiate(...)` with the `holdGroupId`.
    *   A `Payment` record is created as `INITIALIZED` with a unique reference: `ref_[holdGroupId]_[attemptNumber]`.
2.  **Paystack Integration**:
    *   The service calls Paystack's `/transaction/initialize` with `chargeAmountXOF`.
    *   If the operator is onboarded, we pass `subaccount: paystackSubaccountCode` and `bearer: "account"` to trigger a split payment.
    *   Paystack returns an `authorizationUrl`. The passenger is redirected.
3.  **Payment Execution & Splitting**:
    *   The passenger completes payment using Card or Mobile Money.
    *   Paystack automatically deposits `operatorNetXOF` into the operator's subaccount, and the rest into the platform's merchant account.
4.  **Idempotent Verification**:
    *   The passenger is redirected back, triggering `verifyAndConfirm`.
    *   Paystack sends a `charge.success` webhook, triggering `handleWebhookEvent`.
    *   Both systems call `paystackVerify`. Once verified, `Payment` becomes `SUCCESS`.
5.  **Confirmation & Ledger Update**:
    *   `Booking` records update to `CONFIRMED` and `paymentStatus` to `PAID`.
    *   A `CREDIT` entry is inserted into `OperatorLedgerEntry` for `operatorNetXOF`.
    *   Tickets are issued to the passenger.

---

## 5. Security & Fallbacks

- **Data Security:** Operator bank account numbers are encrypted using AES-256-GCM (`enc:v1:` prefix) at rest and decrypted only during Paystack subaccount provisioning.
- **Webhook Idempotency:** The `WebhookEvent` model enforces unique constraints on the `idempotencyKey` to ensure a single network delay doesn't credit a user twice.
- **Manual Settlements:** If Paystack splits fail or an operator operates purely offline initially, the admin ledger (`OperatorLedgerEntry`) calculates exact balances (`SUM(CREDIT) - SUM(DEBIT)`). Admins can manually bank-transfer the balance and register a `DEBIT` to reconcile the platform.


I think the previous proposal is directionally good, but if I were reviewing this as the lead architect of a fintech-enabled marketplace, I would not approve it yet.

The reason isn't because the wallet idea is wrong. It's because **your payment architecture is currently centered around Payment**, while introducing a wallet changes your system into a **financial accounting platform**.

Those are very different architectures.

---

# First, let's look at what you have today

I actually think your payment system is much better than most startups build.

You already have the important concepts:

* HoldGroup
* immutable PricingSnapshot
* Payment
* PaymentAttempt
* PaymentEvent
* WebhookEvent
* Refund
* OperatorLedgerEntry

That's already heading toward an ERP instead of simple payment tables.

The problem is that **OperatorLedgerEntry is the only ledger in the system.**

That becomes an issue.

Today your money flow looks like

```
Passenger
      │
      │
      ▼
Paystack
      │
      ├────────────► Operator
      │
      ▼
Moja commission
```

Your platform never actually owns most of the money.

Paystack owns it during settlement.

That's why your current architecture is fairly simple.

---

# A wallet changes ownership of money

The moment a passenger tops up

```
Passenger

     100,000 XOF

        ▼

Moja Ride
```

Now Moja Ride is holding customer funds.

This is completely different.

Now your books must answer questions like

> How much customer money do we owe?

> How much operator money do we owe?

> How much is platform revenue?

> How much is still locked in checkout?

> How much has not settled?

Those questions are accounting questions.

Not payment questions.

---

# I actually think there is a bigger architectural shift

Right now you have

```
Payment
```

which represents

> "someone attempted to pay"

A wallet introduces another concept

> "movement of money"

Those are not the same thing.

Think about these examples.

Top up

```
Money moved
No booking
```

Refund

```
Money moved

No Paystack payment
```

Voucher

```
Money moved

No external gateway
```

Admin credit

```
Money moved

No payment
```

Referral reward

```
Money moved

No payment
```

Cash booking

```
Booking exists

No payment
```

Wallet purchase

```
Booking exists

No gateway
```

Notice something?

Payment is no longer the center.

Money movement is.

---

# Enterprise systems separate these

Large companies usually separate

## Payments

External gateways

```
Paystack

Stripe

Flutterwave

MTN

Orange

Wave
```

from

## Internal accounting

```
Wallet

Ledger

Balance

Settlement

Escrow

Reserve

Refund
```

Those are two different bounded contexts.

I think Moja is now big enough to separate them.

---

# I would introduce a Financial domain

Instead of

```
Payment System
```

I would mentally rename this entire area

```
Financial Platform
```

Inside it are several independent modules.

```
Financial
│
├── Pricing
│
├── Payments
│
├── Wallets
│
├── Ledgers
│
├── Settlements
│
├── Refunds
│
├── Reconciliation
│
└── Reporting
```

Notice how Payment is now only one piece.

---

# The thing I would change first

This is probably the biggest recommendation I have.

Today

```
OperatorLedgerEntry
```

exists.

That is operator-specific.

But ledgers shouldn't belong to operators.

They should belong to accounts.

Think accounting.

Instead of

```
OperatorLedgerEntry
```

I would think

```
FinancialAccount
```

Examples

```
Passenger Wallet

Operator Receivable

Platform Revenue

Platform Cash

Refund Reserve

Settlement Clearing

Marketing Credits
```

Each one becomes an account.

Then

```
LedgerEntry
```

moves money between accounts.

That's exactly how banks work.

---

Instead of

```
OperatorLedgerEntry

+5000

-2000

+700
```

you'd have

```
Debit
Passenger Wallet

Credit
Platform Cash
```

or

```
Debit
Platform Cash

Credit
Operator Receivable
```

Much more powerful.

---

# Why?

Because tomorrow you'll inevitably add

```
Wallet

Coupons

Promotions

Loyalty

Gift Cards

Corporate Accounts

Agency Credit

Travel Credits

Insurance Refunds

Offline Cash

Manual Adjustments
```

Every one of those becomes

```
Ledger entries
```

instead of inventing new tables.

---

# I would also separate Balance from Ledger

Never calculate balances by updating one integer alone.

Enterprise systems usually have

```
Wallet
```

```
Current Balance
Available Balance
Reserved Balance
Pending Balance
```

These are cached.

The source of truth is

```
WalletLedger
```

Every balance is derived from immutable entries.

If balance becomes corrupted

```
SUM(entries)
```

rebuilds everything.

That's huge for auditing.

---

# HoldGroup should become financially aware

Today HoldGroup knows

```
seatCount

fare

status
```

I think that's no longer enough.

A HoldGroup is actually becoming

```
Temporary Financial Contract
```

It knows

```
Price frozen

Seats frozen

Wallet reserved

Expires

Payment Method

Pricing snapshot

Risk status
```

It starts becoming an escrow.

---

# I would introduce Reservation of money

Suppose wallet balance

```
50,000
```

User starts checkout

```
45,000 ticket
```

Don't deduct immediately.

Reserve it.

Wallet

```
Available

50,000
```

↓

```
Available

5,000

Reserved

45,000
```

Only after booking succeeds

```
Reserved

0

Balance

5,000
```

That eliminates lots of rollback complexity.

Banks do this.

Hotels do this.

Airlines do this.

Uber does this.

---

# Refunds also change

Today

```
Refund
```

mostly means

```
Paystack refund
```

Tomorrow

Refund could be

```
Wallet refund

Gateway refund

Voucher

Partial refund

Seat downgrade

Operator cancellation

Admin adjustment

Promo compensation
```

Refund becomes more like

```
FinancialAdjustment
```

than just Paystack.

---

# Settlement deserves its own bounded context

Today

```
OperatorLedgerEntry
```

mixes

Revenue

Settlement

Adjustments

Everything.

I'd split it.

```
Sales Ledger

Settlement Batch

Transfer

Settlement Item

Settlement Failure

Settlement Retry
```

Now operators can see

```
Pending

Available

Transferred

Failed

Reversed
```

Exactly like Stripe Connect.

---

# One thing I strongly disagree with

The proposal suggested

```
Nightly cron

2 AM

Send operator money
```

I would not hardcode settlement around time.

Settlement should be policy-driven.

For example

```
Operator A

Instant

Operator B

Every 24 hours

Operator C

Weekly

Operator D

Minimum 50,000 XOF

Operator E

Manual
```

Now you're supporting enterprise operators.

Policies scale much better than cron assumptions.

---

# I would also think beyond wallets

Ask yourself

> "If in five years Moja becomes the transport infrastructure for West Africa, will this architecture still work?"

Imagine adding:

* Intercity buses
* Ferries
* Trains
* Flights
* Hotels
* Parcel delivery
* Corporate travel
* Agency bookings
* Driver payouts
* Insurance
* Loyalty points
* Promotional credits
* BNPL
* Multi-currency

A ledger/account architecture absorbs those changes with relatively few new concepts. A payment-centric architecture tends to accumulate special cases and duplicate logic.

## My overall assessment

I'd score your current payment architecture around **8.8–9.0/10**. It already demonstrates strong foundations: immutable pricing snapshots, idempotent webhook processing, payment attempts, operator ledgers, and separation between booking and payment.

To evolve into a platform with passenger wallets and future financial products, I would focus on these architectural shifts:

1. Treat **payments** and **accounting** as separate domains.
2. Introduce a first-class **wallet and ledger** system rather than extending `Payment`.
3. Generalize financial accounts so the model isn't operator-specific.
4. Use immutable ledger entries as the source of truth, with cached balances for performance.
5. Support reserved funds, available funds, and settlement states explicitly.
6. Make settlement policy-driven instead of time-driven.

If those principles are adopted, I think the financial architecture would move from "a booking platform with payments" to "a transportation marketplace with enterprise-grade financial infrastructure," giving you a foundation that can support much more than wallets over the coming years.
