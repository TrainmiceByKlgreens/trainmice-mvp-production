-- Migrate existing feedback data to new schema structure
-- Step 1: Add new columns
ALTER TABLE `feedbacks` 
    ADD COLUMN `attendance` VARCHAR(191) NULL AFTER `participant_name`,
    ADD COLUMN `content_clarity` INTEGER NULL AFTER `attendance`,
    ADD COLUMN `course_duration` VARCHAR(191) NULL AFTER `attendance`,
    ADD COLUMN `duration_suitable` INTEGER NULL AFTER `content_clarity`,
    ADD COLUMN `future_training_topics` TEXT NULL,
    ADD COLUMN `improvement_suggestion` TEXT NULL,
    ADD COLUMN `inhouse_training_needs` TEXT NULL,
    ADD COLUMN `knowledge_application` INTEGER NULL,
    ADD COLUMN `knowledge_exposure` INTEGER NULL,
    ADD COLUMN `learning_environment` INTEGER NULL,
    ADD COLUMN `liked_most` TEXT NULL,
    ADD COLUMN `materials_helpful` INTEGER NULL,
    ADD COLUMN `objectives_achieved` INTEGER NULL,
    ADD COLUMN `recommend_colleagues` BOOLEAN NULL,
    ADD COLUMN `recommend_course` INTEGER NULL,
    ADD COLUMN `referral_details` TEXT NULL,
    ADD COLUMN `trainer_engagement` INTEGER NULL,
    ADD COLUMN `trainer_knowledge` INTEGER NULL;

-- Step 2: Migrate data from old columns to new columns
UPDATE `feedbacks` SET
    `content_clarity` = `q_content_clarity`,
    `objectives_achieved` = `q_objectives_achieved`,
    `materials_helpful` = `q_materials_helpful`,
    `learning_environment` = `q_environment_learning`,
    `trainer_knowledge` = `q_trainer_knowledge`,
    `trainer_engagement` = `q_engagement`,
    `knowledge_exposure` = `q_new_knowledge`,
    `knowledge_application` = `q_application_understanding`,
    `recommend_course` = `q_recommend_course`,
    `liked_most` = `positive_feedback`,
    `improvement_suggestion` = `improvement_feedback`,
    `future_training_topics` = `requested_topics`,
    `referral_details` = `referrals`,
    `course_duration` = `attendance_duration`
WHERE `q_content_clarity` IS NOT NULL 
   OR `q_objectives_achieved` IS NOT NULL 
   OR `q_materials_helpful` IS NOT NULL
   OR `positive_feedback` IS NOT NULL
   OR `improvement_feedback` IS NOT NULL;

-- Step 3: Drop old columns
ALTER TABLE `feedbacks` 
    DROP COLUMN `attendance_duration`,
    DROP COLUMN `improvement_feedback`,
    DROP COLUMN `positive_feedback`,
    DROP COLUMN `q_application_understanding`,
    DROP COLUMN `q_content_clarity`,
    DROP COLUMN `q_engagement`,
    DROP COLUMN `q_environment_learning`,
    DROP COLUMN `q_materials_helpful`,
    DROP COLUMN `q_new_knowledge`,
    DROP COLUMN `q_objectives_achieved`,
    DROP COLUMN `q_recommend_course`,
    DROP COLUMN `q_trainer_knowledge`,
    DROP COLUMN `referrals`,
    DROP COLUMN `requested_topics`,
    DROP COLUMN `trainer_name`;
