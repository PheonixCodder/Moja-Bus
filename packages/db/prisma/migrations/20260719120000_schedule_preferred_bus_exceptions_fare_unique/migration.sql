-- AlterTable
ALTER TABLE "schedule" ADD COLUMN "preferredBusId" TEXT;

-- AlterTable
ALTER TABLE "service_exception" ADD COLUMN "overrideDepartureTime" TEXT;

-- Backfill preferredBusId from newest future (or latest) trip per schedule
UPDATE "schedule" AS s
SET "preferredBusId" = sub."busId"
FROM (
  SELECT DISTINCT ON (t."scheduleId") t."scheduleId", t."busId"
  FROM "trip" t
  ORDER BY t."scheduleId", t."departureDate" DESC
) AS sub
WHERE s.id = sub."scheduleId" AND s."preferredBusId" IS NULL;

-- CreateIndex
CREATE INDEX "schedule_preferredBusId_idx" ON "schedule"("preferredBusId");

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_preferredBusId_fkey" FOREIGN KEY ("preferredBusId") REFERENCES "bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Deduplicate fares before unique constraint (keep newest by createdAt proxy = id)
DELETE FROM "fare" a
USING "fare" b
WHERE a.id < b.id
  AND a."scheduleId" = b."scheduleId"
  AND a."fromStopOrder" = b."fromStopOrder"
  AND a."toStopOrder" = b."toStopOrder"
  AND a."seatClass" = b."seatClass"
  AND a."type" = b."type";

-- CreateIndex
CREATE UNIQUE INDEX "fare_scheduleId_fromStopOrder_toStopOrder_seatClass_type_key" ON "fare"("scheduleId", "fromStopOrder", "toStopOrder", "seatClass", "type");
