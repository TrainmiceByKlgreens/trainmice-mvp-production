ALTER TABLE `trainers`
    ADD COLUMN `profile_approval_status` ENUM('PENDING_APPROVAL', 'APPROVED', 'DENIED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    ADD COLUMN `profile_approval_notes` TEXT NULL,
    ADD COLUMN `profile_approval_updated_at` DATETIME(3) NULL,
    ADD COLUMN `profile_approved_at` DATETIME(3) NULL,
    ADD COLUMN `profile_approved_by` VARCHAR(191) NULL;

UPDATE `trainers`
SET
    `profile_approval_status` = 'APPROVED',
    `profile_approval_updated_at` = NOW(),
    `profile_approved_at` = NOW()
WHERE `profile_approval_status` = 'PENDING_APPROVAL';
