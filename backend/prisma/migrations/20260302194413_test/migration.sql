-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertType" ADD VALUE 'APPOINTMENT_RECOMMENDED';
ALTER TYPE "AlertType" ADD VALUE 'SPECIALIST_HANDOFF';

-- AlterEnum
ALTER TYPE "ScheduledActionType" ADD VALUE 'APPOINTMENT';

-- CreateIndex
CREATE INDEX "navigation_steps_completedAt_idx" ON "navigation_steps"("completedAt");
