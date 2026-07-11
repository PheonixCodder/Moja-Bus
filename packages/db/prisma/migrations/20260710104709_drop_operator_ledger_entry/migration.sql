/*
  Warnings:

  - You are about to drop the `operator_ledger_entry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "operator_ledger_entry" DROP CONSTRAINT "operator_ledger_entry_companyId_fkey";

-- DropForeignKey
ALTER TABLE "operator_ledger_entry" DROP CONSTRAINT "operator_ledger_entry_holdGroupId_fkey";

-- DropForeignKey
ALTER TABLE "operator_ledger_entry" DROP CONSTRAINT "operator_ledger_entry_paymentId_fkey";

-- DropTable
DROP TABLE "operator_ledger_entry";

-- DropEnum
DROP TYPE "LedgerEntryType";

-- DropEnum
DROP TYPE "LedgerSourceType";
