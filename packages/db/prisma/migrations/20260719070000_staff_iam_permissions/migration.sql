-- AlterTable: operator permission audit fields
ALTER TABLE "operator" ADD COLUMN IF NOT EXISTS "permissionsUpdatedAt" TIMESTAMP(3);
ALTER TABLE "operator" ADD COLUMN IF NOT EXISTS "permissionsUpdatedBy" TEXT;

-- AlterTable: invitation permission snapshot
ALTER TABLE "staff_invitation" ADD COLUMN IF NOT EXISTS "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill non-OWNER operators with empty permissions from role templates.
-- OWNER keeps empty array (runtime bypass).

-- ADMIN template
UPDATE "operator"
SET "permissions" = ARRAY[
  'routes:read','routes:create','routes:update','routes:delete',
  'terminals:read','terminals:create','terminals:update','terminals:delete',
  'fleet:read','fleet:create','fleet:update','fleet:delete',
  'schedules:read','schedules:create','schedules:update','schedules:delete',
  'trips:read','trips:create','trips:update','trips:cancel',
  'bookings:read','bookings:update',
  'revenue:view','withdrawals:view',
  'staff:read','staff:invite','staff:update','staff:remove',
  'company:view','company:update'
]::TEXT[]
WHERE "deletedAt" IS NULL
  AND "role" = 'ADMIN'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

-- MANAGER template
UPDATE "operator"
SET "permissions" = ARRAY[
  'routes:read','routes:create','routes:update',
  'terminals:read','terminals:create','terminals:update',
  'fleet:read','fleet:create','fleet:update',
  'schedules:read','schedules:create','schedules:update',
  'trips:read','trips:create','trips:update','trips:cancel',
  'bookings:read','bookings:update',
  'staff:read','company:view'
]::TEXT[]
WHERE "deletedAt" IS NULL
  AND "role" = 'MANAGER'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

-- OPERATIONS template
UPDATE "operator"
SET "permissions" = ARRAY[
  'routes:read','terminals:read','fleet:read','schedules:read',
  'trips:read','trips:create','trips:update',
  'bookings:read','bookings:update'
]::TEXT[]
WHERE "deletedAt" IS NULL
  AND "role" = 'OPERATIONS'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

-- FINANCE template
UPDATE "operator"
SET "permissions" = ARRAY[
  'routes:read','revenue:view','withdrawals:view','company:view'
]::TEXT[]
WHERE "deletedAt" IS NULL
  AND "role" = 'FINANCE'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

-- SUPPORT template
UPDATE "operator"
SET "permissions" = ARRAY[
  'schedules:read','trips:read','bookings:read','bookings:update'
]::TEXT[]
WHERE "deletedAt" IS NULL
  AND "role" = 'SUPPORT'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

-- Pending invitations: seed permissions from role when empty
UPDATE "staff_invitation"
SET "permissions" = ARRAY[
  'routes:read','routes:create','routes:update','routes:delete',
  'terminals:read','terminals:create','terminals:update','terminals:delete',
  'fleet:read','fleet:create','fleet:update','fleet:delete',
  'schedules:read','schedules:create','schedules:update','schedules:delete',
  'trips:read','trips:create','trips:update','trips:cancel',
  'bookings:read','bookings:update',
  'revenue:view','withdrawals:view',
  'staff:read','staff:invite','staff:update','staff:remove',
  'company:view','company:update'
]::TEXT[]
WHERE "status" = 'PENDING' AND "role" = 'ADMIN'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

UPDATE "staff_invitation"
SET "permissions" = ARRAY[
  'routes:read','routes:create','routes:update',
  'terminals:read','terminals:create','terminals:update',
  'fleet:read','fleet:create','fleet:update',
  'schedules:read','schedules:create','schedules:update',
  'trips:read','trips:create','trips:update','trips:cancel',
  'bookings:read','bookings:update',
  'staff:read','company:view'
]::TEXT[]
WHERE "status" = 'PENDING' AND "role" = 'MANAGER'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

UPDATE "staff_invitation"
SET "permissions" = ARRAY[
  'routes:read','terminals:read','fleet:read','schedules:read',
  'trips:read','trips:create','trips:update',
  'bookings:read','bookings:update'
]::TEXT[]
WHERE "status" = 'PENDING' AND "role" = 'OPERATIONS'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

UPDATE "staff_invitation"
SET "permissions" = ARRAY[
  'routes:read','revenue:view','withdrawals:view','company:view'
]::TEXT[]
WHERE "status" = 'PENDING' AND "role" = 'FINANCE'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);

UPDATE "staff_invitation"
SET "permissions" = ARRAY[
  'schedules:read','trips:read','bookings:read','bookings:update'
]::TEXT[]
WHERE "status" = 'PENDING' AND "role" = 'SUPPORT'
  AND (cardinality("permissions") = 0 OR "permissions" IS NULL);
