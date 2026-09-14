-- Phase 16 — Driver Onboarding Overhaul, Multi-License Categories & CACR Compliance
-- Migration: 20260913120000_driver_onboarding_multi_license_cacr
--
-- Changes:
--   1. Create enum "DriverOnboardingStep"
--   2. Create table "driver_onboarding" with foreign key to "user"
--   3. Add "licenseCategories" array column to "driver_profile" with backfill from "licenseCategory"
--   4. Add CACR columns ("cacrNumber", "cacrExpiryDate", "cacrFrontUrl", "cacrBackUrl") to "driver_profile"
--
-- Per MIGRATIONS.md Rule 2: Every schema.prisma change ships with its migration.
-- Per MIGRATIONS.md Rule 3: Never edit an applied migration. Add a new one with zero-padded naming.

-- ── 1. Create DriverOnboardingStep enum ─────────────────────────────────────────
CREATE TYPE "DriverOnboardingStep" AS ENUM ('PERSONAL', 'LICENSE', 'DOCUMENTS', 'CARRIER', 'COMPLETED');

-- ── 2. Create driver_onboarding table ──────────────────────────────────────────
CREATE TABLE "driver_onboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" "DriverOnboardingStep" NOT NULL DEFAULT 'PERSONAL',
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "draftData" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "driver_onboarding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "driver_onboarding_userId_key" ON "driver_onboarding"("userId");
CREATE INDEX "driver_onboarding_userId_idx" ON "driver_onboarding"("userId");

ALTER TABLE "driver_onboarding"
    ADD CONSTRAINT "driver_onboarding_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 3. Add licenseCategories to driver_profile & backfill ──────────────────────
ALTER TABLE "driver_profile"
    ADD COLUMN "licenseCategories" "LicenseCategory"[] DEFAULT ARRAY['D']::"LicenseCategory"[];

UPDATE "driver_profile"
    SET "licenseCategories" = ARRAY["licenseCategory"]
    WHERE "licenseCategories" IS NULL OR array_length("licenseCategories", 1) IS NULL;

-- ── 4. Add CACR compliance fields to driver_profile ────────────────────────────
ALTER TABLE "driver_profile"
    ADD COLUMN "cacrNumber" TEXT,
    ADD COLUMN "cacrExpiryDate" TIMESTAMP(3),
    ADD COLUMN "cacrFrontUrl" TEXT,
    ADD COLUMN "cacrBackUrl" TEXT;
