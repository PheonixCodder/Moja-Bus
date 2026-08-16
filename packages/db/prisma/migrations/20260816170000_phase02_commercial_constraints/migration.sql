-- Phase 02: commercial integrity constraints (P2-15, P2-16, safe CHECKs)
-- Voucher schedule/company Restrict; payment/refund hold Restrict; CHECKs as NOT VALID
-- (VALIDATE in maintenance window after cleaning dirty rows — see env cutover runbook).

-- ---------------------------------------------------------------------------
-- P2-16: backfill cancellation vouchers, then Restrict schedule/company deletes
-- ---------------------------------------------------------------------------
UPDATE "monetary_voucher" mv
SET
  "scheduleId" = t."scheduleId",
  "companyId" = t."companyId"
FROM "booking" b
JOIN "trip" t ON t.id = b."tripId"
WHERE mv."sourceBookingId" = b.id
  AND mv.source = 'CANCELLATION'
  AND (mv."scheduleId" IS NULL OR mv."companyId" IS NULL)
  AND t."scheduleId" IS NOT NULL
  AND t."companyId" IS NOT NULL;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monetary_voucher_scheduleId_fkey'
  ) THEN
    ALTER TABLE "monetary_voucher" DROP CONSTRAINT "monetary_voucher_scheduleId_fkey";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monetary_voucher_companyId_fkey'
  ) THEN
    ALTER TABLE "monetary_voucher" DROP CONSTRAINT "monetary_voucher_companyId_fkey";
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher"
    ADD CONSTRAINT "monetary_voucher_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher"
    ADD CONSTRAINT "monetary_voucher_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "company"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Cancellation vouchers must keep schedule + company (NOT VALID until cleaned)
DO $$ BEGIN
  ALTER TABLE "monetary_voucher"
    ADD CONSTRAINT "monetary_voucher_cancellation_scope_chk"
    CHECK (
      source <> 'CANCELLATION'
      OR ("scheduleId" IS NOT NULL AND "companyId" IS NOT NULL)
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- P2-15: prevent hard-delete of hold_group when payment/refund money rows exist
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_holdGroupId_fkey'
  ) THEN
    ALTER TABLE "payment" DROP CONSTRAINT "payment_holdGroupId_fkey";
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment"
    ADD CONSTRAINT "payment_holdGroupId_fkey"
    FOREIGN KEY ("holdGroupId") REFERENCES "hold_group"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refund_holdGroupId_fkey'
  ) THEN
    ALTER TABLE "refund" DROP CONSTRAINT "refund_holdGroupId_fkey";
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE "refund"
    ADD CONSTRAINT "refund_holdGroupId_fkey"
    FOREIGN KEY ("holdGroupId") REFERENCES "hold_group"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Safe amount / hybrid / boarding CHECKs (NOT VALID)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE "monetary_voucher"
    ADD CONSTRAINT "monetary_voucher_amounts_chk"
    CHECK (
      "originalAmountXOF" >= 0
      AND "remainingAmountXOF" >= 0
      AND "reservedAmountXOF" >= 0
      AND "remainingAmountXOF" <= "originalAmountXOF"
      AND "reservedAmountXOF" <= "remainingAmountXOF"
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "credit_lot"
    ADD CONSTRAINT "credit_lot_amounts_chk"
    CHECK (
      "amountXOF" >= 0
      AND "remainingXOF" >= 0
      AND "reservedXOF" >= 0
      AND "remainingXOF" <= "amountXOF"
      AND "reservedXOF" <= "remainingXOF"
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_campaign"
    ADD CONSTRAINT "discount_campaign_hybrid_bps_chk"
    CHECK (
      "fundingType" <> 'HYBRID'
      OR ("platformShareBps" + "operatorShareBps" = 10000)
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_campaign"
    ADD CONSTRAINT "discount_campaign_budget_nonneg_chk"
    CHECK (
      "budgetConsumedXOF" >= 0
      AND "budgetReservedXOF" >= 0
      AND ("budgetXOF" IS NULL OR "budgetXOF" >= 0)
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "pricing_snapshot"
    ADD CONSTRAINT "pricing_snapshot_discount_nonneg_chk"
    CHECK (
      "ticketDiscountXOF" >= 0
      AND "feeDiscountXOF" >= 0
      AND "creditAppliedXOF" >= 0
      AND "platformPromoFundedXOF" >= 0
      AND "operatorPromoFundedXOF" >= 0
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "booking"
    ADD CONSTRAINT "booking_stop_order_chk"
    CHECK ("boardingStopOrder" < "dropoffStopOrder") NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "refund"
    ADD CONSTRAINT "refund_amount_nonneg_chk"
    CHECK ("amountXOF" >= 0) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment"
    ADD CONSTRAINT "payment_amount_nonneg_chk"
    CHECK ("amountXOF" >= 0) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
