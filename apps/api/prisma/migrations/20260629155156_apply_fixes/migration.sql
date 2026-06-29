/*
  Warnings:

  - You are about to drop the column `verifiedBy` on the `bank_account` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `company` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `company_document` table. All the data in the column will be lost.
  - The `operatingHours` column on the `company_location` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "bank_account_accountNumber_key";

-- AlterTable
ALTER TABLE "bank_account" DROP COLUMN "verifiedBy",
ADD COLUMN     "verifiedById" TEXT;

-- AlterTable
ALTER TABLE "company" DROP COLUMN "verifiedBy",
ADD COLUMN     "verifiedById" TEXT;

-- AlterTable
ALTER TABLE "company_document" DROP COLUMN "reviewedBy",
ADD COLUMN     "reviewedById" TEXT;

-- AlterTable
ALTER TABLE "company_location" DROP COLUMN "operatingHours",
ADD COLUMN     "operatingHours" JSONB;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_document" ADD CONSTRAINT "company_document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
