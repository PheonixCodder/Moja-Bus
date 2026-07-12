# Memory — Payment System, Novu Integration & BigInt Migration (Sprint 5 & 6)

Last updated: 2026-07-11

## What was built

- **Full Novu Notification Integration:** Configured and integrated Novu across all platforms for Admin, Passenger, and Operator workflows. Built 13 workflow triggers (e.g. `passenger-booking-confirmed`, `operator-withdrawal-requested`, `admin-treasury-network-failure`).
- **Notification Security:** Implemented comprehensive HTML escaping via a shared `escape-html.ts` utility for all user-provided payload variables (e.g., passenger names, reasons) used in Novu email templates to prevent XSS.
- **BigInt Financial Migration:** Successfully migrated all core ledger balance and transaction columns (`amount`, `postedBalance`, etc.) in Prisma to `BigInt` to support exact accounting for large values (XOF), replacing `Int`. Handled JSON serialization boundaries safely with `Number()` casts in tRPC routers and `AccountingEngine`.
- **Paystack & Wallet Resiliency:** Hardened all outbound Paystack API calls with `AbortSignal.timeout(30_000)` and robust try/catch blocks. Ensure database states appropriately track `PENDING` payment attempts or `FAILED` network issues *before* finalizing ledger deducts or marking transactions as settled.
- **Wallet Provisioning Safety:** Fixed `booking-confirmation-service.ts` to execute wallet account provisioning dynamically via the Prisma transaction client (`tx`) so that accounts cleanly roll back if the main transaction fails.
- **CodeRabbit Review Resolutions:** Fixed 37 specific issues raised by the automated code review tool, resolving UI labels, removing legacy column drops, removing unused properties in API requests, and standardizing error handling.
- **Workspace-wide Type Safety:** Successfully verified workspace typechecking after BigInt changes (`pnpm tsc --noEmit` exits with 0).

#### Paystack Provider & Client Updates
- Refactored `paystack-client.ts` to implement `paystackCreateTransferRecipient`, `paystackInitiateTransfer`, and `paystackVerifyTransfer`.
- Removed subaccount splits from `paystack-provider.ts` and `payment-service.ts`.
- Switched operator verification flow in `admin.ts` to register bank accounts as Transfer Recipients instead of Subaccounts.

- For Novu integration, user inputs used in Novu template payloads must be escaped before being sent to the Novu API, guaranteeing safe rendering in email clients.
- `BigInt` will be used exclusively at the database and logical layers for financial tables. We safely cast down to `Number()` only at the exact boundaries for tRPC JSON transmission because our frontend components and XOF maximums fit safely inside JavaScript's `MAX_SAFE_INTEGER`.
- For internal withdrawal network failures, transactions will be marked `PENDING` (funds reserved) and require an admin reconciliation, rather than rolling back immediately, so manual payout retries or verifications can take place.

## Architecture Decisions
- **Single Treasury Model**: All checkouts and top-ups route to Moja's central Paystack balance. Operators are treated purely as transfer recipients, simplifying accounting and resolving split settlement failures.
- **Double-Entry Ledger Integrity**: Withdrawals, reversals, and wallet checkouts are structured ledger entries via `AccountingEngine` to ensure mathematical and financial alignment (Σ Debit == Σ Credit).
- **Concurrency Locks**: Available balance validation during withdrawals holds an explicit `FOR UPDATE` postgres lock to prevent race conditions (double-payouts).

## Current State
- **Workspace Status:** 100% type-safe compilation. Running `pnpm tsc --noEmit` completes successfully with no errors or warnings across the workspace.
- **Payments:** End-to-end resilient.
- **Notifications:** Integrated and secure.

## Next Session Starts With
1. **Novu Studio Synchronization**: Sync our code-defined workflows to the Novu Cloud dashboard using `npx novu sync` and set up provider configurations.
2. **Booking Ownership Hardening:** Address anonymous passenger booking claim mechanisms (lazy-claim vs. explicit OTP verification).
3. **Operations Dashboard Oversight**: Clean up any remaining operator commission configurations to ensure compliance with ledger tiers.
