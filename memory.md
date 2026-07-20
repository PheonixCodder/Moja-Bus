# Memory — Fleet/Routes/Terminals Enterprise Audit (Session — 2026-07-19)

Last updated: 2026-07-19 (Phase 7 low-issues — COMPLETE: L1–L15 all resolved)

## What was done
Read-only enterprise readiness audit of operator **Fleet**, **Routes**, and **Terminals** domains (pages, views, modals, routers). No code changes.

## Highest-severity findings (carry forward)
- Routes/Terminals pages prefetch without IAM gates; views lack `useStaffPermissions` gates (unlike Fleet). FINANCE (`routes:read` only) breaks on `terminals.list` prefetch/Suspense.
- `routes.create`/`update` do not require terminals to be `isTerminal` + `isActive`; demoting `isTerminal` while linked to routes is unguarded.
- Monolith views: fleet ~1170 LOC, routes ~1475, terminals ~1076; layout-builder ~871.
- Terminals form placeholders include French UI text (English-only violation).
- No pagination on fleet/routes/terminals lists; soft-delete UX claims "permanent" for buses.

## Current state
Audit report delivered to parent/user. Prior remediation Phases 0–8 still apply for other domains.

## What comes next
Prioritize IAM-gated prefetch + client permission empty states for routes/terminals; guard route terminal eligibility; remove French placeholders; split monoliths.

---

## Session — 2026-07-19: Phase 5 verification + H25 completion (code changes made)

### What was done
- Verified all 12 non-H25 Phase 5 items are implemented in code (H2, H3, H4, H5, H6, H7, H8, H15, H17, H18, H20, H24). Confirmed against actual source, not just the prior transcript.
- Completed **H25** (systemic money refactor): converted remaining `Number(bigint)` balance/amount conversions to `toSafeDisplayNumber` / `formatXOF` across:
  - `trpc/routers/passenger.ts` (wallet balances + ledger amount)
  - `trpc/routers/search.ts` (fare.priceXOF)
  - `features/payments/services/booking-confirmation-service.ts` (Novu payload)
  - `features/payments/payment-service.ts` (reversal engine amounts + Novu amount)
  - `features/admin/components/ledger-columns.tsx`, `ledger-kpi-cards.tsx`
  - `features/operator/components/revenue/balance-overview-cards.tsx`, `transaction-ledger-table.tsx`, `arrears-alert-banner.tsx`
  - `lib/money.ts` (`toXOFBigInt` / `toSafeDisplayNumber` / `formatXOF` / `compareXOF` / `sumXOF`) was already the established helper.
- Updated `artifacts/operator-dashobard-audit-fix-phases/tracker.md`: Phase 5 → ✅ 13/13; corrected the stale bottom "Summary Totals" (Phases 3–4 were wrongly 0 completed); overall Total now 37/80 done, 43 remaining.

### Notes / carry-forward
- `apps/web` typecheck is GREEN for all edited files. Pre-existing, unrelated error remains in `trpc/routers/routes.ts:83,156` (`'type' does not exist in CompanyLocationWhereInput`) — schema/client mismatch, NOT touched, out of Phase 5 scope.
- H8 deviation (non-blocking): check-in allows BOARDING|DELAYED|DEPARTED, whereas the audit recommended BOARDING only. More permissive, operationally fine.
- After Phase 5, remaining audit work = Phase 6 (28 medium, 15 remaining) + 15 new features (Phase 7 complete: L1–L15).

---

## Session — 2026-07-19: Phase 7 low-issues (L-items)

