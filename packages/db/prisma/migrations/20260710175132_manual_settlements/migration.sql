/*
  Warnings:

  - You are about to drop the column `paystackSubaccountCode` on the `bank_account` table. All the data in the column will be lost.
  - You are about to drop the column `paystackSubaccountCode` on the `company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bank_account" ADD COLUMN     "paystackTransferRecipientCode" TEXT;

-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "clearedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "paystackTransferRecipientCode" TEXT;

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN     "minWithdrawalAmount" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "withdrawalFrequencyHours" INTEGER NOT NULL DEFAULT 24;
