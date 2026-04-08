-- CreateTable
CREATE TABLE `message_threads` (
    `id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `last_message` VARCHAR(191) NULL,
    `last_message_time` DATETIME(3) NULL,
    `last_message_by` VARCHAR(191) NULL,
    `unread_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `message_threads_trainer_id_idx`(`trainer_id`),
    INDEX `message_threads_last_message_time_idx`(`last_message_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `thread_id` VARCHAR(191) NOT NULL,
    `sender_type` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_thread_id_idx`(`thread_id`),
    INDEX `messages_sender_type_sender_id_idx`(`sender_type`, `sender_id`),
    INDEX `messages_created_at_idx`(`created_at`),
    INDEX `messages_is_read_idx`(`is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_enquiries` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `subject` VARCHAR(191) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_enquiries_event_id_idx`(`event_id`),
    INDEX `event_enquiries_trainer_id_idx`(`trainer_id`),
    INDEX `event_enquiries_is_read_idx`(`is_read`),
    INDEX `event_enquiries_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `message_threads` ADD CONSTRAINT `message_threads_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_thread_id_fkey` FOREIGN KEY (`thread_id`) REFERENCES `message_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_enquiries` ADD CONSTRAINT `event_enquiries_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_enquiries` ADD CONSTRAINT `event_enquiries_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
