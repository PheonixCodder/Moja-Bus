# Memory — Paystack Unified Treasury & Operator Withdrawals (Session 10 — UI Refactoring & Reconciler Complete)

Last updated: 2026-07-11

## What was built

### Paystack Unified Treasury Migration & Operator Withdrawals ✅
A complete transition from automatic Paystack subaccount splits to a unified Moja Treasury model with self-serve operator withdrawals.

#### New Prisma Models & Fields (`packages/db/prisma/schema.prisma`)
- Added `paystackTransferRecipientCode` to `Company` and `BankAccount` models.
- Added `clearedAt` to `Booking` model to track when booking funds clear escrow.
- Added `minWithdrawalAmount` and `withdrawalFrequencyHours` to `PlatformSettings`.
- Dropped `paystackSubaccountCode` from the database.

#### Paystack Provider & Client Updates
- Refactored `paystack-client.ts` to implement `paystackCreateTransferRecipient`, `paystackInitiateTransfer`, and `paystackVerifyTransfer`.
- Removed subaccount splits from `paystack-provider.ts` and `payment-service.ts`.
- Switched operator verification flow in `admin.ts` to register bank accounts as Transfer Recipients instead of Subaccounts.

#### Operator Withdrawals Flow
- Created `operator.requestWithdrawal` TRPC endpoint which checks limits, verifies available balance, locks accounts (`SELECT ... FOR UPDATE`), creates ledger entries (`OPERATOR_PAYOUT`), and initiates Paystack transfers.
- Added `OperatorWithdrawView` and page `/dashboard/operator/withdraw` allowing operators to view available vs escrow (pending) balances, withdrawal history logs (with status codes and fees), and request bank transfers.
- Added "Withdrawals" tab to the operator sidebar under Financials.

#### Paystack Webhooks & Automated Reconciler
- Extended `PaymentService.handleWebhookEvent` to capture `transfer.success`, `transfer.failed`, and `transfer.reversed` Paystack events.
- Created `/api/cron/reconcile-payments` cron endpoint running every 5 minutes in `vercel.json`. It reconciles pending withdrawals and passenger wallet top-ups/bookings in parallel using `Promise.allSettled` to prevent timeouts.

#### Booking Checkout Wallet Payments & Bookings History Modal
- Added `confirmFromWallet` in `BookingConfirmationService` and `booking.checkoutWithWallet` TRPC mutation.
- Refactored `booking-checkout-form.tsx` to let passengers pay with internal wallet balances. Applies a zero convenience fee policy and confirms bookings instantly.
- Refactored `passenger-bookings-view.tsx` to open an interactive payment selector dialog, enabling travelers to resume holds in their history using their Moja Wallet Balance (with waived convenience fees) or Card/Mobile Money.
- Integrated `formatHeaderDate` inside `operator-trips-view.tsx` to prevent date discrepancy caused by double-timezone shifting on day headers.
- Upgraded the shared `TicketScanner` component to support both live camera scans and manual text entry, and embedded it on the Operator Dashboard page to replace the non-functional mock scanner.

## Architecture Decisions
- **Single Treasury Model**: All checkouts and top-ups route to Moja's central Paystack balance. Operators are treated purely as transfer recipients, simplifying accounting and resolving split settlement failures.
- **Double-Entry Ledger Integrity**: Withdrawals, reversals, and wallet checkouts are structured ledger entries via `AccountingEngine` to ensure mathematical and financial alignment (Σ Debit == Σ Credit).
- **Concurrency Locks**: Available balance validation during withdrawals holds an explicit `FOR UPDATE` postgres lock to prevent race conditions (double-payouts).

## Current State
- Schema: Unified treasury migrations applied and verified in PostgreSQL. ✅
- Paystack Provider: Configured to support transfers, recipient generation, and transfer verification. ✅
- Operator Withdrawals: Self-serve withdrawal, balance checks, and withdrawal log history tables fully active. ✅
- Payout Webhooks & Cron Reconciler: Automated webhook processor and 5-min cron self-healer fully active. ✅
- Booking Checkout: Real-time wallet balance checks, toggle selection, and zero-fee checkout fully active. ✅
- Resumed Holds: Completed payment dialog modal on Bookings list page fully active. ✅
- UI Cleanups: Removed all stale subaccount and dynamic split config copy from admin views. ✅
- Novu Notification Integration: Framework setup, 5 core authentication/invitation workflows, and TRPC trigger bindings fully active. ✅
- TypeScript Compilation: achieves 100% type safety with **0 compile errors** on `web`. ✅

## Next Session Starts With
1. **Novu Studio Synchronization**: Sync our code-defined workflows to the Novu Cloud dashboard using `npx novu sync` and set up provider configurations.
2. **Booking Ownership Hardening:** Address anonymous passenger booking claim mechanisms (lazy-claim vs. explicit OTP verification).
3. **Operations Dashboard Oversight**: Clean up any remaining operator commission configurations to ensure compliance with ledger tiers.
