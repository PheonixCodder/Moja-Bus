-- Migration: 20260818000000_remove_legacy_monetary_vouchers
-- Purpose: Add rebooking columns, expand credit lot sources, migrate monetary_voucher data, and purge legacy tables.

-- 1. Enum expansion: CreditLotSource
DO $$ BEGIN
  ALTER TYPE "CreditLotSource" ADD VALUE IF NOT EXISTS 'GOODWILL';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CreditLotSource" ADD VALUE IF NOT EXISTS 'MARKETING_GRANT';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CreditLotSource" ADD VALUE IF NOT EXISTS 'ADMIN_MANUAL';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Expand credit_lot table columns
ALTER TABLE "credit_lot" ADD COLUMN IF NOT EXISTS "sourceBookingId" TEXT;
ALTER TABLE "credit_lot" ADD COLUMN IF NOT EXISTS "sourceHoldGroupId" TEXT;
ALTER TABLE "credit_lot" ADD COLUMN IF NOT EXISTS "grantIdempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "credit_lot_grantIdempotencyKey_key" ON "credit_lot"("grantIdempotencyKey");

-- 3. Add Rebooking columns to booking table
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "rebookedFromBookingId" TEXT;
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "rebookReason" TEXT;
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "rebookedAt" TIMESTAMP(3);
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "rebookedByStaffId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "booking_rebookedFromBookingId_key" ON "booking"("rebookedFromBookingId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_rebookedFromBookingId_fkey'
  ) THEN
    ALTER TABLE "booking" 
      ADD CONSTRAINT "booking_rebookedFromBookingId_fkey" 
      FOREIGN KEY ("rebookedFromBookingId") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_rebookedByStaffId_fkey'
  ) THEN
    ALTER TABLE "booking" 
      ADD CONSTRAINT "booking_rebookedByStaffId_fkey" 
      FOREIGN KEY ("rebookedByStaffId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. Data Migration: If monetary_voucher table exists, migrate all active/valid vouchers into credit_lot
DO $$
BEGIN
  IF to_regclass('public."monetary_voucher"') IS NOT NULL THEN
    -- Insert migrated credit lots from monetary_voucher if not already migrated
    INSERT INTO "credit_lot" (
      "id",
      "userId",
      "source",
      "status",
      "amountXOF",
      "remainingXOF",
      "reservedXOF",
      "expiresAt",
      "sourceBookingId",
      "sourceHoldGroupId",
      "grantIdempotencyKey",
      "createdAt",
      "updatedAt"
    )
    SELECT
      'lot_migrated_' || mv."id",
      mv."userId",
      CASE 
        WHEN mv."source"::text = 'REFERRAL_REWARD' THEN 'REFERRAL'::"CreditLotSource"
        WHEN mv."source"::text = 'MARKETING_GRANT' THEN 'MARKETING_GRANT'::"CreditLotSource"
        WHEN mv."source"::text = 'ADMIN_MANUAL' THEN 'ADMIN_MANUAL'::"CreditLotSource"
        WHEN mv."source"::text = 'GOODWILL' THEN 'GOODWILL'::"CreditLotSource"
        ELSE 'GOODWILL'::"CreditLotSource" -- Cancellation and modification vouchers mapped to GOODWILL credit lots
      END,
      CASE
        WHEN mv."status"::text = 'PARTIALLY_REDEEMED' THEN 'PARTIALLY_REDEEMED'::"CreditLotStatus"
        WHEN mv."status"::text = 'REDEEMED' THEN 'REDEEMED'::"CreditLotStatus"
        WHEN mv."status"::text = 'EXPIRED' THEN 'EXPIRED'::"CreditLotStatus"
        WHEN mv."status"::text = 'REVOKED' OR mv."status"::text = 'CANCELLED' THEN 'REVOKED'::"CreditLotStatus"
        ELSE 'ACTIVE'::"CreditLotStatus"
      END,
      mv."originalAmountXOF",
      mv."remainingAmountXOF",
      mv."reservedAmountXOF",
      mv."expiresAt",
      mv."sourceBookingId",
      mv."sourceHoldGroupId",
      'migrated-voucher-' || mv."id",
      mv."createdAt",
      mv."updatedAt"
    FROM "monetary_voucher" mv
    ON CONFLICT ("grantIdempotencyKey") DO NOTHING;

    -- Update discount_redemption: link creditLotId to migrated credit lot and update instrumentType
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'discount_redemption' AND column_name = 'voucherId'
    ) THEN
      UPDATE "discount_redemption" dr
      SET 
        "creditLotId" = 'lot_migrated_' || dr."voucherId",
        "instrumentType" = 'CREDIT_LOT'::"InstrumentType"
      WHERE dr."voucherId" IS NOT NULL AND dr."creditLotId" IS NULL;
    END IF;

    -- Re-class financial_account VOUCHER_LIABILITY to PROMO_LIABILITY_PLATFORM
    UPDATE "financial_account"
    SET "accountClass" = 'PROMO_LIABILITY_PLATFORM'
    WHERE "accountClass" = 'VOUCHER_LIABILITY';

  END IF;
END $$;

-- 5. Drop foreign key constraint and column on discount_redemption
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discount_redemption_voucherId_fkey'
  ) THEN
    ALTER TABLE "discount_redemption" DROP CONSTRAINT "discount_redemption_voucherId_fkey";
  END IF;
END $$;

DROP INDEX IF EXISTS "discount_redemption_voucherId_idx";

ALTER TABLE "discount_redemption" DROP COLUMN IF EXISTS "voucherId";

-- 6. Drop the monetary_voucher table and its associated indexes and constraints
DROP TABLE IF EXISTS "monetary_voucher" CASCADE;

-- 7. Drop maxPromotionalVouchersPerUser column from platform_settings
ALTER TABLE "platform_settings" DROP COLUMN IF EXISTS "maxPromotionalVouchersPerUser";

-- 8. Drop obsolete enum types
DROP TYPE IF EXISTS "VoucherSource";
DROP TYPE IF EXISTS "VoucherStatus";
