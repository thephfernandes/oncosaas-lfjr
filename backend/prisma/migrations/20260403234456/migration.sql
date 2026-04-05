/*
  Warnings:

  - You are about to drop the `navigation_step_files` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "navigation_step_files" DROP CONSTRAINT "navigation_step_files_navigationStepId_fkey";

-- DropForeignKey
ALTER TABLE "navigation_step_files" DROP CONSTRAINT "navigation_step_files_tenantId_fkey";

-- DropTable
DROP TABLE "navigation_step_files";
