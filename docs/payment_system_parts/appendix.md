# Appendix

[⬅️ Back to README](./README.md)

---

## 1. Migration Strategy (Zero Downtime)

If the platform ever needs to migrate the underlying ledger technology or change the column types (e.g., from `BigInt` to a custom string-based large number format), the strategy is:
1. **Dual Write**: Deploy code that writes to the new schema and the old schema simultaneously.
2. **Backfill**: Run a script to copy historical data to the new schema.
3. **Verify**: Run a daily script that asserts `NewSchema.balance === OldSchema.balance`.
4. **Switch Read**: Point reads to the new schema.
5. **Drop Old**: Delete the old tables.

## 2. Handling Timezones
All financial calculations, snapshots, and expirations in Moja Ride are strictly calculated in **UTC**. The database `DateTime` columns must never store local timezone offsets. Any translation to West Africa Time (WAT) or Greenwich Mean Time (GMT) must happen exclusively in the UI layer.

## 3. Contact & P1 Escalation
If a critical ledger invariant fails (e.g., the Double-Entry Axiom is violated, or the Reconcile Payments cron starts failing continuously):
1. Immediately halt new checkouts by setting the environment variable `PAYMENTS_ENABLED=false`.
2. Do NOT attempt to manually write SQL to fix balances.
3. Page the Lead Engineer.
4. Use the `FinancialTransaction` history to reconstruct the correct state.

---
**End of Canonical Documentation.**
