-- Add releasedAt claim guard to WalletReservation (release-reservations cron, F-34).
-- Nullable timestamp, set when the reserved balance is released back to
-- availableBalance. Enables exactly-once release across concurrent cron runs
-- and crash recovery for reservations left EXPIRED-but-not-released.
-- Additive, nullable column — safe to apply on existing databases.

-- AlterTable
ALTER TABLE "wallet_reservation" ADD COLUMN "releasedAt" TIMESTAMP(3);
