# 08 - Crons (Overview)

[⬅️ Previous: 07 Workflows](../07-workflows/README.md) | [Back to README](../README.md) | [Next: 09 Webhooks ➡️](../09-webhooks/README.md)

---

Cron jobs are the cleanup crew of the financial platform. Because the architecture relies on asynchronous Webhooks and Escrow holds, cron jobs are required to move state forward when time passes, or fix state when network failures occur.

### 📖 Sub-Documents in this Section:

1. **[Reconcile Payments](./reconcile-payments.md)**
   - Runs every 5 minutes. Hunts for dangling transactions, missing webhooks, and failed withdrawals. Interrogates Paystack directly.
2. **[Release Escrow](./release-escrow.md)**
   - Runs daily. Sweeps operator funds from `reservedBalance` to `availableBalance` 24 hours after a trip arrives.
3. **[Snapshot Accounts](./snapshot-accounts.md)**
   - Runs daily/weekly/monthly. Captures point-in-time state of all balances for analytics and auditing without needing to replay the entire ledger.
4. **[Release Reservations](./release-reservations.md)**
   - Runs every minute. Unlocks user funds from `WalletReservation` if they abandon a wallet checkout.
