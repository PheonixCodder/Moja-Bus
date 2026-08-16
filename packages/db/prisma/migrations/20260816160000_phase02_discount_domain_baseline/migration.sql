-- Phase 02: baseline discount / referral / voucher / credit domain (D4=A, P0-8)
-- Idempotent: safe on fresh migrate and on envs that previously used prisma db push.

-- Enums

DO $$ BEGIN
  CREATE TYPE "CampaignOwnerType" AS ENUM ('PLATFORM', 'OPERATOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignFundingType" AS ENUM ('PLATFORM', 'OPERATOR', 'HYBRID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXHAUSTED', 'EXPIRED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BenefitType" AS ENUM ('PERCENT_OFF', 'FIXED_AMOUNT_OFF', 'FREE_SEAT', 'WALLET_CREDIT_GRANT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InstrumentType" AS ENUM ('COUPON_CODE', 'AUTO_PROMO', 'MONETARY_VOUCHER', 'CREDIT_LOT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VoucherSource" AS ENUM ('CANCELLATION', 'MODIFICATION_DIFFERENCE', 'MARKETING_GRANT', 'GOODWILL', 'REFERRAL_REWARD', 'ADMIN_MANUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'PARTIALLY_REDEEMED', 'REDEEMED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CreditLotSource" AS ENUM ('REFERRAL', 'LOYALTY', 'ADMIN', 'PROMO_GRANT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CreditLotStatus" AS ENUM ('PENDING', 'ACTIVE', 'PARTIALLY_REDEEMED', 'REDEEMED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralEdgeStatus" AS ENUM ('ATTRIBUTED', 'QUALIFIED', 'REWARDED', 'REJECTED_FRAUD', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DiscountApplyTarget" AS ENUM ('TICKET_ONLY', 'ENTIRE_CHARGE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DiscountRedemptionStatus" AS ENUM ('RESERVED', 'FINALIZED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignOptInStatus" AS ENUM ('INVITED', 'OPTED_IN', 'OPTED_OUT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- Tables
CREATE TABLE IF NOT EXISTS "discount_campaign" (
    "id" TEXT NOT NULL,
    "ownerType" "CampaignOwnerType" NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "fundingType" "CampaignFundingType" NOT NULL DEFAULT 'OPERATOR',
    "platformShareBps" INTEGER NOT NULL DEFAULT 0,
    "operatorShareBps" INTEGER NOT NULL DEFAULT 10000,
    "benefitType" "BenefitType" NOT NULL,
    "percentBps" INTEGER,
    "amountXOF" INTEGER,
    "freeSeatCount" INTEGER,
    "applyTarget" "DiscountApplyTarget" NOT NULL DEFAULT 'TICKET_ONLY',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "minSubtotalXOF" INTEGER,
    "minSeatCount" INTEGER,
    "maxSeatCount" INTEGER,
    "firstBookingOnly" BOOLEAN NOT NULL DEFAULT false,
    "newUserOnly" BOOLEAN NOT NULL DEFAULT false,
    "maxRedemptionsGlobal" INTEGER,
    "maxRedemptionsPerUser" INTEGER,
    "maxRedemptionsPerPhone" INTEGER,
    "maxDiscountPerBookingXOF" INTEGER,
    "budgetXOF" INTEGER,
    "budgetConsumedXOF" INTEGER NOT NULL DEFAULT 0,
    "budgetReservedXOF" INTEGER NOT NULL DEFAULT 0,
    "stackGroup" TEXT NOT NULL DEFAULT 'PROMO',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isAutoApply" BOOLEAN NOT NULL DEFAULT false,
    "allowCombineWithCredit" BOOLEAN NOT NULL DEFAULT true,
    "requireOperatorOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "pausedByAdminAt" TIMESTAMP(3),
    "pauseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "discount_campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "coupon_code" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxRedemptions" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "assignedUserId" TEXT,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "coupon_code_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "monetary_voucher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT,
    "source" "VoucherSource" NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "originalAmountXOF" INTEGER NOT NULL,
    "remainingAmountXOF" INTEGER NOT NULL,
    "reservedAmountXOF" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "expiresAt" TIMESTAMP(3),
    "expiresOnFirstCompletedBooking" BOOLEAN NOT NULL DEFAULT false,
    "scheduleId" TEXT,
    "companyId" TEXT,
    "sourceHoldGroupId" TEXT,
    "sourceBookingId" TEXT,
    "issuedByAdminId" TEXT,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "monetary_voucher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "referral_program" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "refereeCouponCampaignId" TEXT,
    "referrerCreditAmountXOF" INTEGER NOT NULL DEFAULT 0,
    "recurringCreditAmountXOF" INTEGER NOT NULL DEFAULT 0,
    "recurringMaxBookings" INTEGER NOT NULL DEFAULT 3,
    "recurringWindowDays" INTEGER NOT NULL DEFAULT 180,
    "requirePaidConfirmedBooking" BOOLEAN NOT NULL DEFAULT true,
    "rewardDelayHours" INTEGER NOT NULL DEFAULT 48,
    "selfReferralBlock" BOOLEAN NOT NULL DEFAULT true,
    "sameDeviceBlock" BOOLEAN NOT NULL DEFAULT true,
    "samePhoneBlock" BOOLEAN NOT NULL DEFAULT true,
    "maxQualificationsPerReferrerPerDay" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referral_program_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "referral_code" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_code_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "referral_edge" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "refereeUserId" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "status" "ReferralEdgeStatus" NOT NULL DEFAULT 'ATTRIBUTED',
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualifiedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "firstHoldGroupId" TEXT,
    "deviceHash" TEXT,
    "ipHash" TEXT,
    "fraudFlags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referral_edge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "credit_lot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "CreditLotSource" NOT NULL,
    "status" "CreditLotStatus" NOT NULL DEFAULT 'ACTIVE',
    "amountXOF" INTEGER NOT NULL,
    "remainingXOF" INTEGER NOT NULL,
    "reservedXOF" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "availableAt" TIMESTAMP(3),
    "referralEdgeId" TEXT,
    "sourceBookingId" TEXT,
    "sourceHoldGroupId" TEXT,
    "grantIdempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "credit_lot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "discount_redemption" (
    "id" TEXT NOT NULL,
    "holdGroupId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "DiscountRedemptionStatus" NOT NULL DEFAULT 'RESERVED',
    "instrumentType" "InstrumentType" NOT NULL,
    "campaignId" TEXT,
    "couponCodeId" TEXT,
    "voucherId" TEXT,
    "creditLotId" TEXT,
    "ticketDiscountXOF" INTEGER NOT NULL DEFAULT 0,
    "feeDiscountXOF" INTEGER NOT NULL DEFAULT 0,
    "creditAppliedXOF" INTEGER NOT NULL DEFAULT 0,
    "fundingType" "CampaignFundingType",
    "platformFundedXOF" INTEGER NOT NULL DEFAULT 0,
    "operatorFundedXOF" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT,
    "deviceHash" TEXT,
    "ipHash" TEXT,
    "snapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "discount_redemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_route_scope" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    CONSTRAINT "campaign_route_scope_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_trip_scope" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "campaign_trip_scope_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_schedule_scope" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    CONSTRAINT "campaign_schedule_scope_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_company_opt_in" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "CampaignOptInStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaign_company_opt_in_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "promo_abuse_event" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "campaignId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_abuse_event_pkey" PRIMARY KEY ("id")
);

-- Pricing snapshot discount columns (legacy rows keep null pre* fields)
ALTER TABLE "pricing_snapshot" ADD COLUMN IF NOT EXISTS "ticketDiscountXOF" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pricing_snapshot" ADD COLUMN IF NOT EXISTS "feeDiscountXOF" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pricing_snapshot" ADD COLUMN IF NOT EXISTS "creditAppliedXOF" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pricing_snapshot" ADD COLUMN IF NOT EXISTS "preDiscountSubtotalXOF" INTEGER;
ALTER TABLE "pricing_snapshot" ADD COLUMN IF NOT EXISTS "postDiscountSubtotalXOF" INTEGER;
ALTER TABLE "pricing_snapshot" ADD COLUMN IF NOT EXISTS "platformPromoFundedXOF" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pricing_snapshot" ADD COLUMN IF NOT EXISTS "operatorPromoFundedXOF" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pricing_snapshot" ADD COLUMN IF NOT EXISTS "discountBreakdownJson" JSONB;

-- Unique indexes / keys
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_code_code_key" ON "coupon_code"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "monetary_voucher_code_key" ON "monetary_voucher"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_userId_key" ON "referral_code"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_code_key" ON "referral_code"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_edge_refereeUserId_key" ON "referral_edge"("refereeUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "credit_lot_grantIdempotencyKey_key" ON "credit_lot"("grantIdempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_route_scope_campaignId_routeId_key" ON "campaign_route_scope"("campaignId", "routeId");
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_trip_scope_campaignId_tripId_key" ON "campaign_trip_scope"("campaignId", "tripId");
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_schedule_scope_campaignId_scheduleId_key" ON "campaign_schedule_scope"("campaignId", "scheduleId");
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_company_opt_in_campaignId_companyId_key" ON "campaign_company_opt_in"("campaignId", "companyId");

-- Secondary indexes
CREATE INDEX IF NOT EXISTS "discount_campaign_status_startsAt_endsAt_idx" ON "discount_campaign"("status", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "discount_campaign_companyId_idx" ON "discount_campaign"("companyId");
CREATE INDEX IF NOT EXISTS "discount_campaign_stackGroup_idx" ON "discount_campaign"("stackGroup");
CREATE INDEX IF NOT EXISTS "discount_campaign_isAutoApply_status_idx" ON "discount_campaign"("isAutoApply", "status");
CREATE INDEX IF NOT EXISTS "discount_campaign_ownerType_status_idx" ON "discount_campaign"("ownerType", "status");
CREATE INDEX IF NOT EXISTS "coupon_code_campaignId_idx" ON "coupon_code"("campaignId");
CREATE INDEX IF NOT EXISTS "coupon_code_assignedUserId_idx" ON "coupon_code"("assignedUserId");
CREATE INDEX IF NOT EXISTS "coupon_code_isActive_idx" ON "coupon_code"("isActive");
CREATE INDEX IF NOT EXISTS "monetary_voucher_userId_status_idx" ON "monetary_voucher"("userId", "status");
CREATE INDEX IF NOT EXISTS "monetary_voucher_expiresAt_idx" ON "monetary_voucher"("expiresAt");
CREATE INDEX IF NOT EXISTS "monetary_voucher_campaignId_idx" ON "monetary_voucher"("campaignId");
CREATE INDEX IF NOT EXISTS "monetary_voucher_sourceHoldGroupId_idx" ON "monetary_voucher"("sourceHoldGroupId");
CREATE INDEX IF NOT EXISTS "monetary_voucher_sourceBookingId_idx" ON "monetary_voucher"("sourceBookingId");
CREATE INDEX IF NOT EXISTS "monetary_voucher_scheduleId_idx" ON "monetary_voucher"("scheduleId");
CREATE INDEX IF NOT EXISTS "monetary_voucher_companyId_idx" ON "monetary_voucher"("companyId");
CREATE INDEX IF NOT EXISTS "credit_lot_userId_status_idx" ON "credit_lot"("userId", "status");
CREATE INDEX IF NOT EXISTS "credit_lot_expiresAt_idx" ON "credit_lot"("expiresAt");
CREATE INDEX IF NOT EXISTS "credit_lot_referralEdgeId_idx" ON "credit_lot"("referralEdgeId");
CREATE INDEX IF NOT EXISTS "credit_lot_status_availableAt_idx" ON "credit_lot"("status", "availableAt");
CREATE INDEX IF NOT EXISTS "referral_edge_referrerUserId_status_idx" ON "referral_edge"("referrerUserId", "status");
CREATE INDEX IF NOT EXISTS "referral_edge_referralCodeId_idx" ON "referral_edge"("referralCodeId");
CREATE INDEX IF NOT EXISTS "referral_edge_status_idx" ON "referral_edge"("status");
CREATE INDEX IF NOT EXISTS "discount_redemption_holdGroupId_idx" ON "discount_redemption"("holdGroupId");
CREATE INDEX IF NOT EXISTS "discount_redemption_userId_idx" ON "discount_redemption"("userId");
CREATE INDEX IF NOT EXISTS "discount_redemption_campaignId_idx" ON "discount_redemption"("campaignId");
CREATE INDEX IF NOT EXISTS "discount_redemption_status_idx" ON "discount_redemption"("status");
CREATE INDEX IF NOT EXISTS "discount_redemption_couponCodeId_idx" ON "discount_redemption"("couponCodeId");
CREATE INDEX IF NOT EXISTS "discount_redemption_voucherId_idx" ON "discount_redemption"("voucherId");
CREATE INDEX IF NOT EXISTS "campaign_route_scope_routeId_idx" ON "campaign_route_scope"("routeId");
CREATE INDEX IF NOT EXISTS "campaign_trip_scope_tripId_idx" ON "campaign_trip_scope"("tripId");
CREATE INDEX IF NOT EXISTS "campaign_schedule_scope_scheduleId_idx" ON "campaign_schedule_scope"("scheduleId");
CREATE INDEX IF NOT EXISTS "campaign_company_opt_in_companyId_idx" ON "campaign_company_opt_in"("companyId");
CREATE INDEX IF NOT EXISTS "promo_abuse_event_eventType_createdAt_idx" ON "promo_abuse_event"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "promo_abuse_event_userId_idx" ON "promo_abuse_event"("userId");


-- Foreign keys (idempotent)

DO $$ BEGIN
  ALTER TABLE "discount_campaign" ADD CONSTRAINT "discount_campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_campaign" ADD CONSTRAINT "discount_campaign_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "coupon_code" ADD CONSTRAINT "coupon_code_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "discount_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "coupon_code" ADD CONSTRAINT "coupon_code_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_sourceHoldGroupId_fkey" FOREIGN KEY ("sourceHoldGroupId") REFERENCES "hold_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_sourceBookingId_fkey" FOREIGN KEY ("sourceBookingId") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_issuedByAdminId_fkey" FOREIGN KEY ("issuedByAdminId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "monetary_voucher" ADD CONSTRAINT "monetary_voucher_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "discount_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "referral_program" ADD CONSTRAINT "referral_program_refereeCouponCampaignId_fkey" FOREIGN KEY ("refereeCouponCampaignId") REFERENCES "discount_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "referral_code" ADD CONSTRAINT "referral_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "referral_edge" ADD CONSTRAINT "referral_edge_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "referral_edge" ADD CONSTRAINT "referral_edge_refereeUserId_fkey" FOREIGN KEY ("refereeUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "referral_edge" ADD CONSTRAINT "referral_edge_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "referral_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "credit_lot" ADD CONSTRAINT "credit_lot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "credit_lot" ADD CONSTRAINT "credit_lot_referralEdgeId_fkey" FOREIGN KEY ("referralEdgeId") REFERENCES "referral_edge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_holdGroupId_fkey" FOREIGN KEY ("holdGroupId") REFERENCES "hold_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "discount_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_couponCodeId_fkey" FOREIGN KEY ("couponCodeId") REFERENCES "coupon_code"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "monetary_voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_creditLotId_fkey" FOREIGN KEY ("creditLotId") REFERENCES "credit_lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_route_scope" ADD CONSTRAINT "campaign_route_scope_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "discount_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_route_scope" ADD CONSTRAINT "campaign_route_scope_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_trip_scope" ADD CONSTRAINT "campaign_trip_scope_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "discount_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_trip_scope" ADD CONSTRAINT "campaign_trip_scope_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_schedule_scope" ADD CONSTRAINT "campaign_schedule_scope_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "discount_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_schedule_scope" ADD CONSTRAINT "campaign_schedule_scope_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_company_opt_in" ADD CONSTRAINT "campaign_company_opt_in_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "discount_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_company_opt_in" ADD CONSTRAINT "campaign_company_opt_in_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- Seed default referral program row (idempotent)
INSERT INTO "referral_program" ("id", "isActive", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
