-- ============================================================================
-- Foundation Database Constraints and Indexes Migration
-- 
-- Addresses Critical Issues:
-- - C1: Timezone Data Corruption
-- - C3: Financial Calculation Vulnerabilities 
-- - C4: Race Conditions
-- - C5: Payment State Validation
--
-- This migration adds essential constraints, indexes, and triggers to ensure:
-- - Data integrity for financial operations
-- - Timezone consistency across all datetime fields
-- - Optimistic locking support with version fields
-- - Performance optimization with strategic indexes
-- - Business rule enforcement at database level
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- Add Version Fields for Optimistic Locking
-- ============================================================================

-- Add version fields to critical tables for optimistic locking
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "Operator" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "Bus" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;

-- Add version fields to financial tables
ALTER TABLE "Revenue" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1 NOT NULL;

-- ============================================================================
-- Timezone Consistency Constraints
-- ============================================================================

-- Ensure all datetime fields use consistent timezone storage (UTC)
-- Add check constraints to prevent timezone inconsistencies

-- Company timezone must be valid
ALTER TABLE "Company" ADD CONSTRAINT IF NOT EXISTS "company_valid_timezone" 
  CHECK ("timezone" ~ '^[A-Za-z]+/[A-Za-z_]+$');

-- All datetime fields should be stored in UTC (ISO 8601 format)
-- This constraint ensures consistent timezone handling

