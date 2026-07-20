# Cron: Release Reservations

[⬅️ Back to Crons Overview](./README.md)

---

**File:** `apps/web/app/api/cron/release-reservations/route.ts`

The `release-reservations` cron job cleans up orphaned `WalletReservation` rows to ensure passenger funds do not remain permanently locked.

## The Problem
When a user selects "Pay with Wallet" during checkout, the system immediately moves their funds from `availableBalance` to `reservedBalance` in their `PASSENGER_WALLET`. This prevents them from double-spending those funds in another tab.

However, if the user navigates away from the checkout page before confirming the final booking, the funds remain in `reservedBalance`. If left unchecked, the user would permanently lose access to their money.

## How it works

The cron runs continuously (e.g., every minute).

### Internal Algorithm
1. **Query**: Find all `WalletReservation` rows where `status = ACTIVE` and `expiresAt < NOW()`.
   - The `expiresAt` is always aligned identically with the `HoldGroup.holdExpiresAt` (typically 10 minutes after creation).
2. **Database Transaction**:
   - Opens `prisma.$transaction`.
   - Executes a bulk `UPDATE` on the `WalletReservation` table setting `status = EXPIRED`.
   - Iterates over the expired reservations.
   - For each, executes an `UPDATE` on the `FinancialAccount` table:
     ```typescript
     prisma.financialAccount.update({
       where: { id: r.accountId },
       data: {
         reservedBalance: { decrement: r.amount },
         availableBalance: { increment: r.amount },
       },
     })
     ```

## Failure Modes
Because the decrement and increment happen entirely within relative SQL commands, it is immune to read-modify-write race conditions. If the transaction fails, the funds remain in `reservedBalance`, and the cron will attempt to free them again on its next execution tick.
