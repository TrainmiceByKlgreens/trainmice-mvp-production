/*
  Warnings:

  - You are about to drop the column `submoduleTitle` on the `course_schedule` table. All the data in the column will be lost.
  - You are about to alter the column `module_title` on the `course_schedule` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `course_schedule` DROP COLUMN `submoduleTitle`,
    ADD COLUMN `submodule_title` JSON NULL,
    MODIFY `module_title` JSON NOT NULL;
