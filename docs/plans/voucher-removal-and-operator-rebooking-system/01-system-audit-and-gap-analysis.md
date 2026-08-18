# Voucher Removal & Operator Rebooking System — Comprehensive Audit & Gap Analysis

## 1. Executive Summary

This audit establishes the blueprint for deprecating the fragmented **Monetary Voucher** system (`MonetaryVoucher`) across the Moja Ride platform and replacing it with two superior, streamlined solutions:
1. **A Native Operator Rebooking System:** Enabling bus operators to directly transfer and rebook passengers onto upcoming trips from the same schedule/route with automatic seat reallocation, ticket updates, and passenger notifications.
2. **An Expanded Promo Credits Model:** Replacing administrative manual vouchers, marketing grants, and goodwill compensations with unified, non-withdrawable **Promo Credits** (`CreditLot`) that automatically apply at checkout.

---

## 2. Current State Inventory & Deprecation Scope

### A. Deprecated Database Models & Enums

| Entity | Location | Action | Reason |
|---|---|---|---|
| `model MonetaryVoucher` | `packages/db/prisma/schema.prisma` | **Deprecate / Remove** | Replaced by direct rebooking (for cancellations) and promo credits (for goodwill/marketing). |
| `enum VoucherSource` | `packages/db/prisma/schema.prisma` | **Deprecate / Remove** | `CANCELLATION`, `GOODWILL`, `MARKETING_GRANT`, `ADMIN_MANUAL` no longer stored as vouchers. |
| `enum VoucherStatus` | `packages/db/prisma/schema.prisma` | **Deprecate / Remove** | `ACTIVE`, `PARTIALLY_REDEEMED`, `REDEEMED`, `EXPIRED`, `REVOKED` no longer needed for vouchers. |
| `enum RefundChannel.VOUCHER` | `packages/db/prisma/schema.prisma` | **Deprecate / Update** | Operator cancellations will now route to `WALLET`, `CASH`, or the new `REBOOK` action. |

---

### B. Deprecated Frontend & Backend Services

| Component | File Path | Current Purpose | Target State |
|---|---|---|---|
| `voucher-service.ts` | `apps/web/features/discounts/services/voucher-service.ts` | Handles cancellation and admin voucher creation | **Remove / Replace** with `rebooking-service.ts` and `promo-grant-service.ts`. |
| `evaluate.ts` (Voucher Engine) | `apps/web/features/discounts/engine/evaluate.ts` | Checks `monetaryVoucher`, schedule match, company match | **Remove voucher evaluation branch**; keep coupon and promo credits. |
| `auto-apply.ts` | `apps/web/features/discounts/engine/auto-apply.ts` | Applies voucher deductions against provisional charge | **Remove `voucherAppliedXOF`**; simplify to `charge = subtotal - discount - credit`. |
| `quote-service.ts` | `apps/web/features/discounts/services/quote-service.ts` | Reserves, finalizes, and rolls back vouchers on hold groups | **Remove voucher hold and release logic**. |
| `cancellation-service.ts` | `apps/web/features/payments/services/cancellation-service.ts` | Issues cancellation vouchers | **Remove `VOUCHER` refund creation**; replace with `rebookBooking`. |
| `cancel-trip-with-refunds.ts` | `apps/web/lib/cancel-trip-with-refunds.ts` | Batch trip cancellation with voucher issuance | **Remove voucher fallback**; refund to wallet/cash or batch notify for rebooking. |

---

### C. Deprecated UI Elements & Forms

1. **Search & Checkout Modals:**
   - [`booking-checkout-form.tsx`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-checkout-form.tsx): Remove `selectedVoucherId` dropdown, voucher balance labels, and voucher rejection errors.
   - [`booking-details.tsx`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-details.tsx): Remove voucher selector and voucher query calls.
   - `apps/traveler-app/features/search/components/passenger-form-sheet.tsx`: Remove `monetaryVoucherId` state and inputs.
2. **Passenger Wallet View:**
   - [`promo-incentives-panel.tsx`](file:///C:/dev/moja-buss/apps/web/features/passenger/components/promo-incentives-panel.tsx): Remove the "Vouchers" card and max voucher ceiling hints. Keep only the unified Promo Credits and Referral rewards card.
3. **Operator Booking Drawer:**
   - [`booking-detail-drawer.tsx`](file:///C:/dev/moja-buss/apps/web/features/operator/components/bookings/booking-detail-drawer.tsx): Remove "Voucher" refund channel tab. Add prominent **"Rebook Passenger"** modal and workflow.
4. **Admin Marketing Dashboard:**
   - [`admin-campaigns-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/admin/views/admin-campaigns-view.tsx): Remove "Open voucher liability" and "Voucher liability aging" KPI cards. Replace with Promo Credit Liability.
