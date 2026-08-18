# Architecture & Data Model Evolution

## 1. Core Financial Architecture

```mermaid
flowchart TD
    subgraph Passenger Checkout Pipeline (Simplified)
        Base[Ticket Base Fare] --> PromoDiscount[Apply Coupon / Sitewide Promo % or XOF]
        PromoDiscount --> PromoCredits[Apply Promo Credits Balance]
        PromoCredits --> FinalPayable[Final Cash Charge Payable]
        FinalPayable --> PaymentGate[Pay with Moja Wallet or Paystack/Mobile Money]
    end
```

By removing vouchers from the checkout pipeline, the pricing calculation simplifies from:
$$\text{Payable} = \text{Subtotal} - \text{Discount} - \text{Voucher} - \text{Credits}$$
to:
$$\mathbf{\text{Payable} = \max(0, \text{Subtotal} - \text{Discount} - \text{Credits})}$$

---

## 2. Data Model Changes (`packages/db/prisma/schema.prisma`)

### A. Enhancing `CreditLotSource` Enum
Expand `CreditLotSource` to absorb all marketing and administrative credit grants:

```prisma
enum CreditLotSource {
  REFERRAL
  LOYALTY
  ADMIN
  PROMO_GRANT
  GOODWILL        // Customer support compensation
  MARKETING_GRANT // Promotional grant
  ADMIN_MANUAL    // Direct manual issue
}
```

### B. Tracking Rebooked Bookings on `Booking` Model
Add explicit tracking fields to the `Booking` model to record rebooking provenance:

```prisma
model Booking {
  // ... existing fields
  
  /** If this booking was created as a rebooking of a previous cancelled trip. */
  rebookedFromBookingId String?   @unique
  rebookedFromBooking   Booking?  @relation("RebookedBookings", fields: [rebookedFromBookingId], references: [id], onDelete: SetNull)
  rebookedToBooking     Booking?  @relation("RebookedBookings")

  /** Reason provided by operator for rebooking. */
  rebookReason          String?
  rebookedAt            DateTime?
  rebookedByStaffId     String?
  rebookedByStaff       User?     @relation("BookingRebookedByStaff", fields: [rebookedByStaffId], references: [id], onDelete: SetNull)
}
```

### C. Booking Status Enum Updates
Ensure `BookingStatus` handles the transition cleanly:
- When a booking is rebooked to a new trip, its status becomes `CANCELLED` with a structured reason `REBOOKED_TO_<NEW_BOOKING_REF>`, or a dedicated `REBOOKED` status.
- The newly minted booking on the target trip starts with status `CONFIRMED`, `farePaid` transferred, and new `Ticket` generated.
