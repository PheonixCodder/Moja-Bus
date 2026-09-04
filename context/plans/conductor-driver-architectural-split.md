# Architectural Plan: Conductor vs Driver First-Class Split

> **Created**: 2026-09-02
> **Scope**: Schema, Backend, Mobile App, Operator Dashboard, Admin Dashboard
> **Risk level**: High — schema migration + auth + multi-app changes
> **Production state**: Pre-launch / clean migration

---

## The Core Diagnosis

The current model has one architectural mistake that creates all the downstream clutter:

CONDUCTOR is a subrole of DRIVER in TripDriverAssignment.role.
This is wrong at the identity level. A conductor is not "a driver who does not drive."
They are a fundamentally different workforce category.

PRIMARY and RELIEF are NOT the problem. Both are licensed vehicle operators doing the
same type of work — they just take different seats per trip. The per-trip assignment
model for PRIMARY and RELIEF is correct and stays unchanged. The fix is to rip
CONDUCTOR out of that model and give it a proper first-class identity.

---

## Decisions Locked

- Single app binary with role-aware routing at boot (driver UX tree vs conductor UX tree)
- Conductors participate in the marketplace — operators can send employment offers to conductors
- Pre-launch / clean migration — hard cut data migration, no backward-compat shim
- Conductor can NEVER call startTrip — hard block permanently
- FK consistency — nightly audit cron (alert-only, no auto-fix)

---

## Target Architecture

```
UserRole enum: TRAVELER | OPERATOR | ADMIN | DRIVER | CONDUCTOR  (new value)

User (role = DRIVER)     1:1  DriverProfile
  Requires: commercial license (B/C/D/E)
  Per-trip roles: PRIMARY or RELIEF only  (via TripDriverAssignment)
  App experience: Shift HUD, GPS/Speedometer, Trip management
  Earnings: distance-based, safety scoring

User (role = CONDUCTOR)  1:1  ConductorProfile  (new model)
  Requires: employment verification only — no driving license
  Per-trip: always CONDUCTOR role  (via TripConductorAssignment — new table)
  App experience: Boarding HUD, QR scanner, Manifest management
  Earnings: shift-based, no distance credit, no safety score

TripDriverAssignment    (EXISTING — role stripped to PRIMARY | RELIEF only)
TripConductorAssignment (NEW — clean junction between Trip and ConductorProfile)
```

---

## Phase A — Schema and Database (Do This First)

### A1. Extend UserRole enum

```prisma
enum UserRole {
  TRAVELER
  OPERATOR
  ADMIN
  DRIVER
  CONDUCTOR
}
```

### A2. Add ConductorProfile model

```prisma
model ConductorProfile {
  id                   String                      @id @default(cuid())
  userId               String                      @unique
  user                 User                        @relation(fields: [userId], references: [id], onDelete: Cascade)

  nationalIdNumber     String?
  photoUrl             String?
  yearsOfExperience    Int                         @default(0)

  verificationStatus   ConductorVerificationStatus @default(PENDING)
  verifiedAt           DateTime?
  verifiedById         String?
  verifiedBy           User?                       @relation("ConductorVerifiedBy", fields: [verifiedById], references: [id], onDelete: SetNull)
  rejectionReason      String?

  status               ConductorStatus             @default(OFFLINE)
  currentTripId        String?
  currentTrip          Trip?                       @relation("ConductorCurrentTrip", fields: [currentTripId], references: [id], onDelete: SetNull)

  averageRating        Float                       @default(5.0)
  totalReviews         Int                         @default(0)
  totalTripsCompleted  Int                         @default(0)

  companyAffiliations  ConductorCompanyAffiliation[]
  employmentOffers     ConductorEmploymentOffer[]
  tripAssignments      TripConductorAssignment[]
  shifts               ConductorShift[]
  servicePreference    ConductorServicePreference?

  createdAt            DateTime                    @default(now())
  updatedAt            DateTime                    @updatedAt

  @@index([status])
  @@index([verificationStatus])
  @@map("conductor_profile")
}

enum ConductorVerificationStatus { PENDING, VERIFIED, REJECTED, SUSPENDED }
enum ConductorStatus { OFFLINE, AVAILABLE, ON_TRIP, RESTING, SUSPENDED }
```

### A3. Add TripConductorAssignment model

```prisma
model TripConductorAssignment {
  id                  String           @id @default(cuid())
  tripId              String
  trip                Trip             @relation(fields: [tripId], references: [id], onDelete: Cascade)
  conductorProfileId  String
  conductorProfile    ConductorProfile @relation(fields: [conductorProfileId], references: [id], onDelete: Cascade)
  assignedAt          DateTime         @default(now())
  assignedByStaffId   String?
  urgentDispatchAckAt DateTime?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  @@unique([tripId, conductorProfileId])
  @@index([tripId])
  @@index([conductorProfileId])
  @@map("trip_conductor_assignment")
}
```

