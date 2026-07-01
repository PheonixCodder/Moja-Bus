-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAVELER', 'OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('SOLE_PROPRIETORSHIP', 'LLC', 'CORPORATION', 'PARTNERSHIP', 'COOPERATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BUSINESS_REGISTRATION_CERTIFICATE', 'TAX_CLEARANCE_CERTIFICATE', 'BUSINESS_LICENSE', 'TRANSPORT_OPERATING_PERMIT', 'INSURANCE_CERTIFICATE', 'AUTHORIZED_REPRESENTATIVE_LETTER', 'BANK_STATEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'OPERATIONS', 'FINANCE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('PASSENGER_WINDOW', 'PASSENGER_AISLE', 'PASSENGER_MIDDLE', 'DRIVER_AREA', 'EMPTY_SPACE');

-- CreateEnum
CREATE TYPE "SeatClass" AS ENUM ('ECONOMY', 'STANDARD', 'VIP');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('DAILY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('CANCELLED', 'EXTRA_SERVICE', 'MODIFIED');

-- CreateEnum
CREATE TYPE "ExceptionReason" AS ENUM ('HOLIDAY_ISLAMIC', 'HOLIDAY_CHRISTIAN', 'HOLIDAY_NATIONAL', 'STRIKE', 'WEATHER', 'MAINTENANCE', 'OPERATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "FareType" AS ENUM ('FIXED', 'PROMO', 'HOLIDAY_SURGE', 'EARLY_BIRD');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OperatorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TRAVELER',
    "workEmail" TEXT,
    "workPhone" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "businessType" "BusinessType" NOT NULL DEFAULT 'SOLE_PROPRIETORSHIP',
    "registrationNumber" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "yearEstablished" INTEGER,
    "logoUrl" TEXT,
    "estimatedStaffSize" INTEGER NOT NULL,
    "status" "CompanyStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionReason" TEXT,
    "verificationChecklist" JSONB DEFAULT '{}',
    "registrationProgress" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_document" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_account" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "branch" TEXT,
    "swiftCode" TEXT,
    "iban" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verificationDocumentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'OWNER',
    "status" "OperatorStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "onboardingCurrentStep" TEXT NOT NULL DEFAULT 'company',
    "onboardingStartedAt" TIMESTAMP(3),
    "onboardingLastStepAt" TIMESTAMP(3),
    "onboardingCompletedAt" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "nationalIdNumber" TEXT,
    "nationalIdType" TEXT,
    "nationalIdDocumentId" TEXT,
    "personalPhone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "profilePhotoUrl" TEXT,
    "jobTitle" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMajorHub" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_location" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cityId" TEXT,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Cote d''Ivoire',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT NOT NULL,
    "managerName" TEXT,
    "managerPhone" TEXT,
    "managerEmail" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "operatingHours" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bus_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_layout_template" (
    "id" TEXT NOT NULL,
    "busTypeId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "rows" INTEGER NOT NULL,
    "columns" INTEGER NOT NULL,
    "hasAC" BOOLEAN NOT NULL DEFAULT false,
    "hasWifi" BOOLEAN NOT NULL DEFAULT false,
    "hasToilet" BOOLEAN NOT NULL DEFAULT false,
    "hasLuggage" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "seat_layout_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_template" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "deck" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT NOT NULL,
    "seatType" "SeatType" NOT NULL DEFAULT 'PASSENGER_WINDOW',
    "isBookable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "seat_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "busTypeId" TEXT NOT NULL,
    "layoutTemplateId" TEXT NOT NULL,
    "registrationPlate" TEXT NOT NULL,
    "internalName" TEXT,
    "manufactureYear" INTEGER,
    "status" "BusStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "deck" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT NOT NULL,
    "seatType" "SeatType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originTerminalId" TEXT NOT NULL,
    "destTerminalId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "estimatedMinutes" INTEGER,
    "status" "RouteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_waypoint" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "arrivalOffsetMinutes" INTEGER NOT NULL,
    "departureOffsetMinutes" INTEGER NOT NULL,
    "distanceFromOriginKm" DOUBLE PRECISION,
    "isPickup" BOOLEAN NOT NULL DEFAULT true,
    "isDropoff" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "route_waypoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT,
    "departureTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_calendar" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "monday" BOOLEAN NOT NULL DEFAULT false,
    "tuesday" BOOLEAN NOT NULL DEFAULT false,
    "wednesday" BOOLEAN NOT NULL DEFAULT false,
    "thursday" BOOLEAN NOT NULL DEFAULT false,
    "friday" BOOLEAN NOT NULL DEFAULT false,
    "saturday" BOOLEAN NOT NULL DEFAULT false,
    "sunday" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "service_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_exception" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ExceptionType" NOT NULL,
    "reason" "ExceptionReason" NOT NULL DEFAULT 'OPERATIONAL',
    "notes" TEXT,

    CONSTRAINT "service_exception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fare" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "type" "FareType" NOT NULL DEFAULT 'FIXED',
    "seatClass" "SeatClass" NOT NULL,
    "fromStopOrder" INTEGER NOT NULL DEFAULT 0,
    "toStopOrder" INTEGER NOT NULL,
    "priceXOF" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "estimatedArrival" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "delayMinutes" INTEGER,
    "gate" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cancelReason" TEXT,
    "notes" TEXT,
    "routeSnapshotJson" JSONB NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "scheduledArrival" TIMESTAMP(3),
    "scheduledDeparture" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "isPickup" BOOLEAN NOT NULL DEFAULT true,
    "isDropoff" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "trip_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_seat" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "heldUntil" TIMESTAMP(3),
    "bookingId" TEXT,

    CONSTRAINT "trip_seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passenger_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passenger_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'OPERATIONS',
    "jobTitle" TEXT,
    "message" TEXT,
    "companyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_workEmail_key" ON "user"("workEmail");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "company_slug_key" ON "company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_email_key" ON "company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "company_phone_key" ON "company"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "company_registrationNumber_key" ON "company"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "company_taxId_key" ON "company"("taxId");

-- CreateIndex
CREATE INDEX "company_slug_idx" ON "company"("slug");

-- CreateIndex
CREATE INDEX "company_status_idx" ON "company"("status");

-- CreateIndex
CREATE INDEX "company_registrationNumber_idx" ON "company"("registrationNumber");

-- CreateIndex
CREATE INDEX "company_taxId_idx" ON "company"("taxId");

-- CreateIndex
CREATE INDEX "company_document_companyId_idx" ON "company_document"("companyId");

-- CreateIndex
CREATE INDEX "company_document_type_idx" ON "company_document"("type");

-- CreateIndex
CREATE INDEX "company_document_status_idx" ON "company_document"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_companyId_key" ON "bank_account"("companyId");

-- CreateIndex
CREATE INDEX "bank_account_companyId_idx" ON "bank_account"("companyId");

-- CreateIndex
CREATE INDEX "operator_companyId_idx" ON "operator"("companyId");

-- CreateIndex
CREATE INDEX "operator_userId_idx" ON "operator"("userId");

-- CreateIndex
CREATE INDEX "operator_role_idx" ON "operator"("role");

-- CreateIndex
CREATE UNIQUE INDEX "operator_userId_companyId_key" ON "operator"("userId", "companyId");

-- CreateIndex
CREATE INDEX "city_isActive_idx" ON "city"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "city_name_key" ON "city"("name");

-- CreateIndex
CREATE INDEX "company_location_companyId_idx" ON "company_location"("companyId");

-- CreateIndex
CREATE INDEX "company_location_cityId_idx" ON "company_location"("cityId");

-- CreateIndex
CREATE INDEX "company_location_isTerminal_idx" ON "company_location"("isTerminal");

-- CreateIndex
CREATE INDEX "company_location_isPrimary_idx" ON "company_location"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "bus_type_name_key" ON "bus_type"("name");

-- CreateIndex
CREATE INDEX "seat_layout_template_busTypeId_idx" ON "seat_layout_template"("busTypeId");

-- CreateIndex
CREATE INDEX "seat_layout_template_companyId_idx" ON "seat_layout_template"("companyId");

-- CreateIndex
CREATE INDEX "seat_template_layoutId_idx" ON "seat_template"("layoutId");

-- CreateIndex
CREATE UNIQUE INDEX "bus_registrationPlate_key" ON "bus"("registrationPlate");

-- CreateIndex
CREATE INDEX "bus_companyId_idx" ON "bus"("companyId");

-- CreateIndex
CREATE INDEX "bus_status_idx" ON "bus"("status");

-- CreateIndex
CREATE INDEX "seat_busId_idx" ON "seat"("busId");

-- CreateIndex
CREATE INDEX "route_companyId_idx" ON "route"("companyId");

-- CreateIndex
CREATE INDEX "route_status_idx" ON "route"("status");

-- CreateIndex
CREATE INDEX "route_originTerminalId_idx" ON "route"("originTerminalId");

-- CreateIndex
CREATE INDEX "route_destTerminalId_idx" ON "route"("destTerminalId");

-- CreateIndex
CREATE INDEX "route_waypoint_routeId_idx" ON "route_waypoint"("routeId");

-- CreateIndex
CREATE INDEX "route_waypoint_terminalId_idx" ON "route_waypoint"("terminalId");

-- CreateIndex
CREATE UNIQUE INDEX "route_waypoint_routeId_stopOrder_key" ON "route_waypoint"("routeId", "stopOrder");

-- CreateIndex
CREATE INDEX "schedule_companyId_idx" ON "schedule"("companyId");

-- CreateIndex
CREATE INDEX "schedule_routeId_idx" ON "schedule"("routeId");

-- CreateIndex
CREATE INDEX "schedule_isActive_idx" ON "schedule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "service_calendar_scheduleId_key" ON "service_calendar"("scheduleId");

-- CreateIndex
CREATE INDEX "service_exception_scheduleId_idx" ON "service_exception"("scheduleId");

-- CreateIndex
CREATE INDEX "service_exception_date_idx" ON "service_exception"("date");

-- CreateIndex
CREATE INDEX "fare_scheduleId_idx" ON "fare"("scheduleId");

-- CreateIndex
CREATE INDEX "fare_type_idx" ON "fare"("type");

-- CreateIndex
CREATE INDEX "trip_companyId_idx" ON "trip"("companyId");

-- CreateIndex
CREATE INDEX "trip_scheduleId_idx" ON "trip"("scheduleId");

-- CreateIndex
CREATE INDEX "trip_busId_idx" ON "trip"("busId");

-- CreateIndex
CREATE INDEX "trip_status_idx" ON "trip"("status");

-- CreateIndex
CREATE INDEX "trip_departureDate_idx" ON "trip"("departureDate");

-- CreateIndex
CREATE INDEX "trip_stop_tripId_idx" ON "trip_stop"("tripId");

-- CreateIndex
CREATE INDEX "trip_stop_terminalId_idx" ON "trip_stop"("terminalId");

-- CreateIndex
CREATE UNIQUE INDEX "trip_stop_tripId_stopOrder_key" ON "trip_stop"("tripId", "stopOrder");

-- CreateIndex
CREATE INDEX "trip_seat_tripId_idx" ON "trip_seat"("tripId");

-- CreateIndex
CREATE INDEX "trip_seat_status_idx" ON "trip_seat"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trip_seat_tripId_seatId_key" ON "trip_seat"("tripId", "seatId");

-- CreateIndex
CREATE INDEX "booking_companyId_idx" ON "booking"("companyId");

-- CreateIndex
CREATE INDEX "booking_tripId_idx" ON "booking"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_profile_userId_key" ON "passenger_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_invitation_token_key" ON "staff_invitation"("token");

-- CreateIndex
CREATE INDEX "staff_invitation_companyId_idx" ON "staff_invitation"("companyId");

-- CreateIndex
CREATE INDEX "staff_invitation_email_idx" ON "staff_invitation"("email");

-- CreateIndex
CREATE INDEX "staff_invitation_token_idx" ON "staff_invitation"("token");

-- CreateIndex
CREATE INDEX "activity_log_companyId_idx" ON "activity_log"("companyId");

-- CreateIndex
CREATE INDEX "activity_log_userId_idx" ON "activity_log"("userId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_document" ADD CONSTRAINT "company_document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_document" ADD CONSTRAINT "company_document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator" ADD CONSTRAINT "operator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator" ADD CONSTRAINT "operator_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_location" ADD CONSTRAINT "company_location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_location" ADD CONSTRAINT "company_location_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_layout_template" ADD CONSTRAINT "seat_layout_template_busTypeId_fkey" FOREIGN KEY ("busTypeId") REFERENCES "bus_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_layout_template" ADD CONSTRAINT "seat_layout_template_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_template" ADD CONSTRAINT "seat_template_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "seat_layout_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus" ADD CONSTRAINT "bus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus" ADD CONSTRAINT "bus_busTypeId_fkey" FOREIGN KEY ("busTypeId") REFERENCES "bus_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus" ADD CONSTRAINT "bus_layoutTemplateId_fkey" FOREIGN KEY ("layoutTemplateId") REFERENCES "seat_layout_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat" ADD CONSTRAINT "seat_busId_fkey" FOREIGN KEY ("busId") REFERENCES "bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "route_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "route_originTerminalId_fkey" FOREIGN KEY ("originTerminalId") REFERENCES "company_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "route_destTerminalId_fkey" FOREIGN KEY ("destTerminalId") REFERENCES "company_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_waypoint" ADD CONSTRAINT "route_waypoint_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_waypoint" ADD CONSTRAINT "route_waypoint_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "company_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_calendar" ADD CONSTRAINT "service_calendar_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_exception" ADD CONSTRAINT "service_exception_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fare" ADD CONSTRAINT "fare_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_busId_fkey" FOREIGN KEY ("busId") REFERENCES "bus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "company_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_seat" ADD CONSTRAINT "trip_seat_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_seat" ADD CONSTRAINT "trip_seat_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_profile" ADD CONSTRAINT "passenger_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
