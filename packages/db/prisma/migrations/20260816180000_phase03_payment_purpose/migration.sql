-- Phase 03: ExternalPayment.purpose (CHECKOUT | TOP_UP)

DO $$ BEGIN
  CREATE TYPE "PaymentPurpose" AS ENUM ('CHECKOUT', 'TOP_UP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "payment"
  ADD COLUMN IF NOT EXISTS "purpose" "PaymentPurpose" NOT NULL DEFAULT 'CHECKOUT';

-- Backfill top-ups from historical metadata
UPDATE "payment"
SET "purpose" = 'TOP_UP'
WHERE "holdGroupId" IS NULL
  AND (
    metadata->>'isTopUp' = 'true'
    OR (metadata->'isTopUp')::text = 'true'
  );

CREATE INDEX IF NOT EXISTS "payment_purpose_idx" ON "payment"("purpose");
