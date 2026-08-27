-- Phase 7 (Gap #17a) — Driver pay rate model & multi-affiliation compensation
--
-- Adds DriverPayModel enum (HOURLY, PER_TRIP, MONTHLY_SALARY) and assigns
-- payModel + payRateXOF to DriverCompanyAffiliation table.

-- CreateEnum
CREATE TYPE "DriverPayModel" AS ENUM ('HOURLY', 'PER_TRIP', 'MONTHLY_SALARY');

-- AlterTable
ALTER TABLE "driver_company_affiliation"
  ADD COLUMN "payModel" "DriverPayModel" NOT NULL DEFAULT 'HOURLY',
  ADD COLUMN "payRateXOF" INTEGER;

-- AlterTable (clean up legacy private column from driver_service_preference)
ALTER TABLE "driver_service_preference"
  DROP COLUMN IF EXISTS "minMonthlyRateCFA";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "driver_location_ping_recordedAt_idx" ON "driver_location_ping"("recordedAt");
