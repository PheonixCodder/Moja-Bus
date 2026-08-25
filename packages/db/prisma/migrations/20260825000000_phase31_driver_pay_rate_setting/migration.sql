-- Phase 31 (F-DV-11) — configurable placeholder driver pay rate.
-- Single source of truth for driver-facing earnings math (was hardcoded
-- ×50 XOF/min in drivers.getMyEarnings). Replaced by the pay-rate model
-- on the roadmap; ops can tune this column without a redeploy.
ALTER TABLE "platform_settings"
  ADD COLUMN "driverPayRateXofPerMinute" INTEGER NOT NULL DEFAULT 50;
