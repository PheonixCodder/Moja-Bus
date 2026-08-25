-- Migration: 20260821130000_phase11_driver_employment_offer
-- Purpose: Structured employment Offer Board (Phase 11).
--          - DriverOfferStatus + DriverOfferEventType enums
--          - driver_employment_offer table (current negotiation state)
--          - driver_offer_event table (append-only audit log)
--          - DB-level guarantee: one ACTIVE offer per (company, driver) pair
--            via partial unique index.
--          No data migration needed — no legacy offers exist.

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "DriverOfferStatus" AS ENUM (
        'PENDING', 'COUNTERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "DriverOfferEventType" AS ENUM (
        'SENT', 'VIEWED',
        'COUNTERED_BY_DRIVER', 'COUNTERED_BY_OPERATOR',
        'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED',
        'AFFILIATION_CREATED', 'EXCLUSIVE_ENDED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "driver_employment_offer" (
    "id"                TEXT        NOT NULL,
    "companyId"         TEXT        NOT NULL,
    "driverProfileId"   TEXT        NOT NULL,

    "employmentType"    "DriverEmploymentType" NOT NULL DEFAULT 'EXCLUSIVE_INTERCITY',

    -- Immutable original proposal
    "initialSalaryCFA"  INTEGER     NOT NULL,
    "initialStartDate"  TIMESTAMP(3),
    "initialNote"       TEXT,

    -- Current effective terms (latest negotiation round)
    "currentSalaryCFA"  INTEGER     NOT NULL,
    "currentStartDate"  TIMESTAMP(3),
    "currentNote"       TEXT,

    "status"            "DriverOfferStatus" NOT NULL DEFAULT 'PENDING',

    -- Rolling window — refreshed +7 days on every counter
    "expiresAt"         TIMESTAMP(3) NOT NULL,

    -- Trust signals
    "firstViewedAt"     TIMESTAMP(3),
    "respondedAt"       TIMESTAMP(3),
    "resolvedAt"        TIMESTAMP(3),

    "createdById"       TEXT,

    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_employment_offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "driver_offer_event" (
    "id"           TEXT     NOT NULL,
    "offerId"      TEXT     NOT NULL,
    "eventType"    "DriverOfferEventType" NOT NULL,
    -- COMPANY | DRIVER | SYSTEM
    "actorType"    TEXT     NOT NULL,
    "actorUserId"  TEXT,

    -- Terms snapshot at the moment of this event
    "salaryCFA"    INTEGER,
    "startDate"    TIMESTAMP(3),
    "note"         TEXT,

    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_offer_event_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- 3. FOREIGN KEYS
-- ============================================================================

ALTER TABLE "driver_employment_offer"
    ADD CONSTRAINT "driver_employment_offer_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "driver_employment_offer"
    ADD CONSTRAINT "driver_employment_offer_driverProfileId_fkey"
    FOREIGN KEY ("driverProfileId") REFERENCES "driver_profile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "driver_offer_event"
    ADD CONSTRAINT "driver_offer_event_offerId_fkey"
    FOREIGN KEY ("offerId") REFERENCES "driver_employment_offer"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS "driver_employment_offer_companyId_status_idx"
    ON "driver_employment_offer"("companyId", "status");

CREATE INDEX IF NOT EXISTS "driver_employment_offer_driverProfileId_status_idx"
    ON "driver_employment_offer"("driverProfileId", "status");

CREATE INDEX IF NOT EXISTS "driver_employment_offer_expiresAt_status_idx"
    ON "driver_employment_offer"("expiresAt", "status");

CREATE INDEX IF NOT EXISTS "driver_offer_event_offerId_createdAt_idx"
    ON "driver_offer_event"("offerId", "createdAt");

-- ============================================================================
-- 5. INTEGRITY — One ACTIVE offer per (company, driver) pair
--
--    Partial unique index: enforced at the database level even under race
--    conditions. Application-level checks remain for friendly errors; this
--    index is the authoritative backstop.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "driver_employment_offer_active_pair_key"
    ON "driver_employment_offer"("companyId", "driverProfileId")
    WHERE "status" IN ('PENDING', 'COUNTERED');

-- ============================================================================
-- 6. VERIFY
-- ============================================================================

DO $$
DECLARE
    v_offers INTEGER;
    v_events INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_offers FROM "driver_employment_offer";
    SELECT COUNT(*) INTO v_events FROM "driver_offer_event";
    RAISE NOTICE 'Phase 11 Migration Complete:';
    RAISE NOTICE '  driver_employment_offer rows: %', v_offers;
    RAISE NOTICE '  driver_offer_event rows:      %', v_events;
END $$;
