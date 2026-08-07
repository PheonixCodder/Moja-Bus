-- Add new StaffRole enum values
-- This migration adds TREASURY, DISPATCHER, CONDUCTOR roles to the StaffRole enum
-- and migrates existing company:update permissions to granular keys

-- First, add the new enum values
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'TREASURY';
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'DISPATCHER';
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'CONDUCTOR';

-- Migrate existing 'company:update' permissions to the three new granular keys
-- This updates any operator who has the old 'company:update' permission
UPDATE "operator" 
SET "permissions" = (
  SELECT array_cat(
    array_agg(elem) FILTER (WHERE elem != 'company:update'),
    ARRAY['company:profile:update', 'company:banking:update', 'company:compliance:update']
  )
  FROM unnest("permissions") AS elem
)
WHERE 'company:update' = ANY("permissions");

-- Also migrate staff invitations that may have the old permission
UPDATE "staff_invitation"
SET "permissions" = (
  SELECT array_cat(
    array_agg(elem) FILTER (WHERE elem != 'company:update'),
    ARRAY['company:profile:update', 'company:banking:update', 'company:compliance:update']
  )
  FROM unnest("permissions") AS elem
)
WHERE 'company:update' = ANY("permissions");

-- Note: The 'company:update' key is now deprecated and should not be used going forward.
-- All new code should use the granular keys:
-- - company:profile:update
-- - company:banking:update
-- - company:compliance:update