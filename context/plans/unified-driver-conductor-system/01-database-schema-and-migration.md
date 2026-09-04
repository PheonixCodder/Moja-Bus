# Phase 1: Database Schema & Migration

> **File**: `context/plans/unified-driver-conductor-system/01-database-schema-and-migration.md`  
> **Target Schema**: `packages/db/prisma/schema.prisma`  
> **Status**: Ready for Implementation  

---

## 1. Objectives

1. Add explicit `conductorStaffId` to `model Trip` referencing `model Operator` (company staff).
2. Retain `driverId` (Primary Driver) and `reliefDriverId` (Optional Relief Driver) on `model Trip` referencing `model DriverProfile`.
3. Purge all `CONDUCTOR` role remnants, legacy comments, and exemption workarounds from `TripDriverAssignment` and `DriverProfile`.
4. Run Prisma validation, migration, and typegen.

---

## 2. Prisma Schema Modifications

### A. Update `model Trip` in `packages/db/prisma/schema.prisma`

Add the `conductorStaffId` foreign key and relation:

```prisma
model Trip {
  id                 String              @id @default(cuid())
  companyId          String
  company            Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
  routeId            String
  route              Route               @relation(fields: [routeId], references: [id], onDelete: Cascade)
  busId              String?
  bus                Bus?                @relation(fields: [busId], references: [id], onDelete: SetNull)

  // 1. Primary Driver (DriverProfile)
  driverId           String?
  driver             DriverProfile?      @relation("TripAssignedDriver", fields: [driverId], references: [id], onDelete: SetNull)

  // 2. Relief Driver (DriverProfile - Optional Backup)
  reliefDriverId     String?
  reliefDriver       DriverProfile?      @relation("TripReliefDriver", fields: [reliefDriverId], references: [id], onDelete: SetNull)

  // 3. Conductor (Operator Staff - Optional Boarding/Check-in Staff)
  conductorStaffId   String?
  conductorStaff     Operator?           @relation("TripAssignedConductor", fields: [conductorStaffId], references: [id], onDelete: SetNull)

  // Crew assignments tracking (Primary & Relief only)
  driverAssignments  TripDriverAssignment[]

  // Status and Timestamps
  status             TripStatus          @default(SCHEDULED)
  departureDate      DateTime
  estimatedArrival   DateTime?
  // ... other fields remain unchanged

  @@index([companyId])
  @@index([driverId])
  @@index([reliefDriverId])
  @@index([conductorStaffId])
  @@index([status])
  @@map("trip")
}
```

### B. Update `model Operator` in `packages/db/prisma/schema.prisma`

Add the reverse relation on `Operator` to track which trips a staff conductor has been assigned to:

```prisma
model Operator {
  id                     String                    @id @default(cuid())
  userId                 String
  user                   User                      @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyId              String
  company                Company                   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  role                   StaffRole                 @default(OWNER)
  permissions            String[]                  @default([])
  status                 OperatorStatus            @default(ACTIVE)

  // Trips assigned to this staff member as a Conductor
  tripsConducted         Trip[]                    @relation("TripAssignedConductor")

  // ... other fields remain unchanged
  @@unique([userId, companyId])
  @@index([companyId])
  @@index([userId])
  @@index([role])
  @@map("operator")
}
```

### C. Clean up `model TripDriverAssignment`

Update the `role` field comment to explicitly state that only vehicle drivers (`PRIMARY` and `RELIEF`) are recorded here:

```prisma
model TripDriverAssignment {
  id                  String         @id @default(cuid())
  tripId              String
  trip                Trip           @relation(fields: [tripId], references: [id], onDelete: Cascade)
  driverProfileId     String
  driverProfile       DriverProfile  @relation(fields: [driverProfileId], references: [id], onDelete: Cascade)

  // Role: "PRIMARY" | "RELIEF" only. (CONDUCTOR is now handled via Trip.conductorStaffId -> Operator)
  role                String         @default("PRIMARY")

  startStopOrder      Int            @default(0)
  endStopOrder        Int?
  distanceKm          Float?
  assignedAt          DateTime       @default(now())
  assignedByStaffId   String?
  urgentDispatchAckAt DateTime?

  @@unique([tripId, driverProfileId, role])
  @@index([tripId])
  @@index([driverProfileId])
  @@map("trip_driver_assignment")
}
```

---

## 3. Data Migration & Cleanup

Run a pre-check SQL query before applying the migration:

```sql
-- Check if any legacy CONDUCTOR rows exist in trip_driver_assignment
SELECT COUNT(*) FROM trip_driver_assignment WHERE role = 'CONDUCTOR';

-- If any exist (pre-launch data), delete them safely
DELETE FROM trip_driver_assignment WHERE role = 'CONDUCTOR';
```

---

## 4. Execution Steps

1. Edit `packages/db/prisma/schema.prisma` with the modifications above.
2. Run `pnpm --filter @moja/db exec prisma format`.
3. Run `pnpm --filter @moja/db exec prisma db push` or `prisma migrate dev --name add_trip_conductor_staff`.
4. Run `pnpm --filter @moja/db exec prisma generate` to update client types.
