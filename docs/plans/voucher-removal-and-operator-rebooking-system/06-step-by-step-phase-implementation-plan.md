# Phase-by-Phase Implementation Plan

## Phase 1: Database & Core Service Layer Evolution
1. **Schema Migration:**
   - Update `enum CreditLotSource` to include `GOODWILL`, `MARKETING_GRANT`, `ADMIN_MANUAL`.
   - Update `model Booking` with rebooking relations (`rebookedFromBookingId`, `rebookReason`, `rebookedAt`, `rebookedByStaffId`).
   - Run `npx prisma db push` or migration.
2. **Rebooking Service Creation:**
   - Implement `apps/web/features/booking/services/rebooking-service.ts`:
     - Validates old booking status (`CONFIRMED`).
     - Validates target trip (must have available seats, belongs to same operator/schedule).
     - Atomic transaction: cancels old booking with reference, creates new `Booking` + `Ticket`, generates fresh QR code, dispatches notification via Novu/SMS.
3. **Discounts Engine Cleanup:**
   - Remove voucher evaluation branch from [`evaluate.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/evaluate.ts).
   - Remove voucher deductions from [`auto-apply.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/engine/auto-apply.ts).
   - Remove voucher reservation and release logic from [`quote-service.ts`](file:///C:/dev/moja-buss/apps/web/features/discounts/services/quote-service.ts).

---

## Phase 2: tRPC Routers & Backend Endpoints
1. **Operator Router (`apps/web/trpc/routers/operator.ts`):**
   - Add `listUpcomingScheduleTrips` (queries future open trips for a given schedule).
   - Add `rebookBooking` (executes rebooking via `RebookingService`).
   - Remove `VOUCHER` option from `cancelBooking`.
2. **Discounts Admin Router (`apps/web/trpc/routers/discounts-admin.ts`):**
   - Replace `issueVoucher` with `grantPromoCredits` (mints `CreditLot` with source `GOODWILL` / `MARKETING_GRANT` / `ADMIN_MANUAL`).
3. **Discounts Public/Passenger Router (`apps/web/trpc/routers/discounts.ts`):**
   - Remove `listMyVouchers`. Keep `listMyCredits` and `listMyCreditLots`.
4. **Booking Router (`apps/web/trpc/routers/booking.ts`):**
   - Remove `monetaryVoucherId` input parameter from booking and hold creation schemas.

---

## Phase 3: Operator & Admin Dashboard UI
1. **Operator Booking Drawer (`BookingDetailDrawer`):**
   - Add **"Rebook Passenger"** button and dedicated Rebook modal dialog (select trip, select seat, reason input, submit).
   - Remove "Voucher" refund method tab from Cancel modal (leaving Wallet and Cash).
2. **Admin Traveler Profile View:**
   - Add **"Grant Promo Credits"** action button & modal in traveler profile header.
3. **Admin Campaigns & Abuse Views:**
   - Remove voucher liability KPI cards from `admin-campaigns-view.tsx`.

---

## Phase 4: Passenger & Checkout Experience
1. **Search & Checkout Modals (`booking-checkout-form.tsx`, `booking-details.tsx`):**
   - Remove voucher selector dropdowns and voucher error banners.
   - Clean summary showing: Ticket Base $\rightarrow$ Coupon Discount $\rightarrow$ Promo Credits $\rightarrow$ Final Payable.
2. **Passenger Wallet View (`promo-incentives-panel.tsx`):**
   - Remove Vouchers card.
   - Enhance Promo Credits card with expanded source badges (`Customer Support Goodwill`, `Marketing Grant`, `Referral Reward`, etc.).
3. **Passenger Bookings & Tickets Views:**
   - Verify rebooked tickets display with status "Confirmed", updated schedule time, and active QR code.

---

## Phase 5: Testing, Verification & Hardening
1. **Unit & Integration Tests:**
   - Update discount engine test suites (`evaluate.test.ts`, `checkout-quote.test.ts`) to verify clean pricing without vouchers.
   - Add test suite for `rebooking-service.test.ts` (rebooking concurrency, seat conflict prevention, idempotency).
2. **Typecheck & Lint:**
   - Run `npx tsc --noEmit` to ensure 0 TypeScript errors across monorepo.
   - Run `npm test` to ensure all unit tests pass.
