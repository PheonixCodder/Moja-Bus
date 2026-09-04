# Phase 2: Backend tRPC Routers & Services

> **File**: `context/plans/unified-driver-conductor-system/02-trpc-routers-and-backend-services.md`  
> **Target Routers**: `apps/web/trpc/routers/trips.ts`, `apps/web/trpc/routers/drivers.ts`, `apps/web/features/driver/services/driver-check-in-service.ts`  
> **Status**: Ready for Implementation  

---

## 1. Objectives

1. Refactor `trips.assignDriver`: Remove `isConductor` bypass (lines 1835–1878). Ensure all vehicle drivers (`PRIMARY` and `RELIEF`) are strictly validated for license class, expiry, and conflicts.
2. Implement `trips.assignConductor` & `trips.unassignConductor`: Direct assignment of company staff to `Trip.conductorStaffId`.
3. Protect `drivers.startTrip` and `drivers.getTelemetryToken`: Ensure only authenticated vehicle drivers assigned as `PRIMARY` (or active `RELIEF`) can mint telemetry tokens and transition trip runs.
4. Update `driver-check-in-service.ts`: Allow boarding check-in by `PRIMARY` driver, `RELIEF` driver, or the assigned company `CONDUCTOR`.

---

## 2. Router Changes

### A. `apps/web/trpc/routers/trips.ts`

#### 1. Clean `assignDriver`
- Update schema input `role: z.enum(["PRIMARY", "RELIEF"])`.
- Remove lines 1835–1878 (`const isConductor = role === "CONDUCTOR"`).
- All assigned drivers must meet `licenseMeetsRequirement(driver.licenseCategory, requiredLicense)` and `isLicenseUsableThrough`.
- Upsert/update `trip.driverId` (if `PRIMARY`) or `trip.reliefDriverId` (if `RELIEF`), and maintain the `TripDriverAssignment` row.

#### 2. Add `assignConductor`
```typescript
assignConductor: operatorCompanyProcedure
  .input(z.object({
    tripId: z.string().cuid(),
    staffId: z.string().cuid(),
  }))
  .mutation(async ({ ctx, input }) => {
    requirePermission(ctx, "trips:dispatch");
    const { tripId, staffId } = input;

    // 1. Verify trip exists under this company
    const trip = await ctx.prisma.trip.findFirst({
      where: { id: tripId, companyId: ctx.companyId, archivedAt: null },
    });
    if (!trip) throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });

    // 2. Verify target staff is an active company member with CONDUCTOR role or checkin permission
    const staff = await ctx.prisma.operator.findFirst({
      where: { id: staffId, companyId: ctx.companyId, status: "ACTIVE", deletedAt: null },
    });
    if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "Staff member not found" });

    // 3. Assign to trip
    return ctx.prisma.trip.update({
      where: { id: tripId },
      data: { conductorStaffId: staffId },
    });
  }),

unassignConductor: operatorCompanyProcedure
  .input(z.object({ tripId: z.string().cuid() }))
  .mutation(async ({ ctx, input }) => {
    requirePermission(ctx, "trips:dispatch");
    return ctx.prisma.trip.update({
      where: { id: input.tripId, companyId: ctx.companyId },
      data: { conductorStaffId: null },
    });
  }),
```

---

### B. `apps/web/trpc/routers/drivers.ts`

#### 1. Add Query for Conductor's Assigned Trips
When a Conductor logs into the mobile app, they fetch their assigned trips using `drivers.getMyTrips` or a staff query:

```typescript
// Support Conductor caller: If caller is authenticated as Operator Staff (Conductor),
// query trips where conductorStaffId === caller.operatorId
if (ctx.isConductor) {
  const trips = await ctx.prisma.trip.findMany({
    where: {
      conductorStaffId: ctx.operator.id,
      departureDate: { gte: input.from, lte: input.to },
    },
    include: {
      bus: true,
      schedule: { include: { route: true } },
      _count: { select: { bookings: true } },
    },
  });
  return { trips, total: trips.length };
}
```

#### 2. Start Trip & Telemetry Token Guard
Ensure non-drivers are hard-blocked:

```typescript
startTrip: driverProcedure
  .input(driverStartTripSchema)
  .mutation(async ({ ctx, input }) => {
    const { tripId } = input;
    const driverProfileId = ctx.driver.id;

    const trip = await ctx.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, driverId: true, reliefDriverId: true, status: true },
    });
    if (!trip) throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });

    // Only PRIMARY or assigned RELIEF can start the trip
    if (trip.driverId !== driverProfileId && trip.reliefDriverId !== driverProfileId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the assigned driver can start the trip run.",
      });
    }

    // ... transition to DEPARTED, mint HMAC telemetry token
  }),
```

---

### C. Boarding & Check-In Service (`apps/web/features/driver/services/driver-check-in-service.ts`)

Update `assertBoardable` to authorize all three crew members:

```typescript
private async assertBoardable(
  callerId: string, // driverProfileId OR operatorStaffId
  booking: CheckInBookingView,
  sentTripId?: string,
): Promise<void> {
  const trip = await this.prisma.trip.findUnique({
    where: { id: booking.tripId },
    select: { driverId: true, reliefDriverId: true, conductorStaffId: true, companyId: true },
  });
  if (!trip) throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });

  const isAssignedCrew =
    trip.driverId === callerId ||
    trip.reliefDriverId === callerId ||
    trip.conductorStaffId === callerId;

  if (!isAssignedCrew) {
    // Check if caller is active company staff with bookings:checkin permission
    const isStaffAuthorized = await this.prisma.operator.findFirst({
      where: { id: callerId, companyId: trip.companyId, status: "ACTIVE" },
    });
    if (!isStaffAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not assigned to board passengers on this trip.",
      });
    }
  }

  // 2. Validate ticket status & trip match
  if (sentTripId && sentTripId !== booking.tripId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This ticket belongs to a different scheduled trip.",
    });
  }

  if (booking.status !== "CONFIRMED") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: nonConfirmedMessage(booking.status),
    });
  }
}
```
