-- Phase 02 — IAM, Operator Staff Governance & Terminal Scoping
-- Migration: 20260911120000_phase02_staff_terminal_scoping
--
-- Changes:
--   1. Add "assignedTerminalId" to "operator" table with FK to "company_location"
--   2. Add index on "operator"("assignedTerminalId")
--   3. Add "assignedTerminalId" to "staff_invitation" table with FK to "company_location"
--   4. Add index on "staff_invitation"("assignedTerminalId")
--
-- Per MIGRATIONS.md Rule 2: Every schema.prisma change ships with its migration.
-- Per MIGRATIONS.md Rule 3: Never edit an applied migration. Add a new one with zero-padded phase naming.
-- Per MIGRATIONS.md Rule 6: Run via direct connection (DATABASE_URL_DIRECT).

-- ── 1. Add assignedTerminalId to operator ─────────────────────────────────────
ALTER TABLE "operator"
    ADD COLUMN "assignedTerminalId" TEXT;

-- ── 2. Create index on operator.assignedTerminalId ────────────────────────────
CREATE INDEX "operator_assignedTerminalId_idx" ON "operator"("assignedTerminalId");

-- ── 3. Add foreign key constraint for operator.assignedTerminalId ─────────────
ALTER TABLE "operator"
    ADD CONSTRAINT "operator_assignedTerminalId_fkey"
    FOREIGN KEY ("assignedTerminalId")
    REFERENCES "company_location"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 4. Add assignedTerminalId to staff_invitation ─────────────────────────────
ALTER TABLE "staff_invitation"
    ADD COLUMN "assignedTerminalId" TEXT;

-- ── 5. Create index on staff_invitation.assignedTerminalId ────────────────────
CREATE INDEX "staff_invitation_assignedTerminalId_idx" ON "staff_invitation"("assignedTerminalId");

-- ── 6. Add foreign key constraint for staff_invitation.assignedTerminalId ──────
ALTER TABLE "staff_invitation"
    ADD CONSTRAINT "staff_invitation_assignedTerminalId_fkey"
    FOREIGN KEY ("assignedTerminalId")
    REFERENCES "company_location"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
