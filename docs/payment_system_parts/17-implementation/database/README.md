# 05 - Database Models (Overview)

[⬅️ Previous: 04 Chart of Accounts](../04-chart-of-accounts.md) | [Back to README](../README.md) | [Next: 06 Services ➡️](../06-services/README.md)

---

The database schema is the ultimate enforcement mechanism for the financial platform. Prisma is used as the ORM, but the financial core relies heavily on raw SQL `SELECT FOR UPDATE` and atomic `UPDATE` queries to guarantee integrity.

This section is divided into four sub-documents to cover every field, enum, index, invariant, and migration implication of the database.

### 📖 Sub-Documents in this Section:

1. **[Ledger Models](./ledger-models.md)**
   - `FinancialAccount`
   - `FinancialAccountSnapshot`
   - `FinancialTransaction`
   - `LedgerEntry`
   - *These models enforce the double-entry accounting rules and track the actual balance of money.*

2. **[Gateway Models](./gateway-models.md)**
   - `ExternalPayment`
   - `PaymentAttempt`
   - `WebhookEvent`
   - *These models interface with Paystack, track network attempts, and guarantee idempotency.*

3. **[Booking Models](./booking-models.md)**
   - `HoldGroup`
   - `PricingSnapshot`
   - `Booking`
   - *These models connect the user's intent (buying a seat) to the financial math.*

4. **[Wallet Models](./wallet-models.md)**
   - `WalletReservation`
   - *These models handle locking user funds during a checkout before the booking is confirmed.*

---

[Next: 06 Services ➡️](../06-services/README.md)
