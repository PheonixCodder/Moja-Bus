-- Phase 00 (F-DV-01, ratified D1-A/D2-A) — enum repair, step 1 of 2: VALUES.
--
-- The committed baseline (20260821000000_add_driver_system_and_telemetry) created
-- these four enums with labels no code ever used (EN_ROUTE, ON_BREAK, IN_REVIEW,
-- SHARED_CONTRACTOR, CASUAL, LicenseCategory 'A') and omitted the labels the
-- schema and application actually use. No later migration ever altered them.
--
-- This migration adds ONLY the missing labels. It deliberately does not USE any
-- newly-added value — PostgreSQL forbids using a new enum value inside the
-- transaction that adds it (same reason phase17_user_role_driver_enum is split).
-- The data mapping that uses them lives in 20260823000001_phase00_driver_enum_repair_data.
--
-- All statements are idempotent: environments whose schema was synced via
-- `prisma db push` already have these labels and no-op here.

ALTER TYPE "DriverStatus" ADD VALUE IF NOT EXISTS 'ON_DUTY';
ALTER TYPE "DriverStatus" ADD VALUE IF NOT EXISTS 'ON_TRIP';
ALTER TYPE "DriverStatus" ADD VALUE IF NOT EXISTS 'RESTING';

ALTER TYPE "DriverVerificationStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TYPE "DriverEmploymentType" ADD VALUE IF NOT EXISTS 'CONTRACTOR_URBAN';
ALTER TYPE "DriverEmploymentType" ADD VALUE IF NOT EXISTS 'HYBRID';

-- LicenseCategory: baseline created ('A','B','C','D','E'); schema declares B..E.
-- PostgreSQL cannot DROP an enum label; 'A' stays as an unused, harmless value.