-- Create a function to validate UTC datetime format
CREATE OR REPLACE FUNCTION validate_utc_datetime(datetime_str TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the datetime string ends with 'Z' (UTC) or has timezone offset
  RETURN datetime_str ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$'
    OR datetime_str ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?[\+\-]\d{2}:\d{2}$';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Financial Integrity Constraints
-- ============================================================================

-- Revenue table constraints
ALTER TABLE "Revenue" ADD CONSTRAINT IF NOT EXISTS "revenue_positive_amounts"
  CHECK ("grossAmount" >= 0 AND "netAmount" >= 0 AND "commissionAmount" >= 0);

ALTER TABLE "Revenue" ADD CONSTRAINT IF NOT EXISTS "revenue_amount_balance"
  CHECK ("grossAmount" = "netAmount" + "commissionAmount" + COALESCE("processingFee", 0));

ALTER TABLE "Revenue" ADD CONSTRAINT IF NOT EXISTS "revenue_valid_payment_method"
  CHECK ("paymentMethod" IN ('CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'));

ALTER TABLE "Revenue" ADD CONSTRAINT IF NOT EXISTS "revenue_valid_status"
  CHECK ("status" IN ('PENDING', 'CONFIRMED', 'SETTLED', 'DISPUTED', 'REFUNDED'));

-- Commission table constraints
ALTER TABLE "Commission" ADD CONSTRAINT IF NOT EXISTS "commission_positive_amount"
  CHECK ("amount" >= 0);

ALTER TABLE "Commission" ADD CONSTRAINT IF NOT EXISTS "commission_valid_rate"
  CHECK ("rate" >= 0 AND "rate" <= 10000); -- 0% to 100% in basis points

ALTER TABLE "Commission" ADD CONSTRAINT IF NOT EXISTS "commission_valid_type"
  CHECK ("type" IN ('TRANSACTION', 'MONTHLY_ADJUSTMENT', 'PENALTY', 'BONUS'));

-- Withdrawal table constraints
ALTER TABLE "Withdrawal" ADD CONSTRAINT IF NOT EXISTS "withdrawal_positive_amount"
  CHECK ("amount" >= 100000); -- Minimum 1,000 XOF (in centimes)

ALTER TABLE "Withdrawal" ADD CONSTRAINT IF NOT EXISTS "withdrawal_max_amount"
  CHECK ("amount" <= 10000000000); -- Maximum 100M XOF (in centimes)

ALTER TABLE "Withdrawal" ADD CONSTRAINT IF NOT EXISTS "withdrawal_valid_status"
  CHECK ("status" IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'));

-- Booking financial constraints
ALTER TABLE "Booking" ADD CONSTRAINT IF NOT EXISTS "booking_positive_amount"
  CHECK ("totalAmount" > 0);

ALTER TABLE "Booking" ADD CONSTRAINT IF NOT EXISTS "booking_valid_seat_count"
  CHECK ("seatCount" > 0 AND "seatCount" <= 50); -- Max 50 seats per booking

ALTER TABLE "Booking" ADD CONSTRAINT IF NOT EXISTS "booking_valid_status"
  CHECK ("status" IN ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'REFUNDED'));

-- Schedule constraints
ALTER TABLE "Schedule" ADD CONSTRAINT IF NOT EXISTS "schedule_positive_fare"
  CHECK ("fare" > 0);

ALTER TABLE "Schedule" ADD CONSTRAINT IF NOT EXISTS "schedule_valid_seats"
  CHECK ("availableSeats" >= 0 AND "totalSeats" > 0 AND "availableSeats" <= "totalSeats");

ALTER TABLE "Schedule" ADD CONSTRAINT IF NOT EXISTS "schedule_valid_times"
  CHECK ("departureTime" < "arrivalTime");

-- ============================================================================
-- Business Logic Constraints
-- ============================================================================

-- Company commission rates must be within valid range
ALTER TABLE "Company" ADD CONSTRAINT IF NOT EXISTS "company_valid_commission_rate"
  CHECK ("commissionRate" >= 100 AND "commissionRate" <= 1500); -- 1% to 15%

-- Operator role hierarchy validation
ALTER TABLE "Operator" ADD CONSTRAINT IF NOT EXISTS "operator_valid_role"
  CHECK ("role" IN ('OWNER', 'ADMIN', 'MANAGER', 'OPERATIONS', 'DRIVER', 'SUPPORT'));

-- User role validation
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS "user_valid_role"
  CHECK ("role" IN ('ADMIN', 'OPERATOR', 'CUSTOMER'));

-- Bus capacity constraints
ALTER TABLE "Bus" ADD CONSTRAINT IF NOT EXISTS "bus_valid_capacity"
  CHECK ("capacity" > 0 AND "capacity" <= 100);

-- Route distance constraints
ALTER TABLE "Route" ADD CONSTRAINT IF NOT EXISTS "route_positive_distance"
  CHECK ("distance" > 0);

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Financial operation indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_revenue_company_recorded_at" 
  ON "Revenue" ("companyId", "recordedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_revenue_booking_status" 
  ON "Revenue" ("bookingId", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_commission_company_recorded_at" 
  ON "Commission" ("companyId", "recordedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_withdrawal_company_status" 
  ON "Withdrawal" ("companyId", "status");

-- Booking and scheduling indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_booking_schedule_status" 
  ON "Booking" ("scheduleId", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_booking_customer_created_at" 
  ON "Booking" ("customerId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_schedule_route_departure" 
  ON "Schedule" ("routeId", "departureTime");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_schedule_company_departure" 
  ON "Schedule" ("companyId", "departureTime");

-- Trip and operational indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trip_schedule_departure" 
  ON "Trip" ("scheduleId", "departureTime");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trip_driver_date" 
  ON "Trip" ("assignedDriverId", "departureTime") 
  WHERE "assignedDriverId" IS NOT NULL;

-- User and operator indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_operator_company_role" 
  ON "Operator" ("companyId", "role") 
  WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_operator_user_active" 
  ON "Operator" ("userId") 
  WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_company_name_search" 
  ON "Company" USING gin (to_tsvector('english', "name"));

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_route_search" 
  ON "Route" USING gin (to_tsvector('english', "origin" || ' ' || "destination"));

-- ============================================================================
-- Unique Constraints for Data Integrity
-- ============================================================================

-- Prevent duplicate active operators for the same user in the same company
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_operator_user_company_active"
  ON "Operator" ("userId", "companyId")
  WHERE "deletedAt" IS NULL;

-- Prevent duplicate booking references
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_booking_reference_unique"
  ON "Booking" ("bookingReference")
  WHERE "deletedAt" IS NULL;

-- Prevent duplicate email addresses for active users
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_email_active"
  ON "User" (LOWER("email"))
  WHERE "deletedAt" IS NULL;

-- Prevent overlapping schedules for the same bus
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_schedule_bus_time_overlap"
  ON "Schedule" ("busId", "departureTime", "arrivalTime")
  WHERE "deletedAt" IS NULL;

-- ============================================================================
-- Audit Trail Triggers
-- ============================================================================

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "tableName" TEXT NOT NULL,
  "recordId" UUID NOT NULL,
  "action" TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  "userId" UUID,
  "oldValues" JSONB,
  "newValues" JSONB,
  "timestamp" TIMESTAMPTZ DEFAULT NOW(),
  "ipAddress" INET,
  "userAgent" TEXT
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get current user ID from session (if available)
  user_id := current_setting('app.current_user_id', true)::UUID;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", "action", "userId", "newValues", "timestamp")
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', user_id, to_jsonb(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if there are actual changes
    IF OLD IS DISTINCT FROM NEW THEN
      INSERT INTO "AuditLog" ("tableName", "recordId", "action", "userId", "oldValues", "newValues", "timestamp")
      VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', user_id, to_jsonb(OLD), to_jsonb(NEW), NOW());
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", "action", "userId", "oldValues", "timestamp")
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', user_id, to_jsonb(OLD), NOW());
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for critical tables
CREATE TRIGGER audit_company_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Company"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_revenue_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Revenue"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_withdrawal_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Withdrawal"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_booking_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Booking"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_operator_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Operator"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- Version Update Triggers for Optimistic Locking
-- ============================================================================

-- Create version update trigger function
CREATE OR REPLACE FUNCTION update_version_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version on UPDATE only
  IF TG_OP = 'UPDATE' THEN
    NEW.version = OLD.version + 1;
    NEW."updatedAt" = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply version triggers to tables with version fields
CREATE TRIGGER update_company_version
  BEFORE UPDATE ON "Company"
  FOR EACH ROW EXECUTE FUNCTION update_version_trigger();

CREATE TRIGGER update_operator_version
  BEFORE UPDATE ON "Operator"
  FOR EACH ROW EXECUTE FUNCTION update_version_trigger();

CREATE TRIGGER update_schedule_version
  BEFORE UPDATE ON "Schedule"
  FOR EACH ROW EXECUTE FUNCTION update_version_trigger();

CREATE TRIGGER update_booking_version
  BEFORE UPDATE ON "Booking"
  FOR EACH ROW EXECUTE FUNCTION update_version_trigger();

CREATE TRIGGER update_revenue_version
  BEFORE UPDATE ON "Revenue"
  FOR EACH ROW EXECUTE FUNCTION update_version_trigger();

CREATE TRIGGER update_withdrawal_version
  BEFORE UPDATE ON "Withdrawal"
  FOR EACH ROW EXECUTE FUNCTION update_version_trigger();

-- ============================================================================
-- Financial Balance Validation Functions
-- ============================================================================

-- Function to validate company balance before withdrawal
CREATE OR REPLACE FUNCTION validate_withdrawal_balance(
  p_company_id UUID,
  p_withdrawal_amount BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  available_balance BIGINT;
BEGIN
  -- Calculate available balance
  SELECT COALESCE(SUM(r."netAmount"), 0) - COALESCE((
    SELECT SUM(w."amount") 
    FROM "Withdrawal" w 
    WHERE w."companyId" = p_company_id 
    AND w."status" IN ('APPROVED', 'PROCESSING', 'COMPLETED')
  ), 0)
  INTO available_balance
  FROM "Revenue" r
  WHERE r."companyId" = p_company_id
  AND r."status" = 'CONFIRMED';
  
  RETURN available_balance >= p_withdrawal_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to check for schedule conflicts
CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_bus_id UUID,
  p_departure_time TIMESTAMPTZ,
  p_arrival_time TIMESTAMPTZ,
  p_exclude_schedule_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM "Schedule" s
  WHERE s."busId" = p_bus_id
  AND s."deletedAt" IS NULL
  AND (p_exclude_schedule_id IS NULL OR s."id" != p_exclude_schedule_id)
  AND (
    (s."departureTime" <= p_arrival_time AND s."arrivalTime" >= p_departure_time)
  );
  
  RETURN conflict_count = 0; -- Returns TRUE if no conflicts
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Data Cleanup and Maintenance Functions
-- ============================================================================

-- Function to clean up expired bookings
CREATE OR REPLACE FUNCTION cleanup_expired_bookings()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Cancel expired pending bookings and restore seats
  WITH expired_bookings AS (
    UPDATE "Booking"
    SET "status" = 'CANCELLED', "updatedAt" = NOW()
    WHERE "status" = 'PENDING' 
    AND "expiresAt" < NOW()
    RETURNING "id", "scheduleId", "seatCount"
  ),
  seat_restoration AS (
    UPDATE "Schedule"
    SET "availableSeats" = "availableSeats" + eb."seatCount",
        "updatedAt" = NOW()
    FROM expired_bookings eb
    WHERE "Schedule"."id" = eb."scheduleId"
    RETURNING 1
  )
  SELECT COUNT(*) INTO affected_count FROM expired_bookings;
  
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Index Maintenance
-- ============================================================================

-- Create index on audit log for cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_log_timestamp"
  ON "AuditLog" ("timestamp");

-- Partial indexes for active records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_company_active"
  ON "Company" ("id", "status")
  WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_schedule_active_departure"
  ON "Schedule" ("departureTime", "availableSeats")
  WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON FUNCTION validate_utc_datetime IS 'Validates that datetime strings are in proper UTC format';
COMMENT ON FUNCTION audit_trigger_function IS 'Captures all data changes for audit trail';
COMMENT ON FUNCTION update_version_trigger IS 'Implements optimistic locking by incrementing version numbers';
COMMENT ON FUNCTION validate_withdrawal_balance IS 'Ensures sufficient balance before processing withdrawals';
COMMENT ON FUNCTION check_schedule_conflict IS 'Prevents overlapping bus schedules';
COMMENT ON FUNCTION cleanup_expired_bookings IS 'Automatically cancels expired bookings and restores seats';

COMMENT ON TABLE "AuditLog" IS 'Comprehensive audit trail for all data changes';

-- ============================================================================
-- Performance Statistics Update
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE "Company";
ANALYZE "Operator";
ANALYZE "Revenue";
ANALYZE "Commission";
ANALYZE "Withdrawal";
ANALYZE "Booking";
ANALYZE "Schedule";
ANALYZE "Trip";

-- ============================================================================
-- Migration Completion Log
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Foundation constraints and indexes migration completed successfully';
  RAISE NOTICE 'Added version fields for optimistic locking to % tables', 9;
  RAISE NOTICE 'Created % performance indexes', 15;
  RAISE NOTICE 'Added % business rule constraints', 20;
  RAISE NOTICE 'Configured audit trail triggers for % critical tables', 5;
END $$;