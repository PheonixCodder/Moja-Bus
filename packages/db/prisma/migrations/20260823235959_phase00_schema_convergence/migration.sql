-- Phase 00 (F-DV-01) — SCHEMA CONVERGENCE (idempotent/defensive edition).
--
-- Generated from `prisma migrate diff` against a clean-volume replay, then
-- hardened after the first live run: real environments can be DB-PUSH-MIXED
-- (Neon already held BannerActionType/promo_banner from an earlier push era),
-- so every statement here is guarded — equal-state rebuilds skip themselves,
-- existing objects are not re-created. Safe on BOTH fresh volumes and
-- db-push-mixed environments; end state is exactly schema.prisma either way.
--
-- Closes (all found by the 2026-08-23 clean-volume rehearsal):
--   * promo_banner + BannerActionType existed only in the datamodel.
--   * Six enums rebuilt to exact datamodel label sets (ADD VALUE cannot
--     remove legacy labels).
--   * Driver-family updatedAt defaults + referral_program.id default aligned.
--
-- Run ONLY after 20260823000001_phase00_driver_enum_repair_data.

-- ---- Defensive data alignment (idempotent) ----
UPDATE "driver_profile" SET "licenseCategory" = 'B' WHERE "licenseCategory" = 'A';
UPDATE "driver_profile" SET "status" = 'AVAILABLE' WHERE "status" = 'EN_ROUTE';
UPDATE "driver_profile" SET "status" = 'RESTING' WHERE "status" = 'ON_BREAK';
UPDATE "driver_profile" SET "verificationStatus" = 'PENDING' WHERE "verificationStatus" = 'IN_REVIEW';
UPDATE "driver_company_affiliation" SET "employmentType" = 'CONTRACTOR_URBAN' WHERE "employmentType" IN ('SHARED_CONTRACTOR', 'CASUAL');
UPDATE "driver_employment_offer" SET "employmentType" = 'CONTRACTOR_URBAN' WHERE "employmentType" IN ('SHARED_CONTRACTOR', 'CASUAL');

-- ---- Convergence body (guarded) ----

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BannerActionType') THEN
    CREATE TYPE "BannerActionType" AS ENUM ('SEARCH', 'APP_SCREEN', 'BLOG_ARTICLE', 'EXTERNAL_URL');
  END IF;
END $$;

-- DriverEmploymentType → ('EXCLUSIVE_INTERCITY','CONTRACTOR_URBAN','HYBRID')
DO $$
DECLARE cur text[];
BEGIN
  SELECT COALESCE(array_agg(v ORDER BY v), '{}') INTO cur
    FROM (SELECT unnest(enum_range(NULL::"DriverEmploymentType")) AS v) s;
  IF cur <> ARRAY['CONTRACTOR_URBAN','EXCLUSIVE_INTERCITY','HYBRID']::text[] THEN
    CREATE TYPE "DriverEmploymentType_new" AS ENUM ('EXCLUSIVE_INTERCITY', 'CONTRACTOR_URBAN', 'HYBRID');
    ALTER TABLE "public"."driver_company_affiliation" ALTER COLUMN "employmentType" DROP DEFAULT;
    ALTER TABLE "public"."driver_employment_offer" ALTER COLUMN "employmentType" DROP DEFAULT;
    ALTER TABLE "public"."driver_service_preference" ALTER COLUMN "preferredType" DROP DEFAULT;
    ALTER TABLE "driver_company_affiliation" ALTER COLUMN "employmentType" TYPE "DriverEmploymentType_new" USING ("employmentType"::text::"DriverEmploymentType_new");
    ALTER TABLE "driver_service_preference" ALTER COLUMN "preferredType" TYPE "DriverEmploymentType_new" USING ("preferredType"::text::"DriverEmploymentType_new");
    ALTER TABLE "driver_employment_offer" ALTER COLUMN "employmentType" TYPE "DriverEmploymentType_new" USING ("employmentType"::text::"DriverEmploymentType_new");
    ALTER TYPE "DriverEmploymentType" RENAME TO "DriverEmploymentType_old";
    ALTER TYPE "DriverEmploymentType_new" RENAME TO "DriverEmploymentType";
    DROP TYPE "public"."DriverEmploymentType_old";
    ALTER TABLE "driver_company_affiliation" ALTER COLUMN "employmentType" SET DEFAULT 'EXCLUSIVE_INTERCITY';
    ALTER TABLE "driver_employment_offer" ALTER COLUMN "employmentType" SET DEFAULT 'EXCLUSIVE_INTERCITY';
    ALTER TABLE "driver_service_preference" ALTER COLUMN "preferredType" SET DEFAULT 'EXCLUSIVE_INTERCITY';
  END IF;
END $$;

-- DriverStatus → ('OFFLINE','AVAILABLE','ON_DUTY','ON_TRIP','RESTING','SUSPENDED')
DO $$
DECLARE cur text[];
BEGIN
  SELECT COALESCE(array_agg(v ORDER BY v), '{}') INTO cur
    FROM (SELECT unnest(enum_range(NULL::"DriverStatus")) AS v) s;
  IF cur <> ARRAY['AVAILABLE','OFFLINE','ON_DUTY','ON_TRIP','RESTING','SUSPENDED']::text[] THEN
    CREATE TYPE "DriverStatus_new" AS ENUM ('OFFLINE', 'AVAILABLE', 'ON_DUTY', 'ON_TRIP', 'RESTING', 'SUSPENDED');
    ALTER TABLE "public"."driver_profile" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "driver_profile" ALTER COLUMN "status" TYPE "DriverStatus_new" USING ("status"::text::"DriverStatus_new");
    ALTER TYPE "DriverStatus" RENAME TO "DriverStatus_old";
    ALTER TYPE "DriverStatus_new" RENAME TO "DriverStatus";
    DROP TYPE "public"."DriverStatus_old";
    ALTER TABLE "driver_profile" ALTER COLUMN "status" SET DEFAULT 'OFFLINE';
  END IF;
