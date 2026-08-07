/*
  Warnings:

  - You are about to drop the column `reverse_geocoded_address` on the `location_capture` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AdminStaffRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT', 'COMPLIANCE', 'FINANCE');

-- CreateEnum
CREATE TYPE "AdminStaffStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- DropIndex
DROP INDEX "municipality_geometry_gist";

-- DropIndex
DROP INDEX "municipality_name_pcode_idx";

-- DropIndex
DROP INDEX "quarter_geometry_gist";

-- AlterTable
ALTER TABLE "location_capture" DROP COLUMN "reverse_geocoded_address",
ADD COLUMN     "reverseGeocodedAddress" TEXT;

-- CreateTable
CREATE TABLE "admin_staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AdminStaffRole" NOT NULL DEFAULT 'SUPPORT',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permissionsUpdatedAt" TIMESTAMP(3),
    "permissionsUpdatedBy" TEXT,
    "status" "AdminStaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "jobTitle" TEXT,
    "profilePhotoUrl" TEXT,
    "department" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_staff_invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminStaffRole" NOT NULL,
    "permissions" TEXT[],
    "jobTitle" TEXT,
    "message" TEXT,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_staff_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_staff_userId_key" ON "admin_staff"("userId");

-- CreateIndex
CREATE INDEX "admin_staff_role_idx" ON "admin_staff"("role");

-- CreateIndex
CREATE INDEX "admin_staff_status_idx" ON "admin_staff"("status");

-- CreateIndex
CREATE UNIQUE INDEX "admin_staff_invitation_token_key" ON "admin_staff_invitation"("token");

-- CreateIndex
CREATE INDEX "admin_staff_invitation_email_idx" ON "admin_staff_invitation"("email");

-- CreateIndex
CREATE INDEX "admin_staff_invitation_status_idx" ON "admin_staff_invitation"("status");

-- CreateIndex
CREATE INDEX "admin_staff_invitation_invitedById_idx" ON "admin_staff_invitation"("invitedById");

-- AddForeignKey
ALTER TABLE "admin_staff" ADD CONSTRAINT "admin_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_staff_invitation" ADD CONSTRAINT "admin_staff_invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_staff_invitation" ADD CONSTRAINT "admin_staff_invitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
