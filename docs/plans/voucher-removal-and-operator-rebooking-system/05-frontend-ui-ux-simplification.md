# Frontend UI/UX Simplification Blueprint

## 1. Passenger Search & Checkout Dialogs

### Affected Files:
- [`booking-checkout-form.tsx`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-checkout-form.tsx)
- [`booking-details.tsx`](file:///C:/dev/moja-buss/apps/web/features/booking/components/booking-details.tsx)
- `apps/traveler-app/features/search/components/passenger-form-sheet.tsx`

### Changes:
* **Remove Voucher Selector:** Remove the `<Select>` dropdown for vouchers, remove `selectedVoucherId` state, and remove voucher error alerts.
* **Streamlined Payment Summary:**
  ```
  Ticket Subtotal:                 10,000 XOF
  Coupon Discount (SUMMER10):      -1,000 XOF
  Promo Credits Applied:           -1,500 XOF
  -------------------------------------------
  Amount to Pay:                    7,500 XOF
  ```
* **Payment Methods:** Directly choose **Moja Wallet** or **Direct Pay (Mobile Money / Paystack)**. Zero cognitive friction.

---

## 2. Passenger Wallet Page (`/dashboard/wallet`)

### Affected Files:
- [`promo-incentives-panel.tsx`](file:///C:/dev/moja-buss/apps/web/features/passenger/components/promo-incentives-panel.tsx)
- [`passenger-wallet-view.tsx`](file:///C:/dev/moja-buss/apps/web/features/passenger/views/passenger-wallet-view.tsx)

### Changes:
* **Remove "Vouchers" Section:** Eliminate the separate vouchers list and ceiling text.
* **Unified Rewards Card:** Show a single, beautiful **Promo Credits & Rewards** panel detailing:
  - Total Available Promo Credits in XOF
  - Credit lots with source labels (`Referral Bonus`, `Welcome Bonus`, `Customer Support Goodwill`, `Marketing Gift`) and expiration dates.
  - Quick claim code input for marketing campaign codes.

---

## 3. Passenger Bookings & Tickets Pages (`/dashboard/bookings` & `/dashboard/tickets`)

### Behavior on Rebooking:
* When an operator rebooks a passenger to an upcoming trip:
  - The previous booking on `/dashboard/bookings` displays status **"Rescheduled"** / **"Cancelled"** with a badge indicating *"Rebooked to [Target Departure Date & Time]"*.
  - The new active booking appears at the top of the passenger's bookings list with status **"Confirmed"**.
  - On `/dashboard/tickets`, the passenger's active ticket immediately reflects the new departure date, departure time, bus operator, and seat number with a refreshed QR code ready for boarding.
