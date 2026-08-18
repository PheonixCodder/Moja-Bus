-- Migration: 20260818000000_remove_legacy_monetary_vouchers
-- Purpose: Complete purge of monetary_voucher table, relations, and settings.

-- 1. Drop foreign key constraint and column on discount_redemption
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discount_redemption_voucherId_fkey'
  ) THEN
    ALTER TABLE "discount_redemption" DROP CONSTRAINT "discount_redemption_voucherId_fkey";
  END IF;
END $$;

DROP INDEX IF EXISTS "discount_redemption_voucherId_idx";

ALTER TABLE "discount_redemption" DROP COLUMN IF EXISTS "voucherId";

-- 2. Drop the monetary_voucher table and its associated indexes and constraints
DROP TABLE IF EXISTS "monetary_voucher" CASCADE;

-- 3. Drop maxPromotionalVouchersPerUser column from platform_settings
ALTER TABLE "platform_settings" DROP COLUMN IF EXISTS "maxPromotionalVouchersPerUser";

-- 4. Drop obsolete enum types
DROP TYPE IF EXISTS "VoucherSource";
DROP TYPE IF EXISTS "VoucherStatus";
