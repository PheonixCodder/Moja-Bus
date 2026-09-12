# Phase 03: Sales Engine & Financial Integrity

> **Phase Focus**: Fix Route Parameter Propagation, Repair Passenger Search, and Eliminate Paystack Ghost Bookings  
> **Defects Resolved**: `BTH-P0-05`, `BTH-P0-06`, `BTH-P1-01`  

---

## 1. Problem Definition & Root Causes

1. **Destination Terminal Silent Abort (`BTH-P0-05`)**:
   - `sell/[tripId].tsx:93` calls `setTerminals(terminal.id, "")`.
   - `payment.tsx:55` guards with `if (!sellSession.destinationTerminalId) return;`.
   - Because `""` is falsy, `handleCashConfirm()` and `handlePaystackInitiate()` exit immediately with zero user feedback.
2. **Paystack Ghost Bookings (`BTH-P0-06`)**:
   - In `payment.tsx:273`, when Paystack polling returns `pollData.status === "PAID"`, the client executes `onPaid()` and redirects to confirmation **without calling `confirmPaystackSale`**.
   - The booking remains `PENDING_PAYMENT` with `paymentStatus: UNPAID`. When its 10-minute hold expires, the database releases the seat, resulting in duplicate ticket issuance.
3. **Passenger Search Validation Crash (`BTH-P1-01`)**:
   - `passenger.tsx:68` passes `{ email: searchQuery, fullName: "" }` to `booth.lookupOrCreatePassenger`.
   - `lookupOrCreatePassengerSchema` enforces `fullName: z.string().min(2)` and `email: z.string().email()`.
   - Searching by phone or with an empty name crashes the tRPC query instantly with a Zod validation error.

---

## 2. Implementation Specifications

### Step 1: Forward & Resolve Destination Terminal Across Sales Flow
File: `apps/booth-app/app/(tabs)/index.tsx`
```typescript
// In renderItem for Trip Card:
const destStop = item.tripStops.find((s) => s.isDropoff);
const destTerminalId = destStop?.terminalId ?? "";

onPress={() => {
  BoothFeedback.tap();
  router.push({
    pathname: "/sell/[tripId]",
    params: {
      tripId: item.id,
      destinationTerminalId: destTerminalId,
    },
  });
}}
```

File: `apps/booth-app/app/sell/[tripId].tsx`
```typescript
const { tripId, destinationTerminalId } = useLocalSearchParams<{
  tripId: string;
  destinationTerminalId?: string;
}>();

// Inside handleContinue:
const resolvedDestId =
  destinationTerminalId ||
  seatMap.tripStops?.find((s) => s.isDropoff)?.terminalId ||
  "";

setTrip(tripId, isIntercity);
setSeat(selectedSeatId, selectedTripSeat ? selectedTripSeat.tripSeatId : null);
setFare(seatMap.priceXOF);
setTerminals(terminal.id, resolvedDestId);

router.push({
  pathname: "/sell/passenger",
  params: {
    tripId,
    seatId: selectedSeatId ?? "",
    tripSeatId: selectedTripSeat?.tripSeatId ?? "",
    destinationTerminalId: resolvedDestId,
    isIntercity: String(isIntercity),
  },
});
```

### Step 2: Refactor Passenger Search & Schema
File: `packages/schemas/src/booth.ts`
```typescript
export const lookupOrCreatePassengerSchema = z.object({
  /** Can be an email address or a phone number */
  query: z.string().min(1).max(100),
  /** Required when creating a new account; optional when looking up existing */
  fullName: z.string().max(100).optional(),
  phone: z.string().optional(),
});
```

File: `apps/web/trpc/routers/booth.ts`
```typescript
lookupOrCreatePassenger: boothProcedure
  .input(lookupOrCreatePassengerSchema)
  .mutation(async ({ ctx, input }) => {
    const isEmail = input.query.includes("@");
    const normalizedPhone = !isEmail
      ? input.query.replace(/\s+/g, "")
      : input.phone?.replace(/\s+/g, "");

    // 1. Search existing user by email or phone
    const existing = await ctx.prisma.user.findFirst({
      where: {
        OR: [
          ...(isEmail ? [{ email: input.query.toLowerCase() }] : []),
          ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : []),
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        emailVerified: true,
      },
    });

    if (existing) {
      return {
        userId: existing.id,
        fullName: existing.fullName,
        email: existing.email,
        phone: existing.phoneNumber,
        emailVerified: existing.emailVerified,
        isNewAccount: false,
      };
    }

    // 2. Create new shadow passenger account if fullName is provided
    if (!input.fullName || input.fullName.trim().length < 2) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No existing passenger found with these details.",
      });
    }

    const email = isEmail
      ? input.query.toLowerCase()
      : `walkup-${Date.now()}@mojaride.local`;

    const newUser = await ctx.prisma.user.create({
      data: {
        fullName: input.fullName.trim(),
        email,
        phoneNumber: normalizedPhone ?? null,
        role: "TRAVELER",
        emailVerified: false,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        emailVerified: true,
      },
    });

    return {
      userId: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phoneNumber,
      emailVerified: newUser.emailVerified,
      isNewAccount: true,
    };
  }),
```

### Step 3: Wire `confirmPaystackSale` in Payment Screen
File: `apps/booth-app/app/sell/payment.tsx`
```typescript
const confirmPaystack = useMutation(
  trpc.booth.confirmPaystackSale.mutationOptions(),
);

// In PaystackQR onPaid callback:
onPaid={async () => {
  setLoading(true);
  try {
    const confirmed = await confirmPaystack.mutateAsync({
      holdGroupId: paystackData.holdId,
      paystackReference: paystackData.reference,
      terminalId: sellSession.terminalId!,
      passengerId: sellSession.passengerId!,
      passengerEmail: sellSession.passengerEmail!,
      passengerName: sellSession.passengerName!,
      walkedUpPassenger: true,
      passengerAccountCreated: sellSession.isNewAccount,
    });

    BoothFeedback.paymentSuccess();
    router.replace({
      pathname: "/sell/confirmation",
      params: {
        bookingId: confirmed.bookingId,
        passengerEmail: sellSession.passengerEmail,
      },
    });
  } catch (err) {
    BoothFeedback.invalidScan();
    Alert.alert(
      "Erreur de confirmation",
      "Le paiement a été validé par Paystack mais la confirmation du billet a échoué. Veuillez réessayer.",
    );
  } finally {
    setLoading(false);
  }
}}
```

### Step 4: Remove Silent Returns in `payment.tsx`
Replace silent `return;` checks in `handleCashConfirm()` and `handlePaystackInitiate()` with explicit validation alerts and logging so the cashier is immediately informed if any required field is missing.

---

## 3. Verification & Acceptance Criteria

- [ ] **Probe 3.1 (Cash Happy Path)**: Select trip → select seat → create walk-up passenger → tap "Confirm Cash Sale". Verify `handleCashConfirm` executes without returning early.
- [ ] **Probe 3.2 (Database Inspection)**: Check PostgreSQL: verify `booking.status === "CONFIRMED"`, `paymentStatus === "PAID"`, and a corresponding `BoothSale` record exists with `paymentMethod === "CASH"`.
- [ ] **Probe 3.3 (Paystack Happy Path)**: Select Paystack QR → complete test payment. Verify `confirmPaystackSale` executes. Inspect DB: verify booking status is `CONFIRMED`, `holdExpiresAt` is null, and `BoothSale` record exists with `paystackRef`.
- [ ] **Probe 3.4 (Passenger Search)**: Enter an existing passenger's phone number into the search box. Verify that search succeeds without a Zod error.
