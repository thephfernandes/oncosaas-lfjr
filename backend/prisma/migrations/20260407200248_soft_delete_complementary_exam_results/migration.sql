/*
  Warnings:

  - You are about to drop the `navigation_step_files` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "navigation_step_files" DROP CONSTRAINT "navigation_step_files_navigationStepId_fkey";

-- DropForeignKey
ALTER TABLE "navigation_step_files" DROP CONSTRAINT "navigation_step_files_tenantId_fkey";

-- AlterTable
ALTER TABLE "complementary_exam_results" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedByUserId" TEXT;

-- AlterTable
ALTER TABLE "complementary_exams" ADD COLUMN     "specimen" TEXT;

-- DropTable
DROP TABLE "navigation_step_files";

-- CreateIndex
CREATE INDEX "complementary_exam_results_tenantId_examId_deletedAt_idx" ON "complementary_exam_results"("tenantId", "examId", "deletedAt");

-- CreateIndex
CREATE INDEX "complementary_exam_results_tenantId_deletedAt_idx" ON "complementary_exam_results"("tenantId", "deletedAt");