### Docs + small fixes done
- L2, L6, L9, L12, L15 already resolved in prior work (tracker reflected).
- **L3** ✅: Novu cancel-trip payload now sends `refundStatus: "success" | "failed"` and omits `refundAmountXOF` on failure (`lib/cancel-trip-with-refunds.ts`).
- **L4** ✅: notifications use Novu hosted `<Preferences/>` (`notification-preferences.tsx`) — authoritative, gates delivery.
- **L13** ✅: `SeatStatus` enum DEPRECATED + `TripSeat.isActive` documented as physical-usability-only in `schema.prisma`.
- **L14** ✅ (Option A): `getOnboardingStatus` exposes `bankVerified`; `BankStep` shows honest two-stage sub-step. The literal guard would freeze onboarding until admin KYC (recipients are admin-created), so withdraw-side `bankVerified` stays the enforcement point.
- **L1** ✅: `trips.get` split into `getManifest` (manifest drawer) + lazy `getSeatMap` (Seat Map tab) — manifest opens without loading the full seat map.
- **L5** ✅: `operator.globalSearch` (bookings/trips/staff, IAM-gated) + command-palette entity groups (debounced server search).
- **L7** ✅: `bulkCheckInBookings`/`bulkCancelBookings` mutations + manifest drawer toolbar (Check In All, multi-select, bulk cancel w/ reason). Refunds route to WALLET (all bookings are account-linked).
- **L8** ✅: aria-labels on bus-assign combobox + cancel-reason inputs; manifest Drawer now `modal` (focus trap + ESC/scroll-lock).
- **L10** ✅: `tracker.md`, `phase-7-low-issues.md`, `memory.md` updated to reflect actual code state (L1/L5/L7 were implemented but previously listed ⬜).
- **L11** ✅: `Review.response`/`respondedAt` schema fields (generated + pushed) + `operator.listReviews`/`respondToReview` + Reviews nav item/page/view.

### Phase 7 — COMPLETE (all L1–L15 resolved)
All low-priority items are now implemented and the tracker/docs are in sync. Phase 7 tracker: 15/15. This closes out the audit's 80-issue backlog except Phase 6 (28 medium, 15 remaining) and the 15 new features.

### Tracker location
- `artifacts/operator-dashobard-audit-fix-phases/tracker.md` (Phase 7: 15/15 — all L1–L15 ✅)
- `artifacts/operator-dashobard-audit-fix-phases/phase-7-low-issues.md`

---

## Session — 2026-07-20: Moja Ride payment-system audit remediation (audit/01 + 10)

### Context
Continuation of the payment-system enterprise audit on the `improvements` branch. Earlier (prior sessions) resolved: F-16 (over-sale FOR UPDATE), F-17 (withdrawal idempotency), F-19 (recordSettlement idempotency+note+balance), F-18 (withdrawal 2FA+frequency), F-21 (admin FORCE_FAIL fee reversal). This session closed the remaining OPEN money findings + logged user decisions.

### Code changes made (uncommitted working tree)
- **F-22** ✅: `trpc/routers/admin.ts` now imports `logBankAccess` (`lib/bank-access.ts`) and calls it (`action:"VIEW_FULL"`) at both plaintext reveal sites — pending-bank company-verify flow (~line 371) and `verifyBankAccount` (~line 893). Mirrors operator reveals.
- **F-23** ✅: `verifyBankAccount` `$transaction` now takes `SELECT … FOR UPDATE` on `company` at the start (serializes per-company verifications) and, when setting `isDefault=true`, `bankAccount.updateMany` clears other company defaults → exactly one default.
- **F-26** ✅: **Deleted** `apps/web/lib/financial-calculations.ts` (confirmed zero importers — grep returned nothing). Removes the divergent dead trap (`Math.floor` vs live `Math.round`, 6-type allowlist, 100M cap).
- **F-24** ✅: `features/payments/services/cancellation-service.ts` — when `holdGroup.pricingSnapshot` is null, reads `PlatformSettings.defaultCommissionBps` (fallback 500) and derives `commission = round(proportionalBase × bps / 10_000)`, reducing `proportionalOperatorNet` so the commission is clawed back (was skipped → under-collection). Ledger stays balanced (`proportionalOperatorNet + commissionAmount = refundAmountXOF`). Snapshot path untouched.

### Docs-only resolutions (no code change)
- **F-03** ✅ resolved (docs): `AccountingEngine` already falls back to `tx.id-seq` when no explicit key; F-17/F-19/F-21 pass explicit keys inside `FOR UPDATE`.
- **F-20** ✅ resolved (docs): `processTopUp` already money-safe via `@@unique([externalPaymentId, type])` + graceful P2002.

### User decisions recorded (report §9 — no code change)
- **F-01** ACCEPTED DIVERGENCE: keep `number` in `AccountingEngine` (safe today); document.
- **F-05** RESOLVED (docs): update spec to match code account-class names (code authoritative).
- **F-31** ACCEPTED: keep log-only (`CANCEL_WITHOUT_REFUND` + `CANCELLED`) + ops runbook; no retry/escalation feature this session.
- **F-13 / F-14** ACCEPTED (documented): Node-only crypto / keep ÷100 in sync with F-11.

