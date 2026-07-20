# 07 - Workflows (Overview)

[⬅️ Previous: 06 Services](../06-services/README.md) | [Back to README](../README.md) | [Next: 08 Crons ➡️](../08-crons/README.md)

---

The Workflows section describes the complete, end-to-end traversal of business processes. These are the chronological lifecycles that touch multiple models, services, and external APIs.

Because these workflows are extensive, they have been broken out into dedicated root-level documents.

### 📖 Workflows Documented:

1. **[14 Bookings](../14-bookings.md)**
   - The complete lifecycle of a passenger selecting a seat, holding it, paying for it, and the resulting financial orchestration. Covers Paystack, Wallet, and failure edge cases.
2. **[15 Refunds](../15-refunds.md)**
   - Returning money to users gracefully. Covers partial refunds, escrow implications, and wallet vs. card returns.
3. **[16 Withdrawals](../16-withdrawals.md)**
   - The most dangerous workflow. Paying transport operators their cleared revenue. Covers row-level locking, Paystack Transfers, and failure reversals.
4. **[17 Ledger Definitions](../17-ledger.md)**
   - An exhaustive list of every single `FinancialTransaction` type, what triggers it, and the exact debit/credit entries it produces.

---

[Next: 08 Crons ➡️](../08-crons/README.md)
