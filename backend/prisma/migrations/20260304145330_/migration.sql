/*
  Warnings:

  - The values [APPOINTMENT_RECOMMENDED,SPECIALIST_HANDOFF] on the enum `AlertType` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPOINTMENT] on the enum `ScheduledActionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AlertType_new" AS ENUM ('CRITICAL_SYMPTOM', 'NO_RESPONSE', 'DELAYED_APPOINTMENT', 'SCORE_CHANGE', 'SYMPTOM_WORSENING', 'NAVIGATION_DELAY', 'MISSING_EXAM', 'STAGING_INCOMPLETE', 'TREATMENT_DELAY', 'FOLLOW_UP_OVERDUE', 'PALLIATIVE_SYMPTOM_WORSENING', 'PALLIATIVE_MEDICATION_ADJUSTMENT', 'PALLIATIVE_FAMILY_SUPPORT', 'PALLIATIVE_PSYCHOSOCIAL');
ALTER TABLE "alerts" ALTER COLUMN "type" TYPE "AlertType_new" USING ("type"::text::"AlertType_new");
ALTER TYPE "AlertType" RENAME TO "AlertType_old";
ALTER TYPE "AlertType_new" RENAME TO "AlertType";
DROP TYPE "AlertType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ScheduledActionType_new" AS ENUM ('CHECK_IN', 'QUESTIONNAIRE', 'MEDICATION_REMINDER', 'APPOINTMENT_REMINDER', 'FOLLOW_UP', 'VOICE_CALL');
ALTER TABLE "scheduled_actions" ALTER COLUMN "actionType" TYPE "ScheduledActionType_new" USING ("actionType"::text::"ScheduledActionType_new");
ALTER TYPE "ScheduledActionType" RENAME TO "ScheduledActionType_old";
ALTER TYPE "ScheduledActionType_new" RENAME TO "ScheduledActionType";
DROP TYPE "ScheduledActionType_old";
COMMIT;

-- DropIndex
DROP INDEX "patients_tenantId_phoneHash_idx";
