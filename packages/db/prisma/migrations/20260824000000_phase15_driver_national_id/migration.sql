-- Phase 15 (F-DV-05) — persist the national ID the wizard already collects.
-- Nullable: existing driver rows keep working; the value is optional input.

ALTER TABLE "driver_profile" ADD COLUMN "nationalIdNumber" TEXT;