No startStopOrder / endStopOrder / distanceKm — conductors earn no distance credit.

### A4. Add supporting conductor models

- ConductorCompanyAffiliation (same as DriverCompanyAffiliation but employmentType is FULL_TIME | CONTRACTOR only — no intercity/urban split)
- ConductorShift (identical fields to DriverShift)
- ConductorServicePreference (marketplace listing)
- ConductorEmploymentOffer + ConductorOfferEvent (mirrors driver offer system)

### A5. Update Trip model

```prisma
conductorAssignments  TripConductorAssignment[]
```

### A6. Data migration script

```sql
-- Run before deploying. Expected: zero rows since pre-launch.
SELECT COUNT(*) FROM trip_driver_assignment WHERE role = 'CONDUCTOR';
-- If non-zero: migrate each to conductor_profile + trip_conductor_assignment, then delete
DELETE FROM trip_driver_assignment WHERE role = 'CONDUCTOR';
```

### A7. Clean TripDriverAssignment role comment

```prisma
role  String  @default("PRIMARY")  // PRIMARY | RELIEF — CONDUCTOR moved to TripConductorAssignment
```

---

## Phase B — Backend: Middleware, Router, Bug Fixes

### B1. Add conductorProcedure to apps/web/trpc/init.ts

```typescript
const loadConductorProfile = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "CONDUCTOR") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Conductor account required." });
  }
  const conductorProfile = await ctx.prisma.conductorProfile.findUnique({
    where: { userId: ctx.user.id },
    include: { companyAffiliations: { where: { isActive: true }, include: { company: true } } },
  });
  if (!conductorProfile) throw new TRPCError({ code: "NOT_FOUND", message: "Conductor profile not found." });
  return next({ ctx: { ...ctx, conductor: conductorProfile } });
});

export const conductorProcedure = loadConductorProfile.use(/* status gate — same pattern as driverProcedure */);
```

### B2. Create apps/web/trpc/routers/conductors.ts

| Procedure | Description |
|---|---|
| conductors.getMyProfile | ConductorProfile with currentTrip via TripConductorAssignment |
| conductors.registerConductor | Self-registration (no license upload) |
| conductors.toggleShift | Clock in/out, creates ConductorShift |
| conductors.getMyTrips | Trips from TripConductorAssignment |
| conductors.getMyTripManifest | Delegates to CrewCheckInService |
| conductors.checkInPassenger | Delegates to CrewCheckInService |
| conductors.manualCheckInPassenger | Delegates to CrewCheckInService |
| conductors.batchSyncCheckIns | Delegates to CrewCheckInService |
| conductors.getMyOffers | ConductorEmploymentOffer list |
| conductors.respondToOffer | Accept / decline / counter |
| conductors.acknowledgeUrgentDispatch | Stamps TripConductorAssignment.urgentDispatchAckAt |

### B3. Update trips.ts — remove isConductor, add assignConductor

Remove the isConductor branch from trips.assignDriver entirely. That procedure now handles PRIMARY and RELIEF only — it becomes simpler and cleaner.

Add trips.assignConductor as a new purpose-built procedure:

```typescript
assignConductor: operatorCompanyProcedure
  .input(z.object({ tripId: z.string().cuid(), conductorProfileId: z.string().cuid() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Verify conductorProfile.verificationStatus === "VERIFIED"
    // 2. Verify trip is pre-departure (SCHEDULED / BOARDING / DELAYED)
    // 3. Light overlap check (is conductor on another trip in the same window?)
    // 4. FOR UPDATE lock trip + conductor_profile rows
    // 5. Create TripConductorAssignment
    // 6. If departure < 2h: enqueue urgent dispatch push
  });
```

### B4. CRITICAL BUG FIX: drivers.startTrip + getTelemetryToken (ships independently TODAY)

```typescript
// After fetching assignment, before any other logic:
if (assignment.role === "CONDUCTOR") {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Conductors cannot start a trip run. Only PRIMARY and RELIEF drivers can start trips.",
  });
}
```

Same guard in getTelemetryToken.

### B5. Register conductors router in apps/web/trpc/_app.ts

```typescript
conductors: conductorsRouter,
```

### B6. Add conductor verification to admin.ts

- admin.listPendingConductors
- admin.verifyConductor (APPROVE / REJECT / SUSPEND — no license checks)
- New permission keys: conductors:verify.read, conductors:verify.manage

### B7. Add conductor roster to operator router

