-- CreateTable
CREATE TABLE `clients_reference` (
    `id` VARCHAR(191) NOT NULL,
    `company_name` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `state` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `pic_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `contact_number` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clients_reference_email_idx`(`email`),
    INDEX `clients_reference_company_name_idx`(`company_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `event_registrations` ADD COLUMN `clients_reference_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `event_registrations_clients_reference_id_idx` ON `event_registrations`(`clients_reference_id`);

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_clients_reference_id_fkey` FOREIGN KEY (`clients_reference_id`) REFERENCES `clients_reference`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


