# WalletReservation (Phase 03 / P2-4)

**Decision:** Keep the model + `release-reservations` cron for crash-safe balance release, but **do not wire new writers**. Checkout wallet debit locks `financial_account.availableBalance` inside the confirm transaction; there is no app path that creates `WalletReservation` rows today.

| Surface | Status |
|---------|--------|
| `WalletReservation` Prisma model | Retained (schema) |
| `/api/cron/release-reservations` | Retained — no-ops when table empty; safe if future writers appear |
| New checkout reservation writes | **Out** — not required for current wallet confirm |

If a future design needs pre-auth wallet holds across multi-step UI, reintroduce writers and document the lifecycle. Until then treat orphan ACTIVE rows as impossible in production traffic.