- operator.createConductor, operator.listConductors, operator.deleteConductorAffiliation
- operator.verifyConductor (company-level employment verification)
- New IAM keys: conductors:read, conductors:create, conductors:update, conductors:delete, conductors:verify

---

## Phase C — Shared Services

### C1. Rename DriverCheckInService to CrewCheckInService

Update assertBoardable to accept profileType:

```typescript
private async assertBoardable(
  profileId: string,
  profileType: "DRIVER" | "CONDUCTOR",
  booking: CheckInBookingView,
): Promise<void> {
  const isAssigned = profileType === "DRIVER"
    ? await this.prisma.tripDriverAssignment.findFirst({
        where: { driverProfileId: profileId, tripId: booking.tripId },
      })
    : await this.prisma.tripConductorAssignment.findFirst({
        where: { conductorProfileId: profileId, tripId: booking.tripId },
      });
  if (!isAssigned) throw new TRPCError({ code: "FORBIDDEN", message: "Not assigned to this trip." });
  // rest of guards unchanged
}
```

### C2. Update convergeDriversAfterRunEnd

After the existing driver convergence block, add conductor convergence (~15 lines):

```typescript
const strandedConductors = await db.conductorProfile.findMany({
  where: { currentTripId: tripId },
  select: { id: true },
});
// same AVAILABLE / OFFLINE logic as drivers based on open ConductorShift
```

### C3. Add nightly audit cron: /api/cron/audit-trip-crew-assignments

Flags any Trip where Trip.driverId does not match the PRIMARY TripDriverAssignment row.
Logs discrepancies — alert only, no auto-fix.

### C4. Add conductor nightly crons

- reconcile-conductor-stats (rating + trip count aggregation)
- expire-conductor-offers (past expiresAt)

---

## Phase D — Mobile App

### D1. UserRole context in apps/driver-app/context/user-role-context.tsx

```typescript
export const UserRoleContext = React.createContext<"DRIVER" | "CONDUCTOR" | null>(null);
export const useUserRole = () => useContext(UserRoleContext);
```

### D2. Update app/_layout.tsx

Wrap in UserRoleContext.Provider populated from authClient.useSession().

### D3. Update app/index.tsx boot gate

```typescript
if (userRole === "CONDUCTOR") {
  // conductors.getMyVerificationStatus
  // No profile → conductor registration wizard
  // PENDING/SUSPENDED → status screen
  // VERIFIED → conductor tab shell
} else {
  // Existing DRIVER boot gate — unchanged
}
```

### D4. Update app/(tabs)/_layout.tsx — role-aware tabs

```typescript
if (userRole === "CONDUCTOR") {
  // Tabs: Trajets | Embarquement (NEW) | Scanner | Offres | Passeport
} else {
  // Existing driver tabs — Trajets | Offres | En direct | Scanner | Passeport
}
```

### D5. Create features/boarding/ — Conductor Boarding HUD

```
apps/driver-app/features/boarding/
  screens/
    boarding-view.tsx          <- Conductor Live tab equivalent
  components/
    boarding-progress-card.tsx
    crew-roster-card.tsx
    operator-contact-card.tsx
```

boarding-view.tsx shows:
- Boarding progress bar (X / total boarded, %)
- QR scanner quick-launch
- Trip route summary (origin to destination + departure countdown)
- Crew roster (who the PRIMARY and RELIEF drivers are)
- Operator emergency contact button
- NO speedometer, NO GPS map, NO End Trip button, NO rest break logging

### D6. Create conductor registration wizard

Simplified 2-step wizard in app/(auth)/register/ (or sub-path):
- Step 1: Personal info + national ID photo upload
- Step 2: Carrier / company selection
- No license step

### D7. Update Scanner screen to be profile-type-aware

```typescript
const userRole = useUserRole();
const checkInMutation = useMutation(
  userRole === "CONDUCTOR"
    ? trpc.conductors.checkInPassenger.mutationOptions(...)
    : trpc.drivers.checkInPassenger.mutationOptions(...)
);
```

### D8. Update Trips screen to use correct query

```typescript
const tripsQuery = useQuery(
  userRole === "CONDUCTOR"
    ? trpc.conductors.getMyTrips.queryOptions(...)
    : trpc.drivers.getMyTrips.queryOptions(...)
);
```

TripCard already receives role prop. For conductors: role = "CONDUCTOR" — no Start Trip button, no Take Over button, only Manifest + Scanner buttons show.

---

## Phase E — Operator Dashboard

### E1. Add /dashboard/operator/conductors pages

