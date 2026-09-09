-- Phase B1 — Booth App: Counter Sales Foundation
-- Migration: 20260907000000_phase_b1_booth_role_and_sale
--
-- Changes:
--   1. Add BOOTH value to "StaffRole" enum
--   2. Create "BoothPaymentMethod" enum (CASH | PAYSTACK_LINK)
--   3. Create "booth_sale" table with all columns and indexes
--
-- Per MIGRATIONS.md Rule 5: enum value addition (step 1-2) and table creation
-- (step 3) are safe in a single migration because step 3 only creates a new
-- table — no existing rows are migrated to use the new enum values.
--
-- Per MIGRATIONS.md Rule 4: "BOOTH" is only added; no existing enum label is removed.
-- Per MIGRATIONS.md Rule 6: run via DATABASE_URL_DIRECT, never via pooler.

-- ── 1. Extend StaffRole enum ─────────────────────────────────────────────────
-- PostgreSQL requires ALTER TYPE ... ADD VALUE outside a transaction block
-- (or at the very end of one). Prisma migrations run each statement in
-- sequence; ADD VALUE is safe here because no subsequent statement in THIS
-- migration reads or writes the new label.

ALTER TYPE "StaffRole" ADD VALUE 'BOOTH';

-- ── 2. Create BoothPaymentMethod enum ────────────────────────────────────────

CREATE TYPE "BoothPaymentMethod" AS ENUM ('CASH', 'PAYSTACK_LINK');

-- ── 3. Create booth_sale table ────────────────────────────────────────────────

CREATE TABLE "booth_sale" (
    -- Primary key
    "id"                      TEXT NOT NULL,

    -- Booking link (1:1 — every booth sale has exactly one booking)
    "bookingId"               TEXT NOT NULL,

    -- Company scoping (always set)
    "companyId"               TEXT NOT NULL,

    -- Terminal where the sale was made
    "terminalId"              TEXT NOT NULL,

    -- Staff member (Operator.id) who processed the sale
    "staffId"                 TEXT NOT NULL,

    -- Payment tracking
    "paymentMethod"           "BoothPaymentMethod" NOT NULL,
    "cashAmountXOF"           INTEGER,          -- Non-null iff paymentMethod = CASH
    "paystackRef"             TEXT,             -- Non-null iff paymentMethod = PAYSTACK_LINK

    -- Operational flags
    "wasOffline"              BOOLEAN NOT NULL DEFAULT false,
    "walkedUpPassenger"       BOOLEAN NOT NULL DEFAULT false,
    "passengerAccountCreated" BOOLEAN NOT NULL DEFAULT false,

    -- Urban overbooking conflict (set only by server during offline-queue sync)
    "hasConflict"             BOOLEAN NOT NULL DEFAULT false,
    "conflictDetails"         TEXT,

    -- Timestamps
    "confirmedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booth_sale_pkey" PRIMARY KEY ("id")
);

-- ── Unique constraint: 1:1 with Booking ──────────────────────────────────────
CREATE UNIQUE INDEX "booth_sale_bookingId_key" ON "booth_sale"("bookingId");

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- companyId: company-scoped listing and reconciliation reports
CREATE INDEX "booth_sale_companyId_idx" ON "booth_sale"("companyId");

-- terminalId: terminal-level daily sales report
CREATE INDEX "booth_sale_terminalId_idx" ON "booth_sale"("terminalId");

-- staffId: per-agent reconciliation
CREATE INDEX "booth_sale_staffId_idx" ON "booth_sale"("staffId");

-- confirmedAt: date-range queries for daily/weekly reports
CREATE INDEX "booth_sale_confirmedAt_idx" ON "booth_sale"("confirmedAt");

-- wasOffline: offline-sale audit queries
CREATE INDEX "booth_sale_wasOffline_idx" ON "booth_sale"("wasOffline");

-- hasConflict: ERP dashboard — operator queries for unresolved overbooking conflicts
CREATE INDEX "booth_sale_hasConflict_idx" ON "booth_sale"("hasConflict");

-- ── Foreign key constraints ───────────────────────────────────────────────────

-- Booking (CASCADE delete — if a booking is hard-deleted the sale record goes with it)
ALTER TABLE "booth_sale"
    ADD CONSTRAINT "booth_sale_bookingId_fkey"
    FOREIGN KEY ("bookingId")
    REFERENCES "booking"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CompanyLocation (RESTRICT — do not allow deleting a terminal that has sales on record)
ALTER TABLE "booth_sale"
    ADD CONSTRAINT "booth_sale_terminalId_fkey"
    FOREIGN KEY ("terminalId")
    REFERENCES "company_location"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Operator (RESTRICT — do not allow removing a staff record that has booth sales)
ALTER TABLE "booth_sale"
    ADD CONSTRAINT "booth_sale_staffId_fkey"
    FOREIGN KEY ("staffId")
    REFERENCES "operator"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
