-- ============================================================================
-- Foundation Database Constraints and Indexes Rollback Migration
-- 
-- This script safely removes all changes made by 001_foundation_constraints.sql
-- Use this if you need to rollback the foundation migration
-- ============================================================================

-- ============================================================================
-- Drop Triggers First (to avoid constraint violations during rollback)
-- ============================================================================

-- Drop audit triggers
DROP TRIGGER IF EXISTS audit_company_trigger ON "Company";
DROP TRIGGER IF EXISTS audit_revenue_trigger ON "Revenue";
DROP TRIGGER IF EXISTS audit_withdrawal_trigger ON "Withdrawal";
DROP TRIGGER IF EXISTS audit_booking_trigger ON "Booking";
DROP TRIGGER IF EXISTS audit_operator_trigger ON "Operator";

-- Drop version update triggers
DROP TRIGGER IF EXISTS update_company_version ON "Company";
DROP TRIGGER IF EXISTS update_operator_version ON "Operator";
DROP TRIGGER IF EXISTS update_schedule_version ON "Schedule";
DROP TRIGGER IF EXISTS update_booking_version ON "Booking";
DROP TRIGGER IF EXISTS update_revenue_version ON "Revenue";
DROP TRIGGER IF EXISTS update_withdrawal_version ON "Withdrawal";

-- ============================================================================
-- Drop Custom Functions
-- ============================================================================

DROP FUNCTION IF EXISTS validate_utc_datetime(TEXT);
DROP FUNCTION IF EXISTS audit_trigger_function();
DROP FUNCTION IF EXISTS update_version_trigger();
DROP FUNCTION IF EXISTS validate_withdrawal_balance(UUID, BIGINT);
DROP FUNCTION IF EXISTS check_schedule_conflict(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);
DROP FUNCTION IF EXISTS cleanup_expired_bookings();

-- ============================================================================
-- Drop Indexes (in reverse order of creation)
-- ============================================================================

-- Performance indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_log_timestamp";
DROP INDEX CONCURRENTLY IF EXISTS "idx_company_active";
DROP INDEX CONCURRENTLY IF EXISTS "idx_schedule_active_departure";

-- Unique constraint indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_schedule_bus_time_overlap";
DROP INDEX CONCURRENTLY IF EXISTS "idx_user_email_active";
DROP INDEX CONCURRENTLY IF EXISTS "idx_booking_reference_unique";
DROP INDEX CONCURRENTLY IF EXISTS "idx_operator_user_company_active";

-- Full-text search indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_route_search";
DROP INDEX CONCURRENTLY IF EXISTS "idx_company_name_search";

-- User and operator indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_operator_user_active";
DROP INDEX CONCURRENTLY IF EXISTS "idx_operator_company_role";

-- Trip and operational indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_trip_driver_date";
DROP INDEX CONCURRENTLY IF EXISTS "idx_trip_schedule_departure";

-- Booking and scheduling indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_schedule_company_departure";
DROP INDEX CONCURRENTLY IF EXISTS "idx_schedule_route_departure";
DROP INDEX CONCURRENTLY IF EXISTS "idx_booking_customer_created_at";
DROP INDEX CONCURRENTLY IF EXISTS "idx_booking_schedule_status";

-- Financial operation indexes
DROP INDEX CONCURRENTLY IF EXISTS "idx_withdrawal_company_status";
DROP INDEX CONCURRENTLY IF EXISTS "idx_commission_company_recorded_at";
DROP INDEX CONCURRENTLY IF EXISTS "idx_revenue_booking_status";
DROP INDEX CONCURRENTLY IF EXISTS "idx_revenue_company_recorded_at";

-- ============================================================================
-- Remove Constraints (in reverse order of dependency)
-- ============================================================================

-- Business logic constraints
ALTER TABLE "Route" DROP CONSTRAINT IF EXISTS "route_positive_distance";
ALTER TABLE "Bus" DROP CONSTRAINT IF EXISTS "bus_valid_capacity";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "user_valid_role";
ALTER TABLE "Operator" DROP CONSTRAINT IF EXISTS "operator_valid_role";
ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "company_valid_commission_rate";

-- Schedule constraints
ALTER TABLE "Schedule" DROP CONSTRAINT IF EXISTS "schedule_valid_times";
ALTER TABLE "Schedule" DROP CONSTRAINT IF EXISTS "schedule_valid_seats";
ALTER TABLE "Schedule" DROP CONSTRAINT IF EXISTS "schedule_positive_fare";

-- Booking constraints
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "booking_valid_status";
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "booking_valid_seat_count";
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "booking_positive_amount";

-- Withdrawal constraints
ALTER TABLE "Withdrawal" DROP CONSTRAINT IF EXISTS "withdrawal_valid_status";
ALTER TABLE "Withdrawal" DROP CONSTRAINT IF EXISTS "withdrawal_max_amount";
ALTER TABLE "Withdrawal" DROP CONSTRAINT IF EXISTS "withdrawal_positive_amount";

-- Commission constraints
ALTER TABLE "Commission" DROP CONSTRAINT IF EXISTS "commission_valid_type";
ALTER TABLE "Commission" DROP CONSTRAINT IF EXISTS "commission_valid_rate";
ALTER TABLE "Commission" DROP CONSTRAINT IF EXISTS "commission_positive_amount";

-- Revenue constraints
ALTER TABLE "Revenue" DROP CONSTRAINT IF EXISTS "revenue_valid_status";
ALTER TABLE "Revenue" DROP CONSTRAINT IF EXISTS "revenue_valid_payment_method";
ALTER TABLE "Revenue" DROP CONSTRAINT IF EXISTS "revenue_amount_balance";
ALTER TABLE "Revenue" DROP CONSTRAINT IF EXISTS "revenue_positive_amounts";

-- Company timezone constraint
ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "company_valid_timezone";

-- ============================================================================
-- Remove Version Fields
-- ============================================================================

-- Remove version fields from financial tables
ALTER TABLE "Withdrawal" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Commission" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Revenue" DROP COLUMN IF EXISTS "version";

-- Remove version fields from operational tables
ALTER TABLE "Trip" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Schedule" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Operator" DROP COLUMN IF EXISTS "version";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "version";

-- ============================================================================
-- Drop Audit Log Table
-- ============================================================================

DROP TABLE IF EXISTS "AuditLog";

-- ============================================================================
-- Drop Extensions (only if safe to do so)
-- ============================================================================

-- Note: We don't drop extensions as they might be used by other parts of the system
-- DROP EXTENSION IF EXISTS "pg_trgm";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================================================
-- Rollback Completion Log
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Foundation constraints and indexes rollback completed successfully';
  RAISE NOTICE 'Removed all version fields, constraints, indexes, triggers, and functions';
  RAISE NOTICE 'Database schema has been restored to pre-migration state';
  RAISE NOTICE 'WARNING: Any data changes made using the foundation system may now be inconsistent';
END $$;