Conductor roster table — different columns than driver roster:
- Name, phone, badge number
- Employment type (FULL_TIME / CONTRACTOR)
- Verification status
- Shift status (OFFLINE / AVAILABLE / ON_TRIP)
- Total trips, average rating
- NO: license category, license expiry, safety score

### E2. Update Trip Dispatch Board — separate Vehicle Operators from Boarding Staff

```
BEFORE (confusing single dropdown with PRIMARY/RELIEF/CONDUCTOR mixed in):
  [ Assign Driver dropdown ]

AFTER (clean two-section layout):
  Vehicle Operators
    Primary:  [ driver dropdown ]  [ Assign ]
    Relief:   [ driver dropdown ]  [ Assign ] (optional)

  Boarding Staff
    Conductor: [ conductor dropdown ]  [ Assign ]   <- calls trips.assignConductor
```

---

## Phase F — Admin Dashboard

### F1. Add /dashboard/admin/conductors verification hub

Mirrors /dashboard/admin/drivers but:
- No license class column, no license expiry column
- No safety score display
- Employment doc presign (national ID, employment letter — not license front/back)
- Actions: APPROVE / REJECT / SUSPEND via admin.verifyConductor

---

## Phase G — Packages

### G1. packages/schemas/src/conductors.ts (new file)

```typescript
export const CONDUCTOR_VERIFICATION_STATUSES = ["PENDING","VERIFIED","REJECTED","SUSPENDED"] as const;
export const CONDUCTOR_STATUSES = ["OFFLINE","AVAILABLE","ON_TRIP","RESTING","SUSPENDED"] as const;

export const conductorSelfRegisterSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string(),
  nationalIdNumber: z.string().optional(),
  inviteCode: z.string().optional(),
});
```

### G2. Update packages/schemas/src/permissions.ts

Add conductor permission keys to ROLE_TEMPLATES:
conductors:read, conductors:create, conductors:update, conductors:delete, conductors:verify
conductors:verify.read, conductors:verify.manage (admin level)

---

## What Gets Deleted After Migration

| Code | What Goes Away |
|---|---|
| trips.assignDriver isConductor branch (trips.ts:1835-1878) | Deleted — assignDriver is PRIMARY/RELIEF only |
| TripDriverAssignment CONDUCTOR comment | Updated |
| Any conductor-specific logic inside drivers.ts | Deleted — conductors.ts handles conductor logic |
| Context docs referencing CONDUCTOR as a driver subrole | Updated in context/domain-specs/driver-system/ |

---

## Execution Order

```
Step 0  Phase B4 — startTrip + getTelemetryToken role guard  (TODAY — ships independently)
Step 1  Phase A   — Prisma schema migration
Step 2  Phase A6  — Data migration script
Step 3  Phase G   — packages/schemas update
Step 4  Phase B1-B7 — conductorProcedure, conductors router, assignConductor, admin/operator procedures
Step 5  Phase C   — CrewCheckInService, convergence cron, audit cron
Step 6  Phase D   — Mobile: boot gate, boarding HUD, conductor tabs, scanner/trips update
Step 7  Phase E   — Operator: conductor roster, dispatch UI split
Step 8  Phase F   — Admin: conductor verification hub
Step 9  Cleanup   — Delete dead isConductor code, update 21 context docs
```

---

## Blast Radius Summary

| Layer | Impact | Notes |
|---|---|---|
| DriverProfile schema | None | Untouched |
| TripDriverAssignment | Minimal | CONDUCTOR comment removed, logic simplified |
| drivers.ts | Minimal | startTrip gets 2-line guard, assignDriver loses isConductor branch |
| trips.ts | Low | assignDriver simplified, assignConductor added |
| DriverCheckInService | Medium | Renamed + profileType discriminator in assertBoardable |
| convergeDriversAfterRunEnd | Low | ~15 lines added for conductor convergence |
| Better Auth sessions | Medium | New CONDUCTOR value in UserRole — auth typegen regeneration |
| Driver app boot gate | Medium | Role-aware routing at app/index.tsx |
| Driver app tabs | Medium | Conditional tab set based on userRole |
| Operator dashboard | Medium | New conductor roster pages + dispatch UI split |
| Admin dashboard | Medium | New conductor verification hub |
| GPS telemetry | None | Conductors never stream — zero changes |
| Existing driver UX | None | Driver users see zero change |

---

## Open Questions (Decide Per Phase, Not Now)

1. Phase A: Should ConductorEmploymentOffer be a separate table or unified with DriverEmploymentOffer via a targetType discriminator?
2. Phase D: Should conductor registration share the /(auth)/register/ route namespace with drivers (type param) or use a separate route tree?
3. Phase E: Should conductor roster URL be /dashboard/operator/conductors or /dashboard/operator/crew/conductors alongside drivers?
