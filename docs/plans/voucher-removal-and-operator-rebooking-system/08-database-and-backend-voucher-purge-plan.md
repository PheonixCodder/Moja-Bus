# Phase 8: Database, Backend, and Permissions Voucher Purge Plan

## Executive Summary
This document specifies the execution plan for the final, complete purge of all voucher tables, models, enum values, permissions, and accounting references from the Moja Bus codebase.

---

## 1. Scope & Target Components

### A. Database Schema (`packages/db/prisma/schema.prisma`)
1. **Remove Model**: `model MonetaryVoucher` (lines 2526–2571).
2. **Remove Enums**:
   - `enum VoucherSource`
   - `enum VoucherStatus`
3. **Clean Existing Enums**:
   - `enum RefundChannel`: Remove `VOUCHER` (leaves `CASH`, `WALLET`, `PAYSTACK`).
   - `enum InstrumentType`: Remove `MONETARY_VOUCHER` (leaves `CAMPAIGN_DISCOUNT`, `PROMO_CREDIT`).
4. **Remove Model Relations & Fields**:
   - `User`: Remove `monetaryVouchers` and `vouchersIssuedAsAdmin`.
   - `Company`: Remove `monetaryVouchers`.
   - `Schedule`: Remove `monetaryVouchers`.
   - `HoldGroup`: Remove `vouchersIssued`.
   - `Booking`: Remove `vouchersIssued`.
   - `Campaign`: Remove `vouchers`.
   - `DiscountRedemption`: Remove `voucherId` and `voucher` relation.
   - `PlatformSettings`: Remove `maxPromotionalVouchersPerUser`.

---

### B. Core Services & Accounting (`packages/db/src/services/FinancialAccountService.ts`)
1. Remove `getPlatformVoucherLiabilityAccount()`.
2. Update JSDoc comments referencing `(CASH/VOUCHER)` to `(CASH/WALLET)`.

---

### C. Schemas & IAM Permissions (`packages/schemas`)
1. **`admin-permissions.ts`**:
   - Replace `"marketing:vouchers:issue"` with `"marketing:credits:issue"`.
   - Update `MARKETING_PRESET` to include `"marketing:credits:issue"`.
2. **`discounts.ts`**:
   - Remove `"MONETARY_VOUCHER"` from `instrumentTypeSchema`.
   - Remove `voucherSourceSchema` and `voucherStatusSchema`.
   - Remove `issueMonetaryVoucherSchema` and `listMyVouchersSchema`.
   - Remove `monetaryVoucherId` from `quoteDiscountsSchema`.

---

### D. Payments & Cancellation Services (`apps/web`)
1. **`cancellation-policy.ts`**:
   - Update `CancellationRefundChannel = "CASH" | "WALLET" | "PAYSTACK"`.
   - Remove `VOUCHER` checks from `isRealTimeRefundChannel`.
2. **`cancellation-service.ts`**:
   - Remove `input.channel === "VOUCHER"` branches.
   - Remove `getPlatformVoucherLiabilityAccount()` calls.
3. **TRPC Routers**:
   - `operator.ts`: Remove `"VOUCHER"` from `bulkCancelBookings` schema and handler.
   - `discounts-admin.ts`: Use `"marketing:credits:issue"` permission for credit grants.
   - `payments.ts`: Remove voucher error checks from `cancelBookingPassenger`.

---

### E. Code Comments & Cleanliness
- Clean comments referencing vouchers in:
  - `apps/web/features/payments/services/booking-confirmation-service.ts`
  - `apps/web/features/payments/lib/checkout-payable.ts`
  - `apps/web/features/discounts/services/marketing-blast.ts`

---

## 2. Step-by-Step Implementation Sequence

| Step | Action | Files | Verification |
|---|---|---|---|
| **Step 1** | Update Permissions & Schemas | `packages/schemas/src/admin-permissions.ts`, `discounts.ts` | `pnpm --filter @moja/schemas typecheck` |
| **Step 2** | Update Cancellation & Payment Services | `cancellation-policy.ts`, `cancellation-service.ts`, `operator.ts`, `discounts-admin.ts`, `payments.ts` | `pnpm --filter web typecheck` |
| **Step 3** | Clean Financial Account Service | `packages/db/src/services/FinancialAccountService.ts` | `pnpm --filter @moja/db typecheck` |
| **Step 4** | Purge `schema.prisma` & Regenerate Client | `packages/db/prisma/schema.prisma` | `pnpm --filter @moja/db db:generate` |
| **Step 5** | Create Database Migration | `packages/db/prisma/migrations/` | `pnpm --filter @moja/db prisma migrate dev` |
| **Step 6** | Clean Legacy Comments | `booking-confirmation-service.ts`, `checkout-payable.ts`, `marketing-blast.ts` | Code inspection |
| **Step 7** | Full Monorepo Typecheck & Test Suite | Workspace-wide | `pnpm typecheck` & `pnpm test` |
