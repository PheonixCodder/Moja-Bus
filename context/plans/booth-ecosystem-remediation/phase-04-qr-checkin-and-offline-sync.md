# Phase 04: QR Gate Check-In & Offline Sync Resilience

> **Phase Focus**: Normalize Ticket Token Resolution, Add Manual Code Fallback, and Repair Conflict Sync Identifiers  
> **Defects Resolved**: `BTH-P1-02`, `BTH-P1-04`, `BTH-P1-05`  

---

## 1. Problem Definition & Root Causes

1. **URL Token Check-In Failure (`BTH-P1-02`)**:
   - `booth.checkInPassenger` performs an exact database query: `where: { ticketToken: input.ticketToken }`.
   - In Moja Ride, digital tickets issued to passengers encode QR codes as URLs (`https://mojaride.com/tickets/[token]`) or JSON objects.
   - Scanning standard traveler tickets fails with `NOT_FOUND: Ticket not found or already used`.
2. **Offline Conflict Sync ID Mismatch (`BTH-P1-04`)**:
   - In `apps/booth-app/lib/offline-sync.ts:116`, `reportUrbanConflict` passes `entries.map((e) => e.holdId)` as `boothSaleIds`.
   - `tx.boothSale.updateMany` finds 0 records because hold IDs are not `BoothSale` IDs. Conflict flags are not saved.
3. **False Offline Status on Mobile Data (`BTH-P1-05`)**:
   - `use-network-status.ts:20` computes `isOnline: !!(state.isConnected && state.isInternetReachable)`.
   - When cellular DNS checks return `null` on Orange/MTN CI, `!!(true && null)` evaluates to `false`, falsely locking the app in offline mode.

---

## 2. Implementation Specifications

### Step 1: Token Normalization in `checkInPassenger`
File: `apps/web/trpc/routers/booth.ts`
```typescript
import { parseTicketToken } from "@moja/schemas";

// Inside checkInPassenger mutation:
checkInPassenger: boothProcedure
  .input(boothCheckInSchema)
  .mutation(async ({ ctx, input }) => {
    // Normalize token (extracts bare token from URL or JSON)
    const normalizedToken = parseTicketToken(input.ticketToken);

    const booking = await ctx.prisma.booking.findFirst({
      where: {
        OR: [
          { ticketToken: normalizedToken },
          { bookingReference: normalizedToken.toUpperCase() },
        ],
        companyId: ctx.companyId,
        status: "CONFIRMED",
      },
      select: {
        id: true,
        tripId: true,
        passengerName: true,
        checkedInAt: true,
        bookingReference: true,
        userId: true,
        trip: {
          select: {
            id: true,
            status: true,
            departureDate: true,
            tripStops: {
              where: { terminalId: input.terminalId, isPickup: true },
              select: { id: true },
            },
          },
        },
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!booking) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ticket not found or not valid for this company.",
      });
    }

    if (booking.trip.tripStops.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This ticket is for a trip that does not depart from this terminal.",
      });
    }

    if (booking.checkedInAt) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Passenger already boarded at ${booking.checkedInAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
      });
    }

    const now = new Date();
    await ctx.prisma.booking.update({
      where: { id: booking.id },
      data: { checkedInAt: now },
    });

    return {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      passengerName: booking.passengerName,
      passengerEmail: booking.user?.email ?? null,
      tripId: booking.tripId,
      checkedInAt: now.toISOString(),
    };
  }),
```

### Step 2: Add Manual Ticket Token Entry in Scanner Screen
File: `apps/booth-app/app/(tabs)/checkin.tsx`
- Below the `CameraView` finder box, add a "Saisie manuelle" (Manual Entry) button that opens a clean bottom sheet.
- Cashier can type the 6-character booking reference code (e.g. `MJ-7K9A`) directly if the customer's phone screen is broken or unreadable.
- Submits through the same `checkIn.mutateAsync` workflow.

### Step 3: Repair Conflict Sync Identifiers in Offline Sync
File: `apps/booth-app/lib/offline-sync.ts`
When flushing the queue:
1. Store the resulting `boothSaleId` returned from `createCashSale.mutateAsync`.
2. Map `boothSaleId` into the conflict report list:
```typescript
// Capture created sale ID on successful creation
const result = await createCashSale({ ... }) as { boothSaleId: string; bookingId: string };
if (result?.boothSaleId) {
  syncedSaleIds.push(result.boothSaleId);
}
```

### Step 4: Fix Cellular Reachability in Network Hook
File: `apps/booth-app/hooks/use-network-status.ts`
```typescript
// Replace lines 20 and 28:
// Do not treat null reachability as offline; treat only explicit false as offline.
const isReachable = state.isInternetReachable !== false;
const isOnline = Boolean(state.isConnected && isReachable);
```

---

## 3. Verification & Acceptance Criteria

- [ ] **Probe 4.1 (URL Token Scan)**: Scan a QR code from `traveler-app` containing `https://mojaride.com/tickets/tok_abc123`. Verify the gate scanner successfully checks in the passenger.
- [ ] **Probe 4.2 (Manual Reference Entry)**: Tap "Saisie manuelle", type a valid booking reference code, and submit. Verify passenger is checked in.
- [ ] **Probe 4.3 (Cellular Reliability)**: Test app on an Android device connected to 4G mobile data with `isInternetReachable: null`. Verify the app stays in online mode.
- [ ] **Probe 4.4 (Offline Conflict Sync)**: Create an urban cash sale offline. Cause an overbooking conflict. Reconnect to network. Verify that manager notifications are sent with valid terminal and cashier names.
