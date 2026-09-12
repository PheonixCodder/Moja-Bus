# Module 03: tRPC Engine & API Contracts Audit

> **Audit Context**: API Communication, tRPC Architecture, Query Lifecycle & Procedure Reliability  
> **Target Files**: `apps/booth-app/lib/trpc.tsx`, `apps/web/trpc/routers/booth.ts`, `packages/schemas/src/booth.ts`, `apps/web/trpc/init.ts`  
> **Comparative Targets**: `apps/traveler-app/lib/trpc.tsx`, `apps/web/trpc/routers/booking.ts`, `apps/web/trpc/routers/drivers.ts`  

---

## 1. tRPC Client Infrastructure Audit

Both `apps/booth-app/lib/trpc.tsx` and `apps/traveler-app/lib/trpc.tsx` use the `@trpc/tanstack-react-query` v11 integration with SuperJSON serialization and `httpBatchLink`. 

### Query Client Options Comparison

| Option | Booth App (`apps/booth-app/lib/trpc.tsx`) | Traveler App (`apps/traveler-app/lib/trpc.tsx`) | Architectural Assessment |
| :--- | :--- | :--- | :--- |
| `staleTime` | `30 * 1000` (30s) | `30 * 1000` (30s) | Acceptable for list views; too long for high-velocity seat maps. |
| `retry` | `3` (exponential backoff up to 10s) | Default (`0` or React Query default) | Good for spotty terminal connections, but delays user feedback on offline detection. |
| `keepalive` | 4-minute interval `AuthSessionKeepAlive` | 4-minute interval `AuthSessionKeepAlive` | Proper keepalive mechanism. |

---

## 2. Server Authorization Gateway (`boothProcedure`)

Defined in `apps/web/trpc/init.ts:421–450`:
```typescript
export const BOOTH_ELIGIBLE_ROLES: StaffRole[] = [
  "BOOTH",
  "DISPATCHER",
  "OPERATIONS",
  "MANAGER",
  "ADMIN",
  "OWNER",
];

export const boothProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const operator = await ctx.prisma.operator.findFirst({
    where: {
      userId: ctx.user.id,
      isActive: true,
      deletedAt: null,
      role: { in: BOOTH_ELIGIBLE_ROLES },
    },
    include: { company: true },
  });

  if (!operator) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access the ticket booth.",
    });
  }

  return next({ ctx: { ...ctx, operator, companyId: operator.companyId } });
});
```

### Flaws in Gateway Logic:
1. **Single-Company Assumption**: `findFirst` selects an arbitrary operator record if a user belongs to multiple companies. No active company selection header (`x-company-id`) is parsed.
2. **Missing Terminal Assignment Check**: The gateway checks company membership and role, but does **not verify whether the operator has permission to operate the requested `terminalId`**. Any staff member can execute sales against any terminal.

---

## 3. Forensic Audit of All `booth.*` Procedures

Below is the exhaustive, procedure-by-procedure breakdown of `apps/web/trpc/routers/booth.ts` (1,253 lines):

### 1. `booth.getMyProfile` (Query)
- **Implementation**: Returns `{ operatorId, role, companyId, staffName, staffEmail }`.
- **Defect**: Does not return `companyName` or `companyLogoUrl`. Consequently, `apps/booth-app/app/(tabs)/profile.tsx` renders the raw database CUID string (`cly...`) under the "Company" header.

### 2. `booth.getTerminals` (Query)
- **Implementation**: Queries `companyLocation` where `isTerminal: true` and `companyId: ctx.companyId`.
- **Defect**: Lacks pagination and geolocation distance sorting. In operators with dozens of stops/terminals across the country, the list is unsorted and uncluttered.

### 3. `booth.getTodayTrips` (Query)
- **Implementation**: Filters trips for the requested `terminalId` where `status in ["SCHEDULED", "BOARDING", "DELAYED"]`.
- **Defect**: Does not compute seat-class specific fares or multi-leg availability. If a route has intermediate stops, it over-simplifies availability to `trip.totalSeats - trip._count.bookings`.

### 4. `booth.getTripSeatMap` (Query)
- **Implementation**: Instantiates `SeatAvailabilityService` to compute real-time seat status (`AVAILABLE`, `SOLD`, `HELD`, `BLOCKED`, `DRIVER`).
- **Defect**: Not cached in offline store. When network drops, the booth cannot render the seat layout for trips unless holds were already pre-acquired.

