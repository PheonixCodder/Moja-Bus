# Database: Wallet Models

[⬅️ Back to Database Overview](./README.md)

---

## 1. `WalletReservation`

Protects against double-spending when a user pays via their wallet.

### Why does this exist?
If a user has 10,000 XOF in their wallet, and they open two tabs to buy two different 10,000 XOF tickets simultaneously:
- Tab A creates a `HoldGroup` and asks to pay with Wallet.
- Tab B creates a `HoldGroup` and asks to pay with Wallet.

If the system didn't reserve the funds immediately, both transactions might proceed to the confirmation step simultaneously, overdrawing the wallet.

### Fields
- `id` (String, PK, CUID).
- `accountId` (String): FK to `FinancialAccount` (must be `PASSENGER_WALLET`).
- `holdGroupId` (String): FK to `HoldGroup`.
- `amount` (BigInt): The amount reserved in XOF.
- `status` (Enum: `ACTIVE`, `CONSUMED`, `EXPIRED`, `CANCELLED`).
- `expiresAt` (DateTime): Matches the `holdExpiresAt` of the `HoldGroup`.
- `createdAt` / `updatedAt` (DateTime).

### Lifecycle
1. **Creation**: User selects "Pay with Wallet". System creates this row, debits `availableBalance`, and credits `reservedBalance` on the `PASSENGER_WALLET`.
2. **Consumption**: The checkout succeeds. The `BookingConfirmationService` moves the reservation to `CONSUMED` and fully deducts the money via the `AccountingEngine`.
3. **Expiration**: The user abandons the checkout. The `release-reservations` cron job finds this row where `expiresAt < now()`, sets it to `EXPIRED`, and returns the money from `reservedBalance` back to `availableBalance`.
