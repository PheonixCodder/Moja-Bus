-- Migration: 20260821120000_phase09_driver_service_preference
-- Purpose: Add DriverServicePreference table for the driver marketplace (Phase 9).
--          Auto-creates preference records for all existing verified drivers so
--          they appear in the marketplace with safe defaults (isAvailableForHire=false).
--          No data loss — all existing DriverProfile, DriverCompanyAffiliation, and
--          related records are untouched.

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "driver_service_preference" (
    "id"                  TEXT        NOT NULL,
    "driverProfileId"     TEXT        NOT NULL,
    "isAvailableForHire"  BOOLEAN     NOT NULL DEFAULT false,
    "preferredType"       "DriverEmploymentType" NOT NULL DEFAULT 'EXCLUSIVE_INTERCITY',
    "cityBase"            TEXT,
    "routeExperience"     TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "minMonthlyRateCFA"   INTEGER,
    "bio"                 TEXT,
    "isFeatured"          BOOLEAN     NOT NULL DEFAULT false,
    "isSuspended"         BOOLEAN     NOT NULL DEFAULT false,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_service_preference_pkey"      PRIMARY KEY ("id"),
    CONSTRAINT "driver_service_preference_driverProfileId_key" UNIQUE ("driverProfileId")
);

-- ============================================================================
-- 2. FOREIGN KEY
-- ============================================================================

ALTER TABLE "driver_service_preference"
    ADD CONSTRAINT "driver_service_preference_driverProfileId_fkey"
    FOREIGN KEY ("driverProfileId")
    REFERENCES "driver_profile"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS "driver_service_preference_isAvailableForHire_preferredType_idx"
    ON "driver_service_preference"("isAvailableForHire", "preferredType");

CREATE INDEX IF NOT EXISTS "driver_service_preference_cityBase_idx"
    ON "driver_service_preference"("cityBase");

-- ============================================================================
-- 4. DATA MIGRATION — Backfill preference records for existing drivers
--
--    Rules (safe defaults, no data loss):
--    - VERIFIED drivers: isAvailableForHire = false (they must opt-in explicitly)
--    - preferredType: inferred from their most recent active affiliation employmentType,
--      or EXCLUSIVE_INTERCITY as default if no affiliation exists
--    - cityBase, routeExperience, bio: NULL / empty (driver fills in via app)
--    - isFeatured, isSuspended: false
-- ============================================================================

INSERT INTO "driver_service_preference" (
    "id",
    "driverProfileId",
    "isAvailableForHire",
    "preferredType",
    "cityBase",
    "routeExperience",
    "minMonthlyRateCFA",
    "bio",
    "isFeatured",
    "isSuspended",
    "createdAt",
    "updatedAt"
)
SELECT
    -- Generate a deterministic-ish cuid-style id using gen_random_uuid()
    'cuid_backfill_' || replace(gen_random_uuid()::text, '-', ''),
    dp.id,
    false,  -- isAvailableForHire: drivers must explicitly opt in
    COALESCE(
        -- Use the most recent active affiliation's employment type
        (
            SELECT dca."employmentType"
            FROM "driver_company_affiliation" dca
            WHERE dca."driverProfileId" = dp.id
              AND dca."isActive" = true
            ORDER BY dca."hiredAt" DESC
            LIMIT 1
        ),
        'EXCLUSIVE_INTERCITY'::"DriverEmploymentType"  -- safe default
    ),
    NULL,       -- cityBase: driver fills in
    ARRAY[]::TEXT[],   -- routeExperience: driver fills in
    NULL,       -- minMonthlyRateCFA: private, driver sets
    NULL,       -- bio: future
    false,      -- isFeatured
    false,      -- isSuspended
    NOW(),
    NOW()
FROM "driver_profile" dp
WHERE NOT EXISTS (
    -- Idempotent: skip if preference record already exists
    SELECT 1
    FROM "driver_service_preference" dsp
    WHERE dsp."driverProfileId" = dp.id
);

-- ============================================================================
-- 5. VERIFY
-- ============================================================================

-- This will show counts after migration (informational — does not fail migration)
DO $$
DECLARE
    v_total_drivers      INTEGER;
    v_total_preferences  INTEGER;
    v_missing            INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_drivers  FROM "driver_profile";
    SELECT COUNT(*) INTO v_total_preferences FROM "driver_service_preference";
    v_missing := v_total_drivers - v_total_preferences;

    RAISE NOTICE 'Phase 9 Migration Complete:';
    RAISE NOTICE '  driver_profile rows:              %', v_total_drivers;
    RAISE NOTICE '  driver_service_preference rows:   %', v_total_preferences;
    RAISE NOTICE '  Missing preference records:       %', v_missing;

    IF v_missing > 0 THEN
        RAISE WARNING 'Some driver profiles have no preference record. Check for constraint violations.';
    END IF;
END $$;
