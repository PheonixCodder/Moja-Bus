-- Phase 00: cancel/refund money safety
-- REFUND_PENDING booking status, honest refund statuses, optional paymentId,
-- drop FinancialTransaction unique(externalPaymentId, type) for multi-seat refunds.

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';

ALTER TYPE "RefundRecordStatus" ADD VALUE IF NOT EXISTS 'PENDING_FULFILMENT';

-- Refund: optional payment (wallet/zero-cash), booking linkage, request idempotency
ALTER TABLE "refund" ALTER COLUMN "paymentId" DROP NOT NULL;

ALTER TABLE "refund" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "refund" ADD COLUMN IF NOT EXISTS "requestIdempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "refund_requestIdempotencyKey_key"
  ON "refund"("requestIdempotencyKey");

CREATE UNIQUE INDEX IF NOT EXISTS "refund_paystackRefundId_key"
  ON "refund"("paystackRefundId");

CREATE INDEX IF NOT EXISTS "refund_bookingId_idx" ON "refund"("bookingId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refund_bookingId_fkey'
  ) THEN
    ALTER TABLE "refund"
      ADD CONSTRAINT "refund_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "booking"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Drop ON DELETE CASCADE payment FK if present; recreate as SET NULL (optional payment)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refund_paymentId_fkey'
  ) THEN
    ALTER TABLE "refund" DROP CONSTRAINT "refund_paymentId_fkey";
  END IF;
END $$;

ALTER TABLE "refund"
  ADD CONSTRAINT "refund_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Multi-seat refunds: allow multiple REFUND txs per ExternalPayment
DROP INDEX IF EXISTS "financial_transaction_externalPaymentId_type_key";

ALTER TABLE "financial_transaction"
  ADD COLUMN IF NOT EXISTS "businessIdempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "financial_transaction_businessIdempotencyKey_key"
  ON "financial_transaction"("businessIdempotencyKey");

CREATE INDEX IF NOT EXISTS "financial_transaction_externalPaymentId_type_idx"
  ON "financial_transaction"("externalPaymentId", "type");
