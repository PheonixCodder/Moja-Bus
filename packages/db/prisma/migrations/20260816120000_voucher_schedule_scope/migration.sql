-- AlterTable
ALTER TABLE "monetary_voucher" ADD COLUMN IF NOT EXISTS "scheduleId" TEXT;
ALTER TABLE "monetary_voucher" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "monetary_voucher_scheduleId_idx" ON "monetary_voucher"("scheduleId");
CREATE INDEX IF NOT EXISTS "monetary_voucher_companyId_idx" ON "monetary_voucher"("companyId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill cancellation vouchers from source booking trip when possible
UPDATE "monetary_voucher" mv
SET
  "scheduleId" = t."scheduleId",
  "companyId" = t."companyId"
FROM "booking" b
JOIN "trip" t ON t.id = b."tripId"
WHERE mv."sourceBookingId" = b.id
  AND mv.source = 'CANCELLATION'
  AND mv."scheduleId" IS NULL
  AND t."scheduleId" IS NOT NULL;
