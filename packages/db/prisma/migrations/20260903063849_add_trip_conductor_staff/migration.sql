-- Clean up any legacy CONDUCTOR assignments from trip_driver_assignment
DELETE FROM "trip_driver_assignment" WHERE "role" = 'CONDUCTOR';

-- AlterTable: Add conductorStaffId column to trip
ALTER TABLE "trip" ADD COLUMN "conductorStaffId" TEXT;

-- CreateIndex
CREATE INDEX "trip_conductorStaffId_idx" ON "trip"("conductorStaffId");

-- AddForeignKey: Link trip.conductorStaffId to operator.id
ALTER TABLE "trip" ADD CONSTRAINT "trip_conductorStaffId_fkey" FOREIGN KEY ("conductorStaffId") REFERENCES "operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
