-- Migration: 20260901000000_phase35_route_turnaround_and_ping_anomaly_index
-- Purpose:
--   1. Add `turnaroundBufferMinutes` column to `route` table.
--      When NULL, the application defaults to DRIVER_TURNAROUND_BUFFER_MINUTES (45 min).
--   2. Add composite index on `driver_location_ping` for anomaly queries by driver.

-- AlterTable
ALTER TABLE "route" ADD COLUMN "turnaroundBufferMinutes" INTEGER;

-- CreateIndex
CREATE INDEX "driver_location_ping_driverProfileId_isAnomaly_recordedAt_idx" ON "driver_location_ping"("driverProfileId", "isAnomaly", "recordedAt");
