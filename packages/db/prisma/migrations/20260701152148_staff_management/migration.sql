-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAVELER', 'OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "HoldGroupStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('INITIALIZED', 'PENDING', 'SUCCESS', 'FAILED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "LedgerSourceType" AS ENUM ('PAYMENT', 'REFUND', 'SETTLEMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RefundChannel" AS ENUM ('CASH', 'VOUCHER', 'PAYSTACK');

-- CreateEnum
CREATE TYPE "RefundRecordStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AccountOwnerType" AS ENUM ('USER', 'COMPANY', 'PLATFORM', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AccountCategory" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('NORMAL', 'FROZEN', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'PENDING', 'POSTED', 'SETTLED', 'REVERSED', 'VOIDED', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerEntrySide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerEntryStatus" AS ENUM ('PENDING', 'POSTED', 'VOIDED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONSUMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('COMPANY', 'DOCUMENTS', 'BANK', 'PROFILE', 'TERMS');

-- CreateEnum
CREATE TYPE "OnboardingEventType" AS ENUM ('STEP_ENTERED', 'STEP_COMPLETED', 'STEP_SKIPPED', 'ABANDONED', 'VALIDATION_FAILED');

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
    "termsAcceptedAt" TIMESTAMP(3),
    "commissionAcceptedAt" TIMESTAMP(3),
    "privacyAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "privacyVersion" TEXT,
    "commissionVersion" TEXT,
    "paystackSubaccountCode" TEXT,
    "settlementPolicyId" TEXT,
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
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "supersededAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_account" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountNumberLast4" TEXT,
    "accountName" TEXT NOT NULL,
    "branch" TEXT,
    "swiftCode" TEXT,
    "iban" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verificationDocumentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "paystackSubaccountCode" TEXT,
    "verificationProvider" TEXT,
    "verifiedByProvider" BOOLEAN NOT NULL DEFAULT false,
    "verificationReference" TEXT,
    "verificationPayload" JSONB,
    "lastVerificationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_access_log" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_verification" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ownerIdentityVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankVerified" BOOLEAN NOT NULL DEFAULT false,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "permitVerified" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "company_verification_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "operator_onboarding" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "currentStep" "OnboardingStep" NOT NULL DEFAULT 'COMPANY',
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "completedStepCount" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 5,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "operator_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_onboarding_event" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "step" "OnboardingStep" NOT NULL,
    "eventType" "OnboardingEventType" NOT NULL,
    "timeSpentSeconds" INTEGER,
    "metadata" JSONB,
    "device" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_onboarding_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_operator_signup" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_operator_signup_pkey" PRIMARY KEY ("id")
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultCommissionBps" INTEGER NOT NULL DEFAULT 500,
    "defaultConvenienceFeeBps" INTEGER NOT NULL DEFAULT 250,
    "paystackFeeLocalCardBps" INTEGER NOT NULL DEFAULT 320,
    "paystackFeeIntlCardBps" INTEGER NOT NULL DEFAULT 380,
    "paystackFeeMobileMoneyBps" INTEGER NOT NULL DEFAULT 195,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_distance_tier" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minDistanceKm" DOUBLE PRECISION NOT NULL,
    "maxDistanceKm" DOUBLE PRECISION,
    "commissionBps" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_distance_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hold_group" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT,
    "offerId" TEXT NOT NULL,
    "status" "HoldGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "holdExpiresAt" TIMESTAMP(3) NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "baseFareXOF" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hold_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_snapshot" (
    "id" TEXT NOT NULL,
    "holdGroupId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "commissionBps" INTEGER NOT NULL,
    "convenienceFeeBps" INTEGER NOT NULL,
    "baseFareXOF" INTEGER NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "subtotalBaseXOF" INTEGER NOT NULL,
    "convenienceFeeXOF" INTEGER NOT NULL,
    "chargeAmountXOF" INTEGER NOT NULL,
    "commissionXOF" INTEGER NOT NULL,
    "operatorNetXOF" INTEGER NOT NULL,
    "platformGrossXOF" INTEGER NOT NULL,
    "snapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "holdGroupId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amountXOF" INTEGER NOT NULL,
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'INITIALIZED',
    "paystackReference" TEXT,
    "channel" TEXT,
    "feesXOF" INTEGER,
    "metadata" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "paystackReference" TEXT NOT NULL,
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'INITIALIZED',
    "channel" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_event" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "reference" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_ledger_entry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "holdGroupId" TEXT,
    "paymentId" TEXT,
    "entryType" "LedgerEntryType" NOT NULL,
    "sourceType" "LedgerSourceType" NOT NULL,
    "amountXOF" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund" (
    "id" TEXT NOT NULL,
    "holdGroupId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountXOF" INTEGER NOT NULL,
    "channel" "RefundChannel" NOT NULL,
    "status" "RefundRecordStatus" NOT NULL DEFAULT 'PENDING',
    "paystackRefundId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_account" (
    "id" TEXT NOT NULL,
    "ownerType" "AccountOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "accountCategory" "AccountCategory" NOT NULL,
    "accountClass" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" "AccountStatus" NOT NULL DEFAULT 'NORMAL',
    "allowNegativeBalance" BOOLEAN NOT NULL DEFAULT false,
    "postedBalance" INTEGER NOT NULL DEFAULT 0,
    "reservedBalance" INTEGER NOT NULL DEFAULT 0,
    "availableBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_account_snapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "postedBalance" INTEGER NOT NULL,
    "reservedBalance" INTEGER NOT NULL,
    "availableBalance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_account_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'CREATED',
    "externalPaymentId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "side" "LedgerEntrySide" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" "LedgerEntryStatus" NOT NULL DEFAULT 'POSTED',
    "sequenceNumber" INTEGER NOT NULL,
    "description" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_reservation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "holdGroupId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "thresholdAmount" INTEGER,
    "cronSchedule" TEXT,

    CONSTRAINT "settlement_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT,
    "seatId" TEXT NOT NULL,
    "originTripStopId" TEXT NOT NULL,
    "destinationTripStopId" TEXT NOT NULL,
    "boardingStopOrder" INTEGER NOT NULL,
    "dropoffStopOrder" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "holdExpiresAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "farePaid" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "bookingReference" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerPhone" TEXT NOT NULL,
    "ticketToken" TEXT NOT NULL,
    "holdGroupId" TEXT,
    "savedPassengerId" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "boardedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "authorId" TEXT NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passenger_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "preferencesJson" JSONB,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passenger_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_passenger" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "label" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "idType" TEXT,
    "idNumber" TEXT,
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_passenger_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "user_workPhone_key" ON "user"("workPhone");

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
CREATE INDEX "company_document_isCurrent_idx" ON "company_document"("isCurrent");

-- CreateIndex
CREATE INDEX "bank_account_companyId_idx" ON "bank_account"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_bankName_accountNumber_key" ON "bank_account"("bankName", "accountNumber");

-- CreateIndex
CREATE INDEX "bank_access_log_companyId_idx" ON "bank_access_log"("companyId");

-- CreateIndex
CREATE INDEX "bank_access_log_userId_idx" ON "bank_access_log"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "company_verification_companyId_key" ON "company_verification"("companyId");

-- CreateIndex
CREATE INDEX "operator_companyId_idx" ON "operator"("companyId");

-- CreateIndex
CREATE INDEX "operator_userId_idx" ON "operator"("userId");

-- CreateIndex
CREATE INDEX "operator_role_idx" ON "operator"("role");

-- CreateIndex
CREATE UNIQUE INDEX "operator_userId_companyId_key" ON "operator"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "operator_onboarding_operatorId_key" ON "operator_onboarding"("operatorId");

-- CreateIndex
CREATE INDEX "operator_onboarding_operatorId_idx" ON "operator_onboarding"("operatorId");

-- CreateIndex
CREATE INDEX "operator_onboarding_event_operatorId_idx" ON "operator_onboarding_event"("operatorId");

-- CreateIndex
CREATE INDEX "operator_onboarding_event_step_eventType_idx" ON "operator_onboarding_event"("step", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "pending_operator_signup_email_key" ON "pending_operator_signup"("email");

-- CreateIndex
CREATE INDEX "pending_operator_signup_email_idx" ON "pending_operator_signup"("email");

-- CreateIndex
CREATE INDEX "pending_operator_signup_expiresAt_idx" ON "pending_operator_signup"("expiresAt");

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
CREATE INDEX "trip_seat_tripId_isActive_idx" ON "trip_seat"("tripId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "trip_seat_tripId_seatId_key" ON "trip_seat"("tripId", "seatId");

-- CreateIndex
CREATE INDEX "commission_distance_tier_isActive_sortOrder_idx" ON "commission_distance_tier"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "hold_group_companyId_idx" ON "hold_group"("companyId");

-- CreateIndex
CREATE INDEX "hold_group_tripId_idx" ON "hold_group"("tripId");

-- CreateIndex
CREATE INDEX "hold_group_userId_idx" ON "hold_group"("userId");

-- CreateIndex
CREATE INDEX "hold_group_status_holdExpiresAt_idx" ON "hold_group"("status", "holdExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_snapshot_holdGroupId_key" ON "pricing_snapshot"("holdGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_holdGroupId_key" ON "payment"("holdGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_paystackReference_key" ON "payment"("paystackReference");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- CreateIndex
CREATE INDEX "payment_paystackReference_idx" ON "payment"("paystackReference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempt_paystackReference_key" ON "payment_attempt"("paystackReference");

-- CreateIndex
CREATE INDEX "payment_attempt_paymentId_idx" ON "payment_attempt"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempt_paymentId_attemptNumber_key" ON "payment_attempt"("paymentId", "attemptNumber");

-- CreateIndex
CREATE INDEX "payment_event_paymentId_idx" ON "payment_event"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_idempotencyKey_key" ON "webhook_event"("idempotencyKey");

-- CreateIndex
CREATE INDEX "webhook_event_provider_createdAt_idx" ON "webhook_event"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "operator_ledger_entry_companyId_createdAt_idx" ON "operator_ledger_entry"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "operator_ledger_entry_holdGroupId_idx" ON "operator_ledger_entry"("holdGroupId");

-- CreateIndex
CREATE INDEX "refund_holdGroupId_idx" ON "refund"("holdGroupId");

-- CreateIndex
CREATE INDEX "refund_paymentId_idx" ON "refund"("paymentId");

-- CreateIndex
CREATE INDEX "financial_account_ownerType_ownerId_idx" ON "financial_account"("ownerType", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "financial_account_snapshot_accountId_period_snapshotDate_key" ON "financial_account_snapshot"("accountId", "period", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entry_idempotencyKey_key" ON "ledger_entry"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entry_transactionId_sequenceNumber_key" ON "ledger_entry"("transactionId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "wallet_reservation_holdGroupId_idx" ON "wallet_reservation"("holdGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_bookingReference_key" ON "booking"("bookingReference");

-- CreateIndex
CREATE UNIQUE INDEX "booking_ticketToken_key" ON "booking"("ticketToken");

-- CreateIndex
CREATE INDEX "booking_companyId_idx" ON "booking"("companyId");

-- CreateIndex
CREATE INDEX "booking_tripId_seatId_status_idx" ON "booking"("tripId", "seatId", "status");

-- CreateIndex
CREATE INDEX "booking_tripId_status_idx" ON "booking"("tripId", "status");

-- CreateIndex
CREATE INDEX "booking_tripId_seatId_originTripStopId_destinationTripStopI_idx" ON "booking"("tripId", "seatId", "originTripStopId", "destinationTripStopId");

-- CreateIndex
CREATE INDEX "booking_userId_idx" ON "booking"("userId");

-- CreateIndex
CREATE INDEX "booking_holdGroupId_idx" ON "booking"("holdGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "review_bookingId_key" ON "review"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_profile_userId_key" ON "passenger_profile"("userId");

-- CreateIndex
CREATE INDEX "saved_passenger_profileId_idx" ON "saved_passenger"("profileId");

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
ALTER TABLE "company" ADD CONSTRAINT "company_settlementPolicyId_fkey" FOREIGN KEY ("settlementPolicyId") REFERENCES "settlement_policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_document" ADD CONSTRAINT "company_document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_document" ADD CONSTRAINT "company_document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_document" ADD CONSTRAINT "company_document_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "company_document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_access_log" ADD CONSTRAINT "bank_access_log_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_access_log" ADD CONSTRAINT "bank_access_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_verification" ADD CONSTRAINT "company_verification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_verification" ADD CONSTRAINT "company_verification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator" ADD CONSTRAINT "operator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator" ADD CONSTRAINT "operator_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_onboarding" ADD CONSTRAINT "operator_onboarding_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_onboarding_event" ADD CONSTRAINT "operator_onboarding_event_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "hold_group" ADD CONSTRAINT "hold_group_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_group" ADD CONSTRAINT "hold_group_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_group" ADD CONSTRAINT "hold_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_snapshot" ADD CONSTRAINT "pricing_snapshot_holdGroupId_fkey" FOREIGN KEY ("holdGroupId") REFERENCES "hold_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_holdGroupId_fkey" FOREIGN KEY ("holdGroupId") REFERENCES "hold_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempt" ADD CONSTRAINT "payment_attempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_ledger_entry" ADD CONSTRAINT "operator_ledger_entry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_ledger_entry" ADD CONSTRAINT "operator_ledger_entry_holdGroupId_fkey" FOREIGN KEY ("holdGroupId") REFERENCES "hold_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_ledger_entry" ADD CONSTRAINT "operator_ledger_entry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_holdGroupId_fkey" FOREIGN KEY ("holdGroupId") REFERENCES "hold_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_account_snapshot" ADD CONSTRAINT "financial_account_snapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transaction" ADD CONSTRAINT "financial_transaction_externalPaymentId_fkey" FOREIGN KEY ("externalPaymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "financial_transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_reservation" ADD CONSTRAINT "wallet_reservation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "financial_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_originTripStopId_fkey" FOREIGN KEY ("originTripStopId") REFERENCES "trip_stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_destinationTripStopId_fkey" FOREIGN KEY ("destinationTripStopId") REFERENCES "trip_stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_holdGroupId_fkey" FOREIGN KEY ("holdGroupId") REFERENCES "hold_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_savedPassengerId_fkey" FOREIGN KEY ("savedPassengerId") REFERENCES "saved_passenger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_profile" ADD CONSTRAINT "passenger_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_passenger" ADD CONSTRAINT "saved_passenger_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "passenger_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
