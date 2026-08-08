-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT "trip_scheduleId_fkey";

-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ALTER COLUMN "scheduleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
