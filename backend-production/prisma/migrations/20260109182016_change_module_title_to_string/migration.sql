-- Convert module_title from JSON to VARCHAR
-- For existing data: if it's an array, take the first element; if it's a string, use it directly
-- Note: This migration assumes existing data. For arrays, we'll take the first element.
-- After migration, you may need to manually split arrays into multiple rows if needed.

-- Step 1: Add a temporary column
ALTER TABLE `course_schedule` ADD COLUMN `module_title_temp` VARCHAR(500) NULL;

-- Step 2: Convert JSON to String
-- Handle both array and string formats
UPDATE `course_schedule` 
SET `module_title_temp` = CASE
  WHEN JSON_TYPE(`module_title`) = 'ARRAY' THEN 
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`module_title`, '$[0]')), '')
  WHEN JSON_TYPE(`module_title`) = 'STRING' THEN 
    JSON_UNQUOTE(`module_title`)
  ELSE ''
END
WHERE `module_title` IS NOT NULL;

-- Step 3: Drop old column and rename temp column
ALTER TABLE `course_schedule` DROP COLUMN `module_title`;
ALTER TABLE `course_schedule` CHANGE COLUMN `module_title_temp` `module_title` VARCHAR(500) NOT NULL;

