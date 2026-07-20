# Moja Ride Payment & Pricing Architecture Guide

This guide explains exactly how money moves through the Moja Ride platform, from the moment an operator sets a price to the final payout in their bank account.

---

## 1. Ticket Pricing Hierarchy

When an operator creates a ticket schedule, the price they enter is the **Base Fare**. The platform makes money in two distinct ways:

### A. Commission (Operator Side)
- **Who pays this:** The Operator.
- **How it works:** Moja Ride takes a percentage of the Base Fare (e.g., 5%).
- **Visibility:** The passenger never sees this. The passenger pays the Base Fare, but the Operator receives `Base Fare - Commission`.
- **Example:** Operator sets ticket at `10,000 XOF`. Commission is `500 XOF`. 
  - Operator Net Payout = `9,500 XOF`.
  - Platform Gross Revenue = `500 XOF`.

### B. Convenience Fee (Passenger Side)
- **Who pays this:** The Passenger.
- **How it works:** An additional fixed or percentage fee added on top of the Base Fare at checkout.
- **Visibility:** Only the passenger pays this.
- **Example:** Base Fare is `10,000 XOF`. Convenience fee is `250 XOF`.
  - Total passenger charge = `10,250 XOF`.

---

## 2. Search vs. Checkout

### Search UI
In the search results, the passenger sees the **Total Base Fare**. If they search for 3 passengers for a `10,000 XOF` ticket, the search UI displays `30,000 XOF`. This prevents "drip pricing" confusion and shows them exactly what the core ticket costs for their group.

### Checkout & Payment Methods
When the passenger reaches the checkout stage, they select a payment method. The payment method determines the final price:
- **Direct Payment (Paystack / Mobile Money):** The convenience fee is *applied*. Total = `30,000 XOF + Convenience Fee`.
- **Wallet Payment:** To incentivize user retention and loyalty, the convenience fee is **waived** when paying from the Moja Ride wallet. Total = `30,000 XOF`.

---

## 3. The Double-Entry Ledger (Accounting Engine)

Moja Ride uses a strict double-entry accounting system. Every transaction must balance (Debits = Credits).

### Key Accounts
1. **`PAYSTACK_CLEARING` (Asset):** Represents money held by Paystack on our behalf.
2. **`PASSENGER_WALLET` (Liability):** Represents money we owe to a user.
3. **`OPERATOR_RECEIVABLE` (Liability):** Represents money we owe to an operator for their sold tickets.
4. **`PLATFORM_FEES` (Revenue):** Money Moja Ride keeps as profit.
5. **`PAYMENT_PROCESSOR_FEES` (Expense):** Money we lose to Paystack for transaction processing.

---

## 4. Lifecycle of a Booking

Let's trace a standard direct booking of `10,000 XOF` (with `250 XOF` convenience fee and `150 XOF` Paystack processing fee). Total charge: `10,250 XOF`.

### The Accounting Entry:
1. **Debit `PAYSTACK_CLEARING` (10,100 XOF):** We gain an asset, but minus the Paystack fee.
2. **Debit `PAYMENT_PROCESSOR_FEES` (150 XOF):** We log the expense of the Paystack fee.
3. **Credit `OPERATOR_RECEIVABLE` (9,500 XOF):** We now owe the operator their Base Fare minus commission.
4. **Credit `PLATFORM_FEES` (750 XOF):** We record our revenue (500 XOF Commission + 250 XOF Convenience Fee).

*(Total Debits = 10,250. Total Credits = 10,250. Ledger balances perfectly).*

---

## 5. Wallet Top-Ups

When a user tops up their wallet via Paystack for `5,000 XOF` (and Paystack charges a `100 XOF` fee):
1. **Debit `PAYSTACK_CLEARING` (4,900 XOF)**
2. **Debit `PAYMENT_PROCESSOR_FEES` (100 XOF)**
3. **Credit `PASSENGER_WALLET` (5,000 XOF)**

Notice that Moja Ride absorbs the Paystack fee for the top-up. The user gets their full `5,000 XOF` balance to use on future waived-convenience-fee rides.

---

## 6. Operator Payouts (Withdrawals)

When an operator requests a withdrawal of `9,500 XOF` from their dashboard, and Paystack charges a `50 XOF` transfer fee:

1. **Debit `OPERATOR_RECEIVABLE` (9,500 XOF):** We reduce the liability we owe them.
2. **Credit `PAYSTACK_CLEARING` (9,500 XOF):** We instruct Paystack to send the money.

Immediately following this, the system logs the transfer fee:
1. **Debit `PAYMENT_PROCESSOR_FEES` (50 XOF):** We log the transfer expense.
2. **Credit `PAYSTACK_CLEARING` (50 XOF):** Paystack deducts this fee from our clearing balance.

### Summary
By carefully tracking the `PAYMENT_PROCESSOR_FEES` in all three directions (Booking, Top-up, Payout), the Admin Dashboard can calculate exact Net Income, and the `PAYSTACK_CLEARING` account will always mathematically match the exact balance shown in the real-world Paystack dashboard.
