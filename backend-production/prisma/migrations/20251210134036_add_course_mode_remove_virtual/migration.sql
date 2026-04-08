-- Migration: Add courseMode field and remove VIRTUAL from CourseType enum
-- This migration handles data transformation for existing VIRTUAL courses

-- Step 1: Add courseMode column to courses table with default value
ALTER TABLE `courses` ADD COLUMN `course_mode` ENUM('PHYSICAL', 'VIRTUAL', 'BOTH') NOT NULL DEFAULT 'PHYSICAL';

-- Step 2: Add courseMode column to events table with default value
ALTER TABLE `events` ADD COLUMN `course_mode` ENUM('PHYSICAL', 'VIRTUAL', 'BOTH') NOT NULL DEFAULT 'PHYSICAL';

-- Step 3: Update existing courses with VIRTUAL courseType
-- Set courseMode to VIRTUAL and change courseType to PUBLIC (virtual courses are typically public)
UPDATE `courses` 
SET `course_mode` = 'VIRTUAL', `course_type` = 'PUBLIC'
WHERE `course_type` = 'VIRTUAL';

-- Step 4: Update existing events with VIRTUAL courseType
-- Set courseMode to VIRTUAL and change courseType to PUBLIC
UPDATE `events` 
SET `course_mode` = 'VIRTUAL', `course_type` = 'PUBLIC'
WHERE `course_type` = 'VIRTUAL';

-- Step 5: Add index on courseMode for courses
CREATE INDEX `courses_course_mode_idx` ON `courses`(`course_mode`);

-- Step 6: Modify CourseType enum to remove VIRTUAL
-- Note: MySQL doesn't support direct enum modification, so we need to:
-- 1. Add a temporary column with new enum
-- 2. Copy data
-- 3. Drop old column
-- 4. Rename new column

-- For courses table
ALTER TABLE `courses` ADD COLUMN `course_type_new` ENUM('IN_HOUSE', 'PUBLIC') NOT NULL DEFAULT 'IN_HOUSE';
UPDATE `courses` SET `course_type_new` = `course_type` WHERE `course_type` IN ('IN_HOUSE', 'PUBLIC');
ALTER TABLE `courses` DROP COLUMN `course_type`;
ALTER TABLE `courses` CHANGE COLUMN `course_type_new` `course_type` ENUM('IN_HOUSE', 'PUBLIC') NOT NULL DEFAULT 'IN_HOUSE';

-- For events table
ALTER TABLE `events` ADD COLUMN `course_type_new` ENUM('IN_HOUSE', 'PUBLIC') NOT NULL DEFAULT 'IN_HOUSE';
UPDATE `events` SET `course_type_new` = `course_type` WHERE `course_type` IN ('IN_HOUSE', 'PUBLIC');
ALTER TABLE `events` DROP COLUMN `course_type`;
ALTER TABLE `events` CHANGE COLUMN `course_type_new` `course_type` ENUM('IN_HOUSE', 'PUBLIC') NOT NULL DEFAULT 'IN_HOUSE';

