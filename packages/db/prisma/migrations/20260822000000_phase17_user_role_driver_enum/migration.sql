-- Phase 17 (D2b): introduce UserRole.DRIVER for operator-added driver accounts.
-- Split into its own migration because PostgreSQL forbids *using* a newly added
-- enum value inside the same transaction that adds it.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DRIVER';
