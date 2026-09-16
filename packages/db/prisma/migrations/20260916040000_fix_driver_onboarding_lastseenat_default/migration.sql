-- Migration: 20260916040000_fix_driver_onboarding_lastseenat_default
-- Description: Drop default CURRENT_TIMESTAMP from driver_onboarding.lastSeenAt to align with Prisma @updatedAt
--
-- Prisma manages @updatedAt columns at application level and generates schemas expecting no SQL-level default.
-- This aligns driver_onboarding with the codebase convention established in 20260823235959_phase00_schema_convergence.

ALTER TABLE "driver_onboarding" ALTER COLUMN "lastSeenAt" DROP DEFAULT;
