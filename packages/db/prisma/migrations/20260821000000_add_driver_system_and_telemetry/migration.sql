-- Migration: 20260821000000_add_driver_system_and_telemetry
-- Purpose: Add Driver ERP, Real-Time Telemetry, Multi-Company Driver Affiliations, and 3-Way Passenger Reviews.

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Expand StaffRole with DRIVER
DO $$ BEGIN
  ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'DRIVER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create LicenseCategory
DO $$ BEGIN
  CREATE TYPE "LicenseCategory" AS ENUM ('A', 'B', 'C', 'D', 'E');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create DriverVerificationStatus
DO $$ BEGIN
  CREATE TYPE "DriverVerificationStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create DriverStatus
DO $$ BEGIN
  CREATE TYPE "DriverStatus" AS ENUM ('OFFLINE', 'AVAILABLE', 'EN_ROUTE', 'ON_BREAK', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create DriverEmploymentType
DO $$ BEGIN
  CREATE TYPE "DriverEmploymentType" AS ENUM ('EXCLUSIVE_INTERCITY', 'SHARED_CONTRACTOR', 'CASUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. CREATE DRIVER SYSTEM TABLES
-- ============================================================================

-- 2.1 driver_profile
CREATE TABLE IF NOT EXISTS "driver_profile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "licenseNumber" TEXT NOT NULL,
  "licenseCategory" "LicenseCategory" NOT NULL DEFAULT 'D',
  "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
  "licenseFrontUrl" TEXT,
  "licenseBackUrl" TEXT,
  "yearsOfExperience" INTEGER NOT NULL DEFAULT 1,
  "medicalClearanceDate" TIMESTAMP(3),
  "medicalDocUrl" TEXT,
  "verificationStatus" "DriverVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP(3),
  "verifiedById" TEXT,
  "rejectionReason" TEXT,
  "status" "DriverStatus" NOT NULL DEFAULT 'OFFLINE',
  "currentTripId" TEXT,
  "lastPingAt" TIMESTAMP(3),
  "lastLatitude" DOUBLE PRECISION,
  "lastLongitude" DOUBLE PRECISION,
  "lastHeading" DOUBLE PRECISION,
  "lastSpeedKmh" DOUBLE PRECISION,
  "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  "totalReviews" INTEGER NOT NULL DEFAULT 0,
  "totalTripsCompleted" INTEGER NOT NULL DEFAULT 0,
  "totalDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "safetyScore" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "driver_profile_pkey" PRIMARY KEY ("id")
);

-- Unique constraints & indexes on driver_profile
CREATE UNIQUE INDEX IF NOT EXISTS "driver_profile_userId_key" ON "driver_profile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "driver_profile_licenseNumber_key" ON "driver_profile"("licenseNumber");
CREATE INDEX IF NOT EXISTS "driver_profile_status_idx" ON "driver_profile"("status");
CREATE INDEX IF NOT EXISTS "driver_profile_verificationStatus_idx" ON "driver_profile"("verificationStatus");
CREATE INDEX IF NOT EXISTS "driver_profile_licenseNumber_idx" ON "driver_profile"("licenseNumber");

-- 2.2 driver_company_affiliation
CREATE TABLE IF NOT EXISTS "driver_company_affiliation" (
  "id" TEXT NOT NULL,
  "driverProfileId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employmentType" "DriverEmploymentType" NOT NULL DEFAULT 'EXCLUSIVE_INTERCITY',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "badgeNumber" TEXT,
  "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "terminatedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "driver_company_affiliation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "driver_company_affiliation_driverProfileId_companyId_key" ON "driver_company_affiliation"("driverProfileId", "companyId");
CREATE INDEX IF NOT EXISTS "driver_company_affiliation_companyId_isActive_idx" ON "driver_company_affiliation"("companyId", "isActive");

-- 2.3 trip_driver_assignment
CREATE TABLE IF NOT EXISTS "trip_driver_assignment" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "driverProfileId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'PRIMARY',
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedByStaffId" TEXT,
  "startStopOrder" INTEGER NOT NULL DEFAULT 0,
  "endStopOrder" INTEGER,
  "distanceKm" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trip_driver_assignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "trip_driver_assignment_tripId_driverProfileId_role_key" ON "trip_driver_assignment"("tripId", "driverProfileId", "role");
CREATE INDEX IF NOT EXISTS "trip_driver_assignment_tripId_idx" ON "trip_driver_assignment"("tripId");
CREATE INDEX IF NOT EXISTS "trip_driver_assignment_driverProfileId_idx" ON "trip_driver_assignment"("driverProfileId");

-- 2.4 driver_location_ping
CREATE TABLE IF NOT EXISTS "driver_location_ping" (
  "id" TEXT NOT NULL,
  "driverProfileId" TEXT NOT NULL,
  "tripId" TEXT,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "heading" DOUBLE PRECISION,
  "speedKmh" DOUBLE PRECISION,
  "accuracyMeters" DOUBLE PRECISION,
  "altitudeMeters" DOUBLE PRECISION,
  "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
  "anomalyReason" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "driver_location_ping_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "driver_location_ping_tripId_recordedAt_idx" ON "driver_location_ping"("tripId", "recordedAt");
CREATE INDEX IF NOT EXISTS "driver_location_ping_driverProfileId_recordedAt_idx" ON "driver_location_ping"("driverProfileId", "recordedAt");

-- 2.5 driver_shift
CREATE TABLE IF NOT EXISTS "driver_shift" (
  "id" TEXT NOT NULL,
  "driverProfileId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "totalMinutes" INTEGER,
  "serviceType" "ServiceType" NOT NULL DEFAULT 'INTERCITY',
  "tripsCompleted" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "driver_shift_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "driver_shift_driverProfileId_startedAt_idx" ON "driver_shift"("driverProfileId", "startedAt");
CREATE INDEX IF NOT EXISTS "driver_shift_companyId_startedAt_idx" ON "driver_shift"("companyId", "startedAt");

-- ============================================================================
-- 3. EXTEND EXISTING TABLES (trip & review)
-- ============================================================================

-- Expand trip table
ALTER TABLE "trip" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "trip" ADD COLUMN IF NOT EXISTS "reliefDriverId" TEXT;
CREATE INDEX IF NOT EXISTS "trip_driverId_idx" ON "trip"("driverId");
CREATE INDEX IF NOT EXISTS "trip_reliefDriverId_idx" ON "trip"("reliefDriverId");

-- Expand review table with 3-way ratings and relation columns
ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "driverRating" INTEGER;
ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "busRating" INTEGER;
ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "punctualityRating" INTEGER;
ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "busId" TEXT;
ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "tripId" TEXT;

CREATE INDEX IF NOT EXISTS "review_driverId_idx" ON "review"("driverId");
CREATE INDEX IF NOT EXISTS "review_busId_idx" ON "review"("busId");
CREATE INDEX IF NOT EXISTS "review_tripId_idx" ON "review"("tripId");

-- ============================================================================
-- 4. FOREIGN KEY CONSTRAINTS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_profile_userId_fkey') THEN
    ALTER TABLE "driver_profile" ADD CONSTRAINT "driver_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_profile_verifiedById_fkey') THEN
    ALTER TABLE "driver_profile" ADD CONSTRAINT "driver_profile_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_profile_currentTripId_fkey') THEN
    ALTER TABLE "driver_profile" ADD CONSTRAINT "driver_profile_currentTripId_fkey" FOREIGN KEY ("currentTripId") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_company_affiliation_driverProfileId_fkey') THEN
    ALTER TABLE "driver_company_affiliation" ADD CONSTRAINT "driver_company_affiliation_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "driver_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_company_affiliation_companyId_fkey') THEN
    ALTER TABLE "driver_company_affiliation" ADD CONSTRAINT "driver_company_affiliation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_driver_assignment_tripId_fkey') THEN
    ALTER TABLE "trip_driver_assignment" ADD CONSTRAINT "trip_driver_assignment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_driver_assignment_driverProfileId_fkey') THEN
    ALTER TABLE "trip_driver_assignment" ADD CONSTRAINT "trip_driver_assignment_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "driver_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_location_ping_driverProfileId_fkey') THEN
    ALTER TABLE "driver_location_ping" ADD CONSTRAINT "driver_location_ping_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "driver_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_location_ping_tripId_fkey') THEN
    ALTER TABLE "driver_location_ping" ADD CONSTRAINT "driver_location_ping_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_shift_driverProfileId_fkey') THEN
    ALTER TABLE "driver_shift" ADD CONSTRAINT "driver_shift_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "driver_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'driver_shift_companyId_fkey') THEN
    ALTER TABLE "driver_shift" ADD CONSTRAINT "driver_shift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_driverId_fkey') THEN
    ALTER TABLE "trip" ADD CONSTRAINT "trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trip_reliefDriverId_fkey') THEN
    ALTER TABLE "trip" ADD CONSTRAINT "trip_reliefDriverId_fkey" FOREIGN KEY ("reliefDriverId") REFERENCES "driver_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_driverId_fkey') THEN
    ALTER TABLE "review" ADD CONSTRAINT "review_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_busId_fkey') THEN
    ALTER TABLE "review" ADD CONSTRAINT "review_busId_fkey" FOREIGN KEY ("busId") REFERENCES "bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_tripId_fkey') THEN
    ALTER TABLE "review" ADD CONSTRAINT "review_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 5. IDEMPOTENT DATA BACKFILL
-- ============================================================================

-- 5.1 Backfill DriverProfile for staff members with role = 'DRIVER'
INSERT INTO "driver_profile" (
  "id", "userId", "licenseNumber", "licenseCategory", "licenseExpiryDate",
  "verificationStatus", "verifiedAt", "averageRating", "totalReviews",
  "totalTripsCompleted", "totalDistanceKm", "safetyScore", "createdAt", "updatedAt"
)
SELECT
  'drv_' || substr(md5(random()::text || s."id"), 1, 20),
  s."userId",
  'CI-DRV-' || substr(md5(s."id"), 1, 8),
  'D'::"LicenseCategory",
  CURRENT_TIMESTAMP + INTERVAL '3 years',
  CASE WHEN s."status" = 'ACTIVE' THEN 'VERIFIED'::"DriverVerificationStatus" ELSE 'PENDING'::"DriverVerificationStatus" END,
  CASE WHEN s."status" = 'ACTIVE' THEN s."joinedAt" ELSE NULL END,
  5.0,
  0,
  0,
  0.0,
  98,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "operator" s
WHERE s."role"::text = 'DRIVER'
  AND s."deletedAt" IS NULL
  AND s."userId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "driver_profile" dp WHERE dp."userId" = s."userId"
  );

-- 5.2 Backfill DriverCompanyAffiliation for driver staff members
INSERT INTO "driver_company_affiliation" (
  "id", "driverProfileId", "companyId", "employmentType", "isActive", "isVerified", "badgeNumber", "hiredAt", "createdAt", "updatedAt"
)
SELECT
  'aff_' || substr(md5(random()::text || s."id"), 1, 20),
  dp."id",
  s."companyId",
  'EXCLUSIVE_INTERCITY'::"DriverEmploymentType",
  (s."status" = 'ACTIVE'),
  (s."status" = 'ACTIVE'),
  'DRV-' || UPPER(substr(s."id", -4)),
  s."joinedAt",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "operator" s
JOIN "driver_profile" dp ON dp."userId" = s."userId"
WHERE s."role"::text = 'DRIVER'
  AND s."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "driver_company_affiliation" dca
    WHERE dca."driverProfileId" = dp."id" AND dca."companyId" = s."companyId"
  );

-- 5.3 Backfill Reviews with tripId, busId, and 3-way ratings from booking
UPDATE "review" r
SET
  "tripId" = b."tripId",
  "busId" = COALESCE(r."busId", t."busId"),
  "driverId" = COALESCE(r."driverId", t."driverId"),
  "driverRating" = COALESCE(r."driverRating", r."rating"),
  "busRating" = COALESCE(r."busRating", r."rating"),
  "punctualityRating" = COALESCE(r."punctualityRating", r."rating")
FROM "booking" b
LEFT JOIN "trip" t ON t."id" = b."tripId"
WHERE r."bookingId" = b."id"
  AND (r."tripId" IS NULL OR r."driverRating" IS NULL);
