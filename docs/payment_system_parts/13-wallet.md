# 13 - Wallet

[⬅️ Back to README](./README.md)

---

The `PASSENGER_WALLET` is a powerful feature of the Moja Ride platform that creates a closed-loop internal economy, reducing dependency on external payment processors and saving significant processing fees.

## The Model

The wallet is simply a `FinancialAccount` row where `accountClass = "PASSENGER_WALLET"` and `ownerType = "USER"`. It is a Liability account (Normal Balance: CREDIT), meaning the platform owes this money to the user.

### Balances
- `availableBalance`: Funds the user can spend immediately.
- `reservedBalance`: Funds currently locked in a `WalletReservation` during an active checkout session.
- `postedBalance`: The absolute sum.

## The Lifecycle

### 1. Ingestion (Top-Ups & Rescues)
Money enters the wallet in three ways:
1. **Explicit Top-Up**: The user clicks "Add Funds", pays via Paystack, and the `TOP_UP` transaction credits their wallet.
2. **Orphan Rescue**: A user pays for a ticket on Paystack, but their cart expires before the webhook arrives. The system automatically credits their wallet with the `ORPHANED_PAYMENT_RESCUE` transaction.
3. **Refunds**: An operator cancels a trip, and the user's funds are credited back to their wallet via a `REFUND` transaction.

### 2. Reservation (Checkout Intent)
When a user clicks "Pay with Wallet":
1. The system checks `availableBalance >= chargeAmount`.
2. It creates a `WalletReservation` row.
3. It updates the wallet: `availableBalance -= amount`, `reservedBalance += amount`.
This explicitly prevents double-spending if the user opens multiple tabs.

### 3. Consumption (Purchase)
The `BookingConfirmationService` confirms the tickets.
1. It creates the `WALLET_BOOKING` transaction.
2. The `AccountingEngine` debits the wallet's `reservedBalance`.
3. The `WalletReservation` row is marked `CONSUMED`.

### 4. Expiration (Cleanup)
If the user abandons the checkout at step 2, the `release-reservations` cron job runs after 10 minutes.
1. The cron sets the `WalletReservation` row to `EXPIRED`.
2. It updates the wallet: `reservedBalance -= amount`, `availableBalance += amount`.
The user's funds are safely returned to their spendable pool.

## Business Benefits
- **Zero Fees**: Wallet transactions do not incur Paystack's ~2% processing fee, resulting in pure profit margin improvement for the platform.
- **Instant Speed**: Wallet checkouts bypass the asynchronous webhook cycle entirely, resulting in sub-second confirmation times.
- **Loyalty**: The platform waives the Convenience Fee for wallet checkouts, encouraging users to keep cash inside the ecosystem.
