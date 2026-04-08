-- CreateEventStatusEnum
-- This migration adds EventStatus enum and updates Event model to use it instead of CourseStatus
-- Events should only have ACTIVE, COMPLETED, CANCELLED statuses (no DRAFT, PENDING_APPROVAL, APPROVED)
-- 
-- This migration runs after the events table has been created (20251207160821)

-- Step 1: Migrate existing event statuses to valid EventStatus values
-- DRAFT -> ACTIVE (events created by admin should be active)
-- PENDING_APPROVAL -> ACTIVE (events don't need approval)
-- APPROVED -> ACTIVE (events don't need approval)
-- ACTIVE -> ACTIVE (no change)
-- COMPLETED -> COMPLETED (no change)
-- CANCELLED -> CANCELLED (no change)

UPDATE `events` 
SET `status` = CASE 
  WHEN `status` = 'DRAFT' THEN 'ACTIVE'
  WHEN `status` = 'PENDING_APPROVAL' THEN 'ACTIVE'
  WHEN `status` = 'APPROVED' THEN 'ACTIVE'
  WHEN `status` = 'ACTIVE' THEN 'ACTIVE'
  WHEN `status` = 'COMPLETED' THEN 'COMPLETED'
  WHEN `status` = 'CANCELLED' THEN 'CANCELLED'
  ELSE 'ACTIVE'
END
WHERE `status` IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- Step 2: Modify the status column to use EventStatus enum
-- MySQL doesn't support changing enum types directly, so we need to:
-- 1. Add a temporary column with the new enum
-- 2. Copy and validate data
-- 3. Drop old column
-- 4. Rename new column

-- Add temporary column with EventStatus enum
ALTER TABLE `events` 
ADD COLUMN `status_new` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE' AFTER `status`;

-- Copy data (already normalized to valid values from Step 1)
UPDATE `events` 
SET `status_new` = CASE 
  WHEN `status` = 'ACTIVE' THEN 'ACTIVE'
  WHEN `status` = 'COMPLETED' THEN 'COMPLETED'
  WHEN `status` = 'CANCELLED' THEN 'CANCELLED'
  ELSE 'ACTIVE'
END;

-- Drop old column (this will remove the CourseStatus enum reference)
ALTER TABLE `events` DROP COLUMN `status`;

-- Rename new column to status
ALTER TABLE `events` CHANGE COLUMN `status_new` `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';

