-- AlterTable
ALTER TABLE `booking_requests` ADD COLUMN `trainer_availability_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `booking_requests_trainer_availability_id_idx` ON `booking_requests`(`trainer_availability_id`);

-- AddForeignKey
ALTER TABLE `booking_requests` ADD CONSTRAINT `booking_requests_trainer_availability_id_fkey` FOREIGN KEY (`trainer_availability_id`) REFERENCES `trainer_availability`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
