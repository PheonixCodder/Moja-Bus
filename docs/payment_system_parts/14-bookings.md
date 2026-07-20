# 14 - Bookings

[⬅️ Back to README](./README.md)

---

The Booking Workflow is the most executed path in the Moja Ride platform. It involves inventory locks, external payments, asynchronous webhooks, and double-entry accounting.

## The Paystack Booking Flow (End-to-End)

### Step 1: Intent (The Client)
- Passenger selects a trip and seats on the UI.
- Clicks "Checkout".

### Step 2: The Hold (The API)
- Client calls `createHold` tRPC procedure.
- System queries `Booking` table. If `(tripId, seatId, status != EXPIRED/CANCELLED)` exists, throws "Seat unavailable".
- Creates `HoldGroup` (`status = ACTIVE`, expires in 10 mins).
- Creates `Booking` rows (`status = PENDING_PAYMENT`).
- Calls `PricingResolver` to create immutable `PricingSnapshot`.

### Step 3: Payment Initialization
- Calls `PaymentService.initializePayment()`.
- Requests a Paystack URL.
- Creates `ExternalPayment` (`status = PENDING`).
- Returns the Paystack checkout URL to the client.

### Step 4: Execution & Waiting
- Client redirects user to Paystack.
- User enters card details, goes through 3D Secure.
- *At this point, the Moja Ride server is doing absolutely nothing. It is fully asynchronous.*

### Step 5: Webhook Delivery
- Paystack POSTs `charge.success` to our webhook endpoint.
- `PaymentService.handleWebhookEvent()` verifies the HMAC-SHA512 signature.
- Upserts the event into `WebhookEvent` table using `idempotencyKey`.
- Routes payload to `BookingConfirmationService.confirmFromPayment()`.

### Step 6: The Confirmation & Ledger Post
- `BookingConfirmationService` opens a `prisma.$transaction`.
- Checks if `HoldGroup` is expired. (If yes -> branch to Orphan Rescue).
- Updates `Booking` statuses to `CONFIRMED`.
- Updates `HoldGroup` status to `CONFIRMED`.
- Instantiates `AccountingEngine("BOOKING")`.
- Debits Paystack Clearing (Asset).
- Debits Paystack Fee (Expense).
- Credits Operator Receivable (Liability) -> **Into `reservedBalance`**.
- Credits Platform Commission (Revenue).
- Credits Platform Convenience Fee (Revenue).
- Commits the transaction. All accounts are updated atomically.

### Step 7: Notification
- Dispatches SMS/Email to user with their e-ticket.

---

## The Wallet Booking Flow

When a user selects "Pay with Wallet", the flow bypasses Paystack entirely, making it completely synchronous and significantly faster.

### Step 1: Reservation
- Instead of calling Paystack, the system verifies `PASSENGER_WALLET.availableBalance >= chargeAmountXOF`.
- If true, it immediately executes an `AccountingEngine("WALLET_RESERVATION")` transaction internally, or creates a `WalletReservation` row that locks the funds by moving them from `availableBalance` to `reservedBalance`.

### Step 2: Instant Confirmation
- Because the money is guaranteed, the system immediately proceeds to Step 6 of the Paystack flow.
- The `AccountingEngine("WALLET_BOOKING")` is constructed.
- **Differences in Accounting**:
  - Instead of debiting `PAYSTACK_CLEARING`, it debits `PASSENGER_WALLET`.
  - There is no `PAYMENT_PROCESSOR_FEE` debit.
  - There is no `PLATFORM_CONVENIENCE_FEE` credit (it is waived as a perk).

### Step 3: Cleanup
- The `WalletReservation` is marked as `CONSUMED`.

---

## Failure Branches & Recovery

### 1. User Abandons Checkout
If the user closes the tab at Paystack, the webhook never arrives.
- The `HoldGroup` expires quietly after 10 minutes.
- The next person to search for that seat will see it as available because `HoldGroup.holdExpiresAt < now()` evaluates to true in the seat availability query.

### 2. Network Timeout during Initialization
If Paystack takes 30 seconds to return a URL and the client times out.
- The `HoldGroup` remains. It will naturally expire in 10 minutes. Safe.

### 3. Duplicate Webhook Storm
If Paystack sends `charge.success` 5 times concurrently.
- The `WebhookEvent` table's unique index on `idempotencyKey` rejects 4 of the 5 requests at the database driver level. Only 1 proceeds to `BookingConfirmationService`. Safe.

### 4. The Orphaned Payment (Late Webhook)
The user takes 15 minutes to find their wallet and type their OTP. The bank approves it.
- Paystack sends `charge.success`.
- `BookingConfirmationService` sees the `HoldGroup` is `EXPIRED`.
- **DANGER**: It cannot confirm the seats, because someone else might have bought them at minute 11.
- **Recovery**: It executes an `ORPHANED_PAYMENT_RESCUE` ledger transaction. It debits Paystack and credits the user's `PASSENGER_WALLET`. The user is notified that they ran out of time, but their money is safe in their wallet.