### Verification
- `cd apps/web && pnpm typecheck` → only pre-existing errors (operator `layoutTemplate`→`layoutTemplateId`, `fleet.ts:83`, `payments.ts:461` exactOptionalPropertyTypes). **No new errors** from admin.ts / cancellation-service.ts / deleted file.
- `pnpm test` → only the pre-existing unrelated failure `lib/__tests__/trip-status-cancel.test.ts`. No new failures.
- Manual DB/concurrency checks NOT run here (no live DB) — documented as manual verification steps in audit files.

### Constraints honored
- Did NOT commit (working tree only).
- Updated `audit/01-tracker.md` (findings index + RE-VERIFICATION table + Files Status) and `audit/10-enterprise-readiness-report.md` (§2, §4 D-1/D-2, §5, §6 verdict, §7 resolved/open tables, new §9 decisions).

### Carry-forward
- Low/benign (F-02, F-04, F-10, F-15, F-27, F-28, F-30) accepted / out of scope unless asked.
- No open HIGH or un-resolved money-correctness findings remain; remaining items are all accepted divergences or documentation.

### F-34 addendum (release-reservations cron) — completed this session
- The robust fix for the double-release + crash-recovery gap is now fully in code. `WalletReservation.releasedAt DateTime?`, migration `20260720140000_add_wallet_reservation_released_at`, and the audit-doc entries (tracker F-34 + report §2/§5/§7) were **already staged in a prior session**; the only missing piece was the route rewrite, which I completed: `apps/web/app/api/cron/release-reservations/route.ts` now (1) flips ACTIVE→EXPIRED idempotently, (2) finds EXPIRED+releasedAt:null, (3) releases inside a `$transaction` only for reservations claimed via an atomic `updateMany({ where: { id, releasedAt: null }, data: { releasedAt } })` returning `count === 1`. Prisma `increment`/`decrement` keep same-account updates atomic (no `FOR UPDATE` needed).
- `pnpm --filter @moja/db generate` run (client regenerated, v7.8.0). typecheck: only the pre-existing errors (operator `layoutTemplate`, `fleet.ts:83`, `payments.ts:461`); tests: only the pre-existing `trip-status-cancel` failure. No new errors.
- **Migration not applied** (Neon DB auto-pauses; no live DB here) — must run `prisma migrate deploy` when DB is reachable. Not committed (per constraint).

---

## Session — 2026-07-20 (later): F-34 release-reservations cron double-release fix

### Code changes (uncommitted working tree, `improvements` branch)
- **F-34** ✅: Fixed the `release-reservations` cron double-release + crash-recovery gap.
  - `packages/db/prisma/schema.prisma`: added `releasedAt DateTime?` to `WalletReservation`.
  - New migration `packages/db/prisma/migrations/20260720140000_add_wallet_reservation_released_at/migration.sql` (`ALTER TABLE wallet_reservation ADD COLUMN "releasedAt" TIMESTAMP(3)`). NOTE: DB was likely paused — only `prisma generate` run (client types updated); migration NOT applied live. Needs `prisma migrate deploy` against a live DB before shipping.
  - `apps/web/app/api/cron/release-reservations/route.ts`: rewrite — (1) idempotent ACTIVE→EXPIRED flip; (2) release only reservations claimed via atomic `releasedAt` flip (`updateMany where releasedAt:null`, `count===1`); Prisma `increment`/`decrement` keep same-account updates atomic; recovers EXPIRED-not-released left by a crashed run.
- **Verification:** `pnpm typecheck` → only pre-existing errors (operator `layoutTemplate`→`layoutTemplateId`, `fleet.ts:83`, `payments.ts:461`); no new errors. `pnpm test` → only pre-existing `lib/__tests__/trip-status-cancel.test.ts` failure. Did NOT commit.
- **Docs:** added F-34 to `audit/01-tracker.md` (findings index + Files Status) and `audit/10-enterprise-readiness-report.md` (§5 concurrency table + §7 resolved table).

### Note for next session
- Before merge, run `prisma migrate deploy` (or `migrate dev`) against a live Neon DB to actually apply the `releasedAt` migration; confirm no later migration timestamp collides with `20260720140000`.
