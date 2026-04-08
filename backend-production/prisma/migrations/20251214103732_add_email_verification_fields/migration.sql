-- AlterTable
ALTER TABLE `users` ADD COLUMN `token_expiry` DATETIME(3) NULL,
    ADD COLUMN `verification_token` VARCHAR(255) NULL;
