-- Phase 17 (D2): retire legacy DRIVER-role Operator rows.
-- createDriver used to grant rostered drivers an ERP Operator row (role DRIVER)
-- with staff permissions and a seat in company notification fan-out. Drivers are
-- not ERP staff: soft-delete those rows and re-role their placeholder users.
--
-- Phase 00 (F-DV-01) CASE FIX 2026-08-23: this file originally referenced
-- "Operator" / "User" / "DriverProfile" — Prisma's model names — but every one
-- of those models carries an @@map to snake_case ("operator", "user",
-- "driver_profile"; schema.prisma lines 796/455/2268+), which is what ALL
-- migrations (baseline included) actually create. The original spelling made
-- `migrate deploy` fail on any clean volume with `relation "Operator" does
-- not exist` (proven by clean-volume rehearsal on real Postgres 16). Edited
-- in place under the documented exception: these six phase09–17 migration
-- dirs were untracked, are RECORDED nowhere as applied-by-migrations, and had
-- never replayed successfully anywhere before this fix. Environments that got
-- their schema via db-push already hold the mapped lowercase names, so the
-- corrected identifiers match them too.

UPDATE "operator"
SET "deletedAt" = NOW(), "isActive" = false
WHERE "role" = 'DRIVER' AND "deletedAt" IS NULL;

-- Placeholder driver accounts were created as OPERATOR solely to satisfy the
-- ERP gate. Re-role them to DRIVER, but never touch a user who still holds a
-- real (non-driver) operator membership, or who has no DriverProfile at all.
UPDATE "user" u
SET "role" = 'DRIVER'
WHERE u."role" = 'OPERATOR'
  AND EXISTS (SELECT 1 FROM "driver_profile" dp WHERE dp."userId" = u."id")
  AND NOT EXISTS (
    SELECT 1
    FROM "operator" o
    WHERE o."userId" = u."id"
      AND o."role" <> 'DRIVER'
      AND o."deletedAt" IS NULL
  );