END $$;

-- DriverVerificationStatus → ('PENDING','VERIFIED','REJECTED','EXPIRED','SUSPENDED')
DO $$
DECLARE cur text[];
BEGIN
  SELECT COALESCE(array_agg(v ORDER BY v), '{}') INTO cur
    FROM (SELECT unnest(enum_range(NULL::"DriverVerificationStatus")) AS v) s;
  IF cur <> ARRAY['EXPIRED','PENDING','REJECTED','SUSPENDED','VERIFIED']::text[] THEN
    CREATE TYPE "DriverVerificationStatus_new" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'SUSPENDED');
    ALTER TABLE "public"."driver_profile" ALTER COLUMN "verificationStatus" DROP DEFAULT;
    ALTER TABLE "driver_profile" ALTER COLUMN "verificationStatus" TYPE "DriverVerificationStatus_new" USING ("verificationStatus"::text::"DriverVerificationStatus_new");
    ALTER TYPE "DriverVerificationStatus" RENAME TO "DriverVerificationStatus_old";
    ALTER TYPE "DriverVerificationStatus_new" RENAME TO "DriverVerificationStatus";
    DROP TYPE "public"."DriverVerificationStatus_old";
    ALTER TABLE "driver_profile" ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING';
  END IF;
END $$;

-- InstrumentType → ('COUPON_CODE','AUTO_PROMO','CREDIT_LOT')
DO $$
DECLARE cur text[];
BEGIN
  SELECT COALESCE(array_agg(v ORDER BY v), '{}') INTO cur
    FROM (SELECT unnest(enum_range(NULL::"InstrumentType")) AS v) s;
  IF cur <> ARRAY['AUTO_PROMO','COUPON_CODE','CREDIT_LOT']::text[] THEN
    CREATE TYPE "InstrumentType_new" AS ENUM ('COUPON_CODE', 'AUTO_PROMO', 'CREDIT_LOT');
    ALTER TABLE "discount_redemption" ALTER COLUMN "instrumentType" TYPE "InstrumentType_new" USING ("instrumentType"::text::"InstrumentType_new");
    ALTER TYPE "InstrumentType" RENAME TO "InstrumentType_old";
    ALTER TYPE "InstrumentType_new" RENAME TO "InstrumentType";
    DROP TYPE "public"."InstrumentType_old";
  END IF;
END $$;

-- LicenseCategory → ('B','C','D','E')
DO $$
DECLARE cur text[];
BEGIN
  SELECT COALESCE(array_agg(v ORDER BY v), '{}') INTO cur
    FROM (SELECT unnest(enum_range(NULL::"LicenseCategory")) AS v) s;
  IF cur <> ARRAY['B','C','D','E']::text[] THEN
    CREATE TYPE "LicenseCategory_new" AS ENUM ('B', 'C', 'D', 'E');
    ALTER TABLE "public"."driver_profile" ALTER COLUMN "licenseCategory" DROP DEFAULT;
    ALTER TABLE "bus_type" ALTER COLUMN "requiredLicenseCategory" TYPE "LicenseCategory_new" USING ("requiredLicenseCategory"::text::"LicenseCategory_new");
    ALTER TABLE "driver_profile" ALTER COLUMN "licenseCategory" TYPE "LicenseCategory_new" USING ("licenseCategory"::text::"LicenseCategory_new");
    ALTER TYPE "LicenseCategory" RENAME TO "LicenseCategory_old";
    ALTER TYPE "LicenseCategory_new" RENAME TO "LicenseCategory";
    DROP TYPE "public"."LicenseCategory_old";
    ALTER TABLE "driver_profile" ALTER COLUMN "licenseCategory" SET DEFAULT 'D';
  END IF;
END $$;

-- RefundChannel → ('CASH','PAYSTACK','WALLET')
DO $$
DECLARE cur text[];
BEGIN
  SELECT COALESCE(array_agg(v ORDER BY v), '{}') INTO cur
    FROM (SELECT unnest(enum_range(NULL::"RefundChannel")) AS v) s;
  IF cur <> ARRAY['CASH','PAYSTACK','WALLET']::text[] THEN
    CREATE TYPE "RefundChannel_new" AS ENUM ('CASH', 'PAYSTACK', 'WALLET');
    ALTER TABLE "refund" ALTER COLUMN "channel" TYPE "RefundChannel_new" USING ("channel"::text::"RefundChannel_new");
    ALTER TYPE "RefundChannel" RENAME TO "RefundChannel_old";
    ALTER TYPE "RefundChannel_new" RENAME TO "RefundChannel";
    DROP TYPE "public"."RefundChannel_old";
  END IF;
END $$;

-- Column default alignments (DROP DEFAULT is idempotent in PG)
ALTER TABLE "driver_company_affiliation" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "driver_employment_offer" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "driver_profile" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "driver_service_preference" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "referral_program" ALTER COLUMN "id" SET DEFAULT 'default';
ALTER TABLE "trip_driver_assignment" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE TABLE IF NOT EXISTS "promo_banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "badge" TEXT,
    "imageUrl" TEXT NOT NULL,
    "actionType" "BannerActionType" NOT NULL DEFAULT 'SEARCH',
    "actionPayload" JSONB,
    "gradientColors" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_banner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "promo_banner_isActive_sortOrder_idx" ON "promo_banner"("isActive", "sortOrder");