### 5. `booth.preAcquireHolds` (Mutation)
- **Implementation**: Pre-reserves up to 10 seats for 90 minutes using sentinel passenger `BOOTH_POOL_HOLD`.
- **Defect**: Holds are created with `userId: ctx.user.id` (the cashier's ID) and `farePaid: 0`. If the cashier logs out without releasing holds, the seats remain blocked until the 90-minute TTL expires, starving public booking inventory.

### 6. `booth.releaseHolds` (Mutation)
- **Implementation**: Cancels holds created under the pool.
- **Good**: Properly cleans up unconsumed pool slots on terminal switch.

### 7. `booth.lookupOrCreatePassenger` (Mutation) — **P1 CRITICAL**
- **Contract (`packages/schemas/src/booth.ts`)**:
  ```typescript
  export const lookupOrCreatePassengerSchema = z.object({
    email: z.string().email(),
    fullName: z.string().min(2).max(100),
    phone: z.string().optional(),
  });
  ```
- **Client Usage (`apps/booth-app/app/sell/passenger.tsx:68–72`)**:
  ```typescript
  const result = await lookupMutation.mutateAsync({
    email: searchQuery.trim(),
    fullName: "", // <-- FAILS z.string().min(2)
    phone: undefined,
  });
  ```
- **Impact**: Searching for an existing passenger instantly crashes with a Zod validation error: `String must contain at least 2 character(s)`. Furthermore, searching by phone number (the dominant search method in West Africa) crashes because `email` validation fails on phone digits.

### 8. `booth.createCashSale` (Mutation) — **P0 BLOCKER**
- **Implementation**: Atomic transaction creating `Booking` + `BoothSale` + notification outbox events.
- **Client Bug in `apps/booth-app/app/sell/[tripId].tsx:93`**:
  `setTerminals(terminal.id, "");` sets destination terminal to empty string `""`.
- **Client Guard in `apps/booth-app/app/sell/payment.tsx:55`**:
  `if (!sellSession.destinationTerminalId) return;` causes `handleCashConfirm()` to abort silently. No cash sale can ever be confirmed through the UI!

### 9. `booth.initiatePaystackLink` (Mutation)
- **Implementation**: Creates a 10-minute hold (`PENDING_PAYMENT`), generates a Paystack reference, and initializes a checkout URL.
- **Client Bug**: Also guards on `destinationTerminalId`, silently failing before ever reaching the server.

### 10. `booth.pollPaymentStatus` (Query)
- **Implementation**: Calls `paystackVerify(paystackReference)` and returns `PAID`, `FAILED`, or `PENDING`.
- **Assessment**: Functional, but polls every 3 seconds directly against Paystack REST API rather than caching verification status or subscribing to webhooks.

### 11. `booth.confirmPaystackSale` (Mutation) — **P0 BLOCKER (GHOST BOOKING)**
- **Server Implementation**: Re-verifies payment, flips booking to `CONFIRMED`, stamps `paymentStatus: "PAID"`, and creates `BoothSale`.
- **Client Reality (`apps/booth-app/app/sell/payment.tsx:273–282`)**:
  When `pollData?.status === "PAID"`, the client **NEVER CALLS `confirmPaystackSale`**! It simply navigates straight to confirmation.
- **Catastrophic Impact**: The passenger's money is taken by Paystack, but the booking remains `PENDING_PAYMENT` with an active 10-minute timer. When the timer expires, the database releases the seat hold. The passenger arrives at the bus with a receipt for a seat that was released and resold!

### 12. `booth.cancelPendingHold` (Mutation)
- **Implementation**: Updates `status: "CANCELLED"` where `id: input.holdGroupId`.
- **Flaw**: `holdGroupId` in `cancelPendingHoldSchema` is used as `booking.id` in `updateMany`. Schema naming is inconsistent with model fields.

### 13. `booth.checkInPassenger` (Mutation) — **P1 CRITICAL**
- **Server Implementation**:
  ```typescript
  where: {
    ticketToken: input.ticketToken, // Raw string comparison
    companyId: ctx.companyId,
    status: "CONFIRMED",
  }
  ```
- **Discrepancy with Monorepo Ticket Standards**: In `packages/schemas/src/ticket-token.ts`, ticket QR codes can be full URLs (`https://mojaride.com/tickets/tok_123`) or JSON wrappers (`{"ticketToken":"tok_123"}`). The driver app uses `parseTicketToken()` to sanitize tokens. The booth app does a raw comparison, causing all scanned URL-based tickets to fail with "Ticket not found or already used".

### 14. `booth.getTerminalBookings` (Query)
- **Implementation**: Paginated list of sales for the current terminal and date.
- **Assessment**: Correctly queries `BoothSale` with date boundaries.

### 15. `booth.getDailyReconciliation` (Query)
- **Implementation**: Aggregates cash and Paystack totals, offline count, and walk-up metrics.
- **Assessment**: Correct mathematical aggregation; handles null cash values properly.

### 16. `booth.reportUrbanConflict` (Mutation) — **P1 CRITICAL**
- **Server Implementation**: Updates `boothSale.hasConflict = true` for matching `boothSaleIds`.
- **Client Bug in `apps/booth-app/lib/offline-sync.ts:116`**:
  The client passes `entries.map((e) => e.holdId)` as `boothSaleIds`. Hold IDs are not `BoothSale` IDs. The server updates 0 rows, and manager conflict notifications contain null staff and terminal names.
