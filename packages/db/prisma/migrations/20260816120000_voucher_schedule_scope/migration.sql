-- Add schedule/company scope columns to monetary vouchers when the discount
-- domain already exists. Some deployed databases had not received the
-- discount-domain tables before this migration, so this migration must be a
-- no-op in that case; the later Phase 02 baseline creates the table/columns.

DO $$
BEGIN
  IF to_regclass('public."monetary_voucher"') IS NOT NULL THEN
    ALTER TABLE "monetary_voucher" ADD COLUMN IF NOT EXISTS "scheduleId" TEXT;
    ALTER TABLE "monetary_voucher" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

    IF to_regclass('public."schedule"') IS NOT NULL THEN
      BEGIN
        ALTER TABLE "monetary_voucher"
          ADD CONSTRAINT "monetary_voucher_scheduleId_fkey"
          FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END;
    END IF;

    IF to_regclass('public."company"') IS NOT NULL THEN
      BEGIN
        ALTER TABLE "monetary_voucher"
          ADD CONSTRAINT "monetary_voucher_companyId_fkey"
          FOREIGN KEY ("companyId") REFERENCES "company"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END;
    END IF;

    IF to_regclass('public."booking"') IS NOT NULL
      AND to_regclass('public."trip"') IS NOT NULL THEN
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
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS "monetary_voucher_scheduleId_idx" ON "monetary_voucher"("scheduleId")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "monetary_voucher_companyId_idx" ON "monetary_voucher"("companyId")';
  END IF;
END $$;
