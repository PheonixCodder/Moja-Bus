-- M0: Add Côte d'Ivoire geography + GPS capture-link columns.
-- Enables PostGIS, adds lat/long + polygon geometry to Municipality/Quarter,
-- pcode/source to City, and geo-capture lifecycle on CompanyLocation.

-- Extension must exist before the geometry columns are created.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "LocationGeoCaptureStatus" AS ENUM ('COMPLETE', 'PENDING_CAPTURE', 'PENDING_CONFIRMATION');

-- CreateEnum
CREATE TYPE "LocationCaptureStatus" AS ENUM ('OPEN', 'PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "city" ADD COLUMN     "pcode" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "company_location" ADD COLUMN     "captureExpiresAt" TIMESTAMP(3),
ADD COLUMN     "captureToken" TEXT,
ADD COLUMN     "geoCaptureStatus" "LocationGeoCaptureStatus" NOT NULL DEFAULT 'COMPLETE';

-- AlterTable
ALTER TABLE "municipality" ADD COLUMN     "geometry" geometry,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "pcode" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "quarter" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "geometry" geometry,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "location_capture" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "LocationCaptureStatus" NOT NULL DEFAULT 'OPEN',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracyMeters" INTEGER,
    "capturedAt" TIMESTAMP(3),
    "device" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "resolvedCityId" TEXT,
    "resolvedMunicipalityId" TEXT,
    "resolvedQuarterId" TEXT,
    "submitterName" TEXT,
    "submitterPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "location_capture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "location_capture_token_key" ON "location_capture"("token");

-- CreateIndex
CREATE INDEX "location_capture_locationId_idx" ON "location_capture"("locationId");

-- CreateIndex
CREATE INDEX "location_capture_token_idx" ON "location_capture"("token");

-- CreateIndex
CREATE INDEX "location_capture_status_idx" ON "location_capture"("status");

-- CreateIndex
CREATE UNIQUE INDEX "company_location_captureToken_key" ON "company_location"("captureToken");

-- AddForeignKey
ALTER TABLE "location_capture" ADD CONSTRAINT "location_capture_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "company_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GiST indexes for spatial lookups (town-point and polygon containment).
CREATE INDEX "municipality_geometry_gist" ON "municipality" USING GIST ("geometry");
CREATE INDEX "quarter_geometry_gist" ON "quarter" USING GIST ("geometry");

-- Composite index to speed up point-in-polygon resolution by municipality.
CREATE INDEX "municipality_name_pcode_idx" ON "municipality"("name", "pcode");