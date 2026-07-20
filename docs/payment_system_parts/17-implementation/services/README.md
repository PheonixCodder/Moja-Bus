# 06 - Services (Overview)

[⬅️ Previous: 05 Database](../05-database/README.md) | [Back to README](../README.md) | [Next: 07 Workflows ➡️](../07-workflows/README.md)

---

The services layer is where the strict rules of the database meet the unpredictable nature of user interactions and external APIs.

Every service in the financial domain is designed with the following principles:
- **Never swallow errors**: If math doesn't add up, throw an exception immediately.
- **Explicit transaction boundaries**: `prisma.$transaction` is used extensively. If an external API call is required, it must happen *outside* the transaction boundary to prevent holding database locks during network latency.
- **Idempotency first**: Every service assumes it might be called twice with the same payload.

### 📖 Sub-Documents in this Section:

1. **[Accounting Engine](./accounting-engine.md)**
   - The most critical piece of code in the platform. Handles all double-entry ledger posting and row-level locking.
2. **[Financial Account Service](./financial-account-service.md)**
   - Manages the retrieval and lazy-creation of `FinancialAccount` rows.
3. **[Pricing Resolver](./pricing-resolver.md)**
   - Calculates immutable `PricingSnapshot`s for user checkouts.
4. **[Payment Service](./payment-service.md)**
   - Bridges Moja Ride to Paystack. Handles signature verification and webhook dispatching.
5. **[Booking Confirmation Service](./booking-confirmation-service.md)**
   - The orchestrator. Converts a successful payment into a confirmed booking and calls the `AccountingEngine` to settle the math.
