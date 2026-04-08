-- Migration: Convert course_type and course_mode from ENUM to JSON arrays
-- Add professional development points fields
-- Update certificate field to support new options

-- Step 1: Add new columns for professional development points
ALTER TABLE `courses` ADD COLUMN `professional_development_points` VARCHAR(191) NULL;
ALTER TABLE `courses` ADD COLUMN `professional_development_points_other` TEXT NULL;
ALTER TABLE `events` ADD COLUMN `professional_development_points` VARCHAR(191) NULL;
ALTER TABLE `events` ADD COLUMN `professional_development_points_other` TEXT NULL;

-- Step 2: Convert course_type from ENUM to JSON for courses table
-- First, add a temporary JSON column
ALTER TABLE `courses` ADD COLUMN `course_type_json` JSON NULL;

-- Convert existing ENUM values to JSON arrays
UPDATE `courses` SET `course_type_json` = JSON_ARRAY(`course_type`) WHERE `course_type` IS NOT NULL;

-- Drop the old enum column and its index
DROP INDEX `courses_course_type_idx` ON `courses`;
ALTER TABLE `courses` DROP COLUMN `course_type`;

-- Rename the JSON column
ALTER TABLE `courses` CHANGE COLUMN `course_type_json` `course_type` JSON NULL DEFAULT (JSON_ARRAY());

-- Step 3: Convert course_mode from ENUM to JSON for courses table
-- First, add a temporary JSON column
ALTER TABLE `courses` ADD COLUMN `course_mode_json` JSON NULL;

-- Convert existing ENUM values to JSON arrays and change BOTH to HYBRID
UPDATE `courses` SET `course_mode_json` = CASE
  WHEN `course_mode` = 'BOTH' THEN JSON_ARRAY('PHYSICAL', 'ONLINE', 'HYBRID')
  WHEN `course_mode` = 'VIRTUAL' THEN JSON_ARRAY('ONLINE')
  ELSE JSON_ARRAY(`course_mode`)
END WHERE `course_mode` IS NOT NULL;

-- Drop the old enum column and its index
DROP INDEX `courses_course_mode_idx` ON `courses`;
ALTER TABLE `courses` DROP COLUMN `course_mode`;

-- Rename the JSON column
ALTER TABLE `courses` CHANGE COLUMN `course_mode_json` `course_mode` JSON NULL DEFAULT (JSON_ARRAY());

-- Step 4: Convert course_type from ENUM to JSON for events table
ALTER TABLE `events` ADD COLUMN `course_type_json` JSON NULL;

-- Convert existing ENUM values to JSON arrays
UPDATE `events` SET `course_type_json` = JSON_ARRAY(`course_type`) WHERE `course_type` IS NOT NULL;

-- Drop the old enum column
ALTER TABLE `events` DROP COLUMN `course_type`;

-- Rename the JSON column
ALTER TABLE `events` CHANGE COLUMN `course_type_json` `course_type` JSON NULL DEFAULT (JSON_ARRAY());

-- Step 5: Convert course_mode from ENUM to JSON for events table
ALTER TABLE `events` ADD COLUMN `course_mode_json` JSON NULL;

-- Convert existing ENUM values to JSON arrays and change BOTH to HYBRID, VIRTUAL to ONLINE
UPDATE `events` SET `course_mode_json` = CASE
  WHEN `course_mode` = 'BOTH' THEN JSON_ARRAY('PHYSICAL', 'ONLINE', 'HYBRID')
  WHEN `course_mode` = 'VIRTUAL' THEN JSON_ARRAY('ONLINE')
  ELSE JSON_ARRAY(`course_mode`)
END WHERE `course_mode` IS NOT NULL;

-- Drop the old enum column
ALTER TABLE `events` DROP COLUMN `course_mode`;

-- Rename the JSON column
ALTER TABLE `events` CHANGE COLUMN `course_mode_json` `course_mode` JSON NULL DEFAULT (JSON_ARRAY());
