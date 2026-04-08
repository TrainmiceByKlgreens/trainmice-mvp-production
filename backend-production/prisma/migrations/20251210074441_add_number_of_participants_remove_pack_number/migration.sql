-- DropIndex
DROP INDEX `event_registrations_event_id_pack_number_key` ON `event_registrations`;

-- AlterTable
ALTER TABLE `courses` ALTER COLUMN `course_type` DROP DEFAULT;

-- AlterTable: Add number_of_participants and make pack_number nullable
ALTER TABLE `event_registrations` ADD COLUMN `number_of_participants` INTEGER NOT NULL DEFAULT 1,
    MODIFY `pack_number` INTEGER NULL;

-- Update existing registrations: set numberOfParticipants = 1 (each existing registration represents 1 participant)
UPDATE `event_registrations` SET `number_of_participants` = 1 WHERE `number_of_participants` IS NULL;

-- AlterTable
ALTER TABLE `events` ALTER COLUMN `course_type` DROP DEFAULT;
