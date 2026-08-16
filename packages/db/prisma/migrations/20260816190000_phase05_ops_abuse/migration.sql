-- Phase 05: offline refund fulfilment + abuse review lifecycle

DO $$ BEGIN
  ALTER TYPE "RefundRecordStatus" ADD VALUE IF NOT EXISTS 'VOIDED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PromoAbuseReviewStatus" AS ENUM (
    'OPEN',
    'IN_REVIEW',
    'RESOLVED',
    'DISMISSED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "refund"
  ADD COLUMN IF NOT EXISTS "fulfilledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "fulfilledByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "voidedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "voidedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "fulfilmentNote" TEXT;

CREATE INDEX IF NOT EXISTS "refund_status_createdAt_idx"
  ON "refund"("status", "createdAt");

ALTER TABLE "promo_abuse_event"
  ADD COLUMN IF NOT EXISTS "reviewStatus" "PromoAbuseReviewStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS "assigneeUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "resolutionNote" TEXT,
  ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resolvedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "promo_abuse_event_reviewStatus_createdAt_idx"
  ON "promo_abuse_event"("reviewStatus", "createdAt");
