-- Phase 00 (F-DV-01, ratified D1-A/D2-A) — enum repair, step 2 of 2: DATA.
--
-- Maps any rows still holding pre-repair enum labels onto their shipped-model
-- equivalents so no environment can hold a value the schema cannot express:
--   DriverStatus            EN_ROUTE -> AVAILABLE, ON_BREAK -> RESTING
--   DriverVerificationStatus IN_REVIEW -> PENDING
--   DriverEmploymentType     SHARED_CONTRACTOR/CASUAL -> CONTRACTOR_URBAN
--     (on affiliations AND employment offers)
--
-- On every known environment these UPDATEs affect zero rows (the features were
-- unreachable while the labels were the only options), but the mapping is cheap,
-- defensive, and makes the repair total rather than assumption-dependent.

UPDATE "driver_profile" SET "status" = 'AVAILABLE'
WHERE "status" = 'EN_ROUTE';

UPDATE "driver_profile" SET "status" = 'RESTING'
WHERE "status" = 'ON_BREAK';

UPDATE "driver_profile" SET "verificationStatus" = 'PENDING'
WHERE "verificationStatus" = 'IN_REVIEW';

UPDATE "driver_company_affiliation" SET "employmentType" = 'CONTRACTOR_URBAN'
WHERE "employmentType" IN ('SHARED_CONTRACTOR', 'CASUAL');

UPDATE "driver_employment_offer" SET "employmentType" = 'CONTRACTOR_URBAN'
WHERE "employmentType" IN ('SHARED_CONTRACTOR', 'CASUAL');
