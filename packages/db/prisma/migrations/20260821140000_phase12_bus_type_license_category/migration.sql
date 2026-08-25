-- Migration: 20260821140000_phase12_bus_type_license_category
-- Purpose: Phase 12 dispatch safety gate — minimum commercial license class
--          per BusType (CI ordering B < C < D < E). Nullable: existing types
--          keep no requirement until operators set one. No data loss.

ALTER TABLE "bus_type"
    ADD COLUMN IF NOT EXISTS "requiredLicenseCategory" "LicenseCategory";

DO $$
BEGIN
    RAISE NOTICE 'Phase 12 Migration Complete: bus_type.requiredLicenseCategory added.';
END $$;
