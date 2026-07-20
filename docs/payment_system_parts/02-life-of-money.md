# 02. The Life of Money

To understand the Moja Ride payment system, you must understand where money *physically* and *virtually* lives at every second of a transaction.

This document traces the complete lifecycle of money—from a passenger's credit card or mobile money wallet, through the Moja Ride ledger, into escrow, and finally settled into an operator's bank account.

---

## The Core Timeline

### Phase 1: Passenger Authorization (T=0)
**Where is the money?** Passenger's Bank Account / Mobile Money Provider
**Virtual State:** None (Transaction Initialized)

When a passenger clicks "Pay", a `HoldGroup` is created to lock the seats, and an `ExternalPayment` record is created in our database with status `INITIALIZED`. 
No money has moved. Our ledger remains untouched. The passenger is redirected to the Paystack checkout screen.

### Phase 2: Gateway Capture (T+30 seconds)
**Where is the money?** Paystack's Master Settlement Account
**Virtual State:** `PAYSTACK_CLEARING` (Asset)

The passenger enters their card/mobile money details and authorizes the charge. 
The funds leave their bank account and are captured by Paystack. 
Paystack immediately fires a `charge.success` webhook to our system.

At this exact moment, our `PaymentService` instructs the `AccountingEngine` to recognize the funds:
1. **Debit `PAYSTACK_CLEARING`**: We assert that Paystack holds our money.
2. **Credit `OPERATOR_RECEIVABLE` (Reserved)**: We recognize a liability to the operator for the ticket base fare, but we place it in `reservedBalance` (Escrow) because the trip hasn't happened yet.
3. **Credit `COMMISSION_REVENUE` & `CONVENIENCE_FEE_REVENUE`**: We recognize our platform earnings immediately.
4. **Credit `PAYMENT_PROCESSOR_FEES` (Expense)**: We immediately deduct the expected Paystack fee.

### Phase 3: The Escrow Window (T+1 to Trip Departure)
**Where is the money?** Paystack's Master Settlement Account
**Virtual State:** `OPERATOR_RECEIVABLE` -> `reservedBalance`

For days or weeks before the trip, the money sits physically in Paystack.
Virtually, it is visible to the operator in their dashboard under "Upcoming Earnings" (which maps directly to `reservedBalance`). 
Because the funds are in `reservedBalance`, the operator **cannot** withdraw them. If the passenger cancels, the funds are debited directly out of this reserve.

### Phase 4: Trip Completion & Clearance (T+Trip + 24 Hours)
**Where is the money?** Physically, Paystack transfers it to Moja Ride's Corporate Bank Account on a T+1 rolling basis.
**Virtual State:** `OPERATOR_RECEIVABLE` -> `availableBalance`

24 hours after the `departureDate` of the trip, the automated `release-escrow` cron job runs.
It scans all bookings for that trip that were not cancelled or disputed.
It issues an `ESCROW_RELEASE` ledger transaction:
- **Debit `OPERATOR_RECEIVABLE` (Reserved)**
- **Credit `OPERATOR_RECEIVABLE` (Available)**

The operator's dashboard now shows the funds under "Available to Withdraw".

### Phase 5: Operator Withdrawal Request (T+Withdrawal)
**Where is the money?** Moja Ride's Corporate Bank Account (or a dedicated Paystack Balance if utilizing Paystack Transfers)
**Virtual State:** Transfer Pending

The operator clicks "Withdraw 50,000 XOF".
The `AccountingEngine` immediately secures the funds in the ledger:
1. **Debit `OPERATOR_RECEIVABLE` (Available)**: The operator's balance drops by 50,000 XOF instantly.
2. **Credit `PAYSTACK_CLEARING`**: We instruct the money to leave our system via Paystack Transfers.

An `ExternalPayment` (acting as a payout) is created with status `PENDING`. We call the Paystack Transfer API.

### Phase 6: Final Settlement (T+Withdrawal + 5 Minutes)
**Where is the money?** The Operator's Corporate Bank Account
**Virtual State:** Settled

Paystack executes the transfer over the banking rails to the operator's local Ivorian bank.
Paystack fires a `transfer.success` webhook.
We mark the `ExternalPayment` as `SUCCESS`.
The money has now completed its lifecycle. It has left the Moja Ride ecosystem entirely.

---

## Alternative Lifecycle: Passenger Cancellation

If the passenger cancels during **Phase 3** (Escrow Window):

**Where is the money?** Paystack Master Account -> Moja Ride Corporate Account
**Virtual State:** `PASSENGER_WALLET` (Available)

The `CancellationService` calculates the refund amount (usually base fare minus convenience fee).
Because Paystack API refunds have been deprecated for automation, the money is moved virtually:
1. **Debit `OPERATOR_RECEIVABLE` (Reserved)**: The operator loses the pending revenue.
2. **Debit `COMMISSION_REVENUE`**: Moja Ride reverses its commission (if applicable).
3. **Credit `PASSENGER_WALLET` (Available)**: The passenger instantly receives Moja Ride credits.

The passenger can now use these virtual wallet funds to book a different ticket, starting the lifecycle over at Phase 2, but utilizing the `WALLET_PAYMENT` transaction type instead of a credit card capture.
