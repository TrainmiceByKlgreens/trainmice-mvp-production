-- AlterTable
ALTER TABLE `feedbacks` ADD COLUMN `event_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `event_code` VARCHAR(191) NULL,
    `trainer_id` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `learning_objectives` JSON NULL,
    `learning_outcomes` JSON NULL,
    `target_audience` TEXT NULL,
    `methodology` TEXT NULL,
    `prerequisite` TEXT NULL,
    `certificate` VARCHAR(191) NULL,
    `assessment` BOOLEAN NOT NULL DEFAULT false,
    `course_type` ENUM('IN_HOUSE', 'PUBLIC', 'VIRTUAL') NOT NULL,
    `duration_hours` INTEGER NOT NULL,
    `duration_unit` VARCHAR(191) NULL DEFAULT 'hours',
    `modules` JSON NULL,
    `venue` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NULL,
    `event_date` DATE NOT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `category` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `hrdc_claimable` BOOLEAN NOT NULL DEFAULT false,
    `brochure_url` TEXT NULL,
    `course_sequence` INTEGER NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `max_packs` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `events_event_code_key`(`event_code`),
    INDEX `events_trainer_id_idx`(`trainer_id`),
    INDEX `events_course_id_idx`(`course_id`),
    INDEX `events_event_date_idx`(`event_date`),
    INDEX `events_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NULL,
    `client_name` VARCHAR(191) NULL,
    `client_email` VARCHAR(191) NULL,
    `pack_number` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'REGISTERED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_registrations_event_id_idx`(`event_id`),
    INDEX `event_registrations_client_id_idx`(`client_id`),
    UNIQUE INDEX `event_registrations_event_id_pack_number_key`(`event_id`, `pack_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `courses_fixed_date_idx` ON `courses`(`fixed_date`);

-- CreateIndex
CREATE INDEX `feedbacks_event_id_idx` ON `feedbacks`(`event_id`);

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
