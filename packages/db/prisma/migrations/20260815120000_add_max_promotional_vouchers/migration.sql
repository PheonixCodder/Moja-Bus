-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "maxPromotionalVouchersPerUser" INTEGER NOT NULL DEFAULT 3;
