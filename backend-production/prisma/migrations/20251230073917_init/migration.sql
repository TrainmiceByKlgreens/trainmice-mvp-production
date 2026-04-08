/*
  Warnings:

  - The values [ACTIVE,COMPLETED,CANCELLED] on the enum `courses_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `courses` MODIFY `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED') NOT NULL DEFAULT 'DRAFT';
