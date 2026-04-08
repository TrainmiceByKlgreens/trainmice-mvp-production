-- AlterTable
ALTER TABLE `event_enquiries` ADD COLUMN `last_message_by` VARCHAR(191) NULL,
    ADD COLUMN `last_message_time` DATETIME(3) NULL,
    ADD COLUMN `unread_count` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `event_enquiry_messages` (
    `id` VARCHAR(191) NOT NULL,
    `enquiry_id` VARCHAR(191) NOT NULL,
    `sender_type` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_enquiry_messages_enquiry_id_idx`(`enquiry_id`),
    INDEX `event_enquiry_messages_sender_type_sender_id_idx`(`sender_type`, `sender_id`),
    INDEX `event_enquiry_messages_created_at_idx`(`created_at`),
    INDEX `event_enquiry_messages_is_read_idx`(`is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `event_enquiries_unread_count_idx` ON `event_enquiries`(`unread_count`);

-- AddForeignKey
ALTER TABLE `event_enquiry_messages` ADD CONSTRAINT `event_enquiry_messages_enquiry_id_fkey` FOREIGN KEY (`enquiry_id`) REFERENCES `event_enquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
