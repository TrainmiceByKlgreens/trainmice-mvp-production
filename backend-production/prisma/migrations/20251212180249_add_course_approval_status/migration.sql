-- AlterTable
ALTER TABLE `courses` MODIFY `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    ALTER COLUMN `course_type` DROP DEFAULT;

-- AlterTable
ALTER TABLE `events` MODIFY `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    ALTER COLUMN `course_type` DROP DEFAULT;

-- Update existing courses created by trainers that are ACTIVE to PENDING_APPROVAL if they weren't created by admin
UPDATE `courses` SET `status` = 'PENDING_APPROVAL' WHERE `status` = 'ACTIVE' AND `created_by_admin` = false;

-- CreateIndex
CREATE INDEX `courses_course_type_idx` ON `courses`(`course_type`);
