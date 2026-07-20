# Database: Booking Models

[⬅️ Back to Database Overview](./README.md)

---

## 1. `HoldGroup`

Represents a shopping cart. It groups multiple `Booking` rows together and binds them to a `PricingSnapshot`.

### Fields
- `id` (String, PK, CUID).
- `userId` (String): FK to `User`. The passenger buying the tickets.
- `status` (Enum: `ACTIVE`, `EXPIRED`, `CONFIRMED`).
- `holdExpiresAt` (DateTime): The exact millisecond the hold expires (usually `createdAt + 10 mins`).
- `createdAt` / `updatedAt` (DateTime).

### Relations
- `bookings`: One-to-Many with `Booking`.
- `pricingSnapshot`: One-to-One with `PricingSnapshot`.
- `externalPayment`: One-to-One with `ExternalPayment`.

---

## 2. `PricingSnapshot`

The immutable mathematical contract for a `HoldGroup`.

### Fields
- `id` (String, PK, CUID).
- `holdGroupId` (String, Unique): FK to `HoldGroup`.
- `seatCount` (Int): Number of seats booked.
- `baseFareXOF` (Int): The base price per seat at that exact moment.
- `commissionBps` (Int): The platform commission basis points (e.g., 500 = 5%).
- `convenienceFeeBps` (Int): The platform convenience fee basis points.
- `operatorNetXOF` (Int): The total amount the operator will receive.
- `chargeAmountXOF` (Int): The total amount the user will be charged.
- `createdAt` (DateTime).

### Invariants
- **Immutability**: Once created, these fields are NEVER updated. If the platform commission changes 1 minute after this is created, the user still pays the old commission. This guarantees that `chargeAmountXOF` perfectly matches the `ExternalPayment.amountXOF`.

---

## 3. `Booking`

Represents a physical seat on a bus.

### Fields
- `id` (String, PK, CUID).
- `userId` (String): FK to `User`.
- `tripId` (String): FK to `Trip`.
- `seatId` (String): FK to `Seat`.
- `companyId` (String): FK to `Company`. Denormalized for faster operator lookups.
- `holdGroupId` (String?): FK to `HoldGroup`.
- `status` (Enum: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `COMPLETED`).
- `paymentStatus` (Enum: `UNPAID`, `PENDING`, `PAID`, `FAILED`, `REFUNDED`).
- `farePaid` (Int): The exact amount paid for THIS specific seat.
- `clearedAt` (DateTime?): Set by the `release-escrow` cron. Signals that this specific seat's funds have been released to the operator's `availableBalance`.
- `createdAt` / `updatedAt` (DateTime).

### Indexes & Concurrency
- **Double-Booking Prevention**: A unique constraint or application-level lock on `(tripId, seatId)` where `status` is NOT `EXPIRED` or `CANCELLED`. This ensures two users cannot buy the same seat at the same time.
