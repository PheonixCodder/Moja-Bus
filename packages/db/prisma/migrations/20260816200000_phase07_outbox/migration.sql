-- Phase 07: transactional notification outbox (D8 / P2-2)

DO $$ BEGIN
  CREATE TYPE "OutboxMessageStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SENT',
    'FAILED',
    'DEAD'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "outbox_message" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxMessageStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 8,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "outbox_message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "outbox_message_idempotencyKey_key"
  ON "outbox_message"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "outbox_message_status_nextAttemptAt_idx"
  ON "outbox_message"("status", "nextAttemptAt");

CREATE INDEX IF NOT EXISTS "outbox_message_type_createdAt_idx"
  ON "outbox_message"("type", "createdAt");
