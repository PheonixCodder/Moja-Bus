-- Phase 3 (3.2) — one active EXCLUSIVE_INTERCITY affiliation per driver, enforced by the database.
--
-- Product rule: an EXCLUSIVE_INTERCITY driver has exactly one active employing operator at a time.
-- CONTRACTOR_URBAN and HYBRID drivers may hold multiple simultaneous affiliations (no constraint).
--
-- 1) Repair first: terminate all-but-the-most-recently-hired active EXCLUSIVE_INTERCITY affiliations
--    per driver. ROW_NUMBER keeps the latest hiredAt as the survivor; older strays are closed
--    now with accurate timestamps. Without this repair the index below would fail on any environment
--    that ever hit the double-exclusive bug.
--
-- 2) Backstop: partial unique index makes a second active EXCLUSIVE_INTERCITY affiliation
--    physically impossible regardless of application bugs or races.
--    Mirrors the house style of 20260824000001_phase17_shift_unique_open.

-- Step 1: Repair duplicates
UPDATE "driver_company_affiliation" dca
SET "isActive"     = false,
    "terminatedAt" = NOW()
WHERE dca."isActive"      = true
  AND dca."employmentType" = 'EXCLUSIVE_INTERCITY'
  AND dca.id NOT IN (
    SELECT ranked.id FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY "driverProfileId"
               ORDER BY "hiredAt" DESC
             ) AS rn
      FROM "driver_company_affiliation"
      WHERE "isActive"      = true
        AND "employmentType" = 'EXCLUSIVE_INTERCITY'
    ) ranked
    WHERE ranked.rn = 1
  );

-- Step 2: Partial unique index backstop
CREATE UNIQUE INDEX "driver_company_affiliation_one_active_exclusive"
  ON "driver_company_affiliation"("driverProfileId")
  WHERE "isActive" = true AND "employmentType" = 'EXCLUSIVE_INTERCITY';
