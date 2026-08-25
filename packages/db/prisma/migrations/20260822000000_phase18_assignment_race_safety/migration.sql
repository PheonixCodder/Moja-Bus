-- Phase 18 (P2-8) — DB backstops for driver-assignment races.
-- 1) Repair any historical duplicate PRIMARY/RELIEF rows (keep most recently assigned).
-- 2) Partial unique indexes: exactly one PRIMARY and one RELIEF per trip,
--    mirroring the singular trip.driverId / trip.reliefDriverId columns.

DELETE FROM "trip_driver_assignment" a
  USING "trip_driver_assignment" b
  WHERE a.role = 'PRIMARY'
    AND b.role = 'PRIMARY'
    AND a."tripId" = b."tripId"
    AND a.id <> b.id
    AND (a."assignedAt", a.id) < (b."assignedAt", b.id);

DELETE FROM "trip_driver_assignment" a
  USING "trip_driver_assignment" b
  WHERE a.role = 'RELIEF'
    AND b.role = 'RELIEF'
    AND a."tripId" = b."tripId"
    AND a.id <> b.id
    AND (a."assignedAt", a.id) < (b."assignedAt", b.id);

CREATE UNIQUE INDEX IF NOT EXISTS "trip_driver_assignment_one_primary_per_trip"
  ON "trip_driver_assignment"("tripId")
  WHERE role = 'PRIMARY';

CREATE UNIQUE INDEX IF NOT EXISTS "trip_driver_assignment_one_relief_per_trip"
  ON "trip_driver_assignment"("tripId")
  WHERE role = 'RELIEF';
