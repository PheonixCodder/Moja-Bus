-- AlterTable: Migrate financial balance columns from Int to BigInt
-- This prevents overflow on clearing and operator accounts.
-- PostgreSQL's ALTER COLUMN ... TYPE with USING cast is safe for existing data.

ALTER TABLE "financial_account"
  ALTER COLUMN "postedBalance" TYPE BIGINT USING "postedBalance"::BIGINT,
  ALTER COLUMN "reservedBalance" TYPE BIGINT USING "reservedBalance"::BIGINT,
  ALTER COLUMN "availableBalance" TYPE BIGINT USING "availableBalance"::BIGINT;

ALTER TABLE "financial_account_snapshot"
  ALTER COLUMN "postedBalance" TYPE BIGINT USING "postedBalance"::BIGINT,
  ALTER COLUMN "reservedBalance" TYPE BIGINT USING "reservedBalance"::BIGINT,
  ALTER COLUMN "availableBalance" TYPE BIGINT USING "availableBalance"::BIGINT;

ALTER TABLE "ledger_entry"
  ALTER COLUMN "amount" TYPE BIGINT USING "amount"::BIGINT;
