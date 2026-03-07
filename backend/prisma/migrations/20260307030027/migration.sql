/*
  Warnings:

  - You are about to drop the column `conversation_id` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `corrected_by` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `corrected_disposition` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `correction_reason` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `feature_snapshot` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `patient_id` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `predicted_disposition` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `prediction_confidence` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `prediction_source` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `rules_findings` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `clinical_disposition_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `affects_pulmonary_reserve` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `affects_renal_clearance` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosed_at` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `increases_bleeding_risk` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `increases_sepsis_risk` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `increases_thrombosis_risk` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `patient_id` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `comorbidities` table. All the data in the column will be lost.
  - You are about to drop the column `collection_id` on the `complementary_exam_results` table. All the data in the column will be lost.
  - You are about to drop the column `critical_high` on the `complementary_exam_results` table. All the data in the column will be lost.
  - You are about to drop the column `critical_low` on the `complementary_exam_results` table. All the data in the column will be lost.
  - You are about to drop the column `is_critical_metric` on the `complementary_exams` table. All the data in the column will be lost.
  - You are about to drop the column `lab_category` on the `complementary_exams` table. All the data in the column will be lost.
  - You are about to drop the column `loinc_code` on the `complementary_exams` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `emergency_references` table. All the data in the column will be lost.
  - You are about to drop the column `distance_km` on the `emergency_references` table. All the data in the column will be lost.
  - You are about to drop the column `has_hematology_er` on the `emergency_references` table. All the data in the column will be lost.
  - You are about to drop the column `has_oncology_er` on the `emergency_references` table. All the data in the column will be lost.
  - You are about to drop the column `hospital_name` on the `emergency_references` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `emergency_references` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `emergency_references` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `is_anticoagulant` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `is_antiplatelet` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `is_corticosteroid` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `is_growth_factor` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `is_immunosuppressant` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `is_nsaid` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `is_opioid` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `patient_id` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `clinical_disposition` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `clinical_disposition_at` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `clinical_disposition_reason` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `currentMedications` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_emergency_hospital` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `assessed_at` on the `performance_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `assessed_by` on the `performance_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `performance_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `ecog_score` on the `performance_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `patient_id` on the `performance_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `performance_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `last_application_date` on the `treatments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId]` on the table `emergency_references` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `correctedBy` to the `clinical_disposition_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correctedDisposition` to the `clinical_disposition_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `featureSnapshot` to the `clinical_disposition_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `clinical_disposition_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `predictedDisposition` to the `clinical_disposition_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `predictionSource` to the `clinical_disposition_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `clinical_disposition_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `comorbidities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `comorbidities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `comorbidities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalName` to the `emergency_references` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `emergency_references` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `emergency_references` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `medications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `medications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `medications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ecogScore` to the `performance_status_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `performance_status_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `performance_status_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "clinical_disposition_feedback" DROP CONSTRAINT "clinical_disposition_feedback_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "clinical_disposition_feedback" DROP CONSTRAINT "clinical_disposition_feedback_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "comorbidities" DROP CONSTRAINT "comorbidities_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "comorbidities" DROP CONSTRAINT "comorbidities_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "emergency_references" DROP CONSTRAINT "emergency_references_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "medications" DROP CONSTRAINT "medications_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "medications" DROP CONSTRAINT "medications_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "performance_status_history" DROP CONSTRAINT "performance_status_history_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "performance_status_history" DROP CONSTRAINT "performance_status_history_tenant_id_fkey";

-- DropIndex
DROP INDEX "clinical_disposition_feedback_corrected_idx";

-- DropIndex
DROP INDEX "clinical_disposition_feedback_created_at_idx";

-- DropIndex
DROP INDEX "clinical_disposition_feedback_patient_id_idx";

-- DropIndex
DROP INDEX "clinical_disposition_feedback_predicted_idx";

-- DropIndex
DROP INDEX "clinical_disposition_feedback_tenant_id_idx";

-- DropIndex
DROP INDEX "comorbidities_increases_sepsis_risk_idx";

-- DropIndex
DROP INDEX "comorbidities_patient_id_idx";

-- DropIndex
DROP INDEX "comorbidities_tenant_id_idx";

-- DropIndex
DROP INDEX "emergency_references_tenant_id_key";

-- DropIndex
DROP INDEX "medications_is_active_idx";

-- DropIndex
DROP INDEX "medications_is_anticoagulant_idx";

-- DropIndex
DROP INDEX "medications_is_corticosteroid_idx";

-- DropIndex
DROP INDEX "medications_is_immunosuppressant_idx";

-- DropIndex
DROP INDEX "medications_patient_id_idx";

-- DropIndex
DROP INDEX "medications_tenant_id_idx";

-- DropIndex
DROP INDEX "performance_status_history_assessed_at_idx";

-- DropIndex
DROP INDEX "performance_status_history_patient_id_idx";

-- DropIndex
DROP INDEX "performance_status_history_tenant_id_idx";

-- AlterTable
ALTER TABLE "clinical_disposition_feedback" DROP COLUMN "conversation_id",
DROP COLUMN "corrected_by",
DROP COLUMN "corrected_disposition",
DROP COLUMN "correction_reason",
DROP COLUMN "created_at",
DROP COLUMN "feature_snapshot",
DROP COLUMN "patient_id",
DROP COLUMN "predicted_disposition",
DROP COLUMN "prediction_confidence",
DROP COLUMN "prediction_source",
DROP COLUMN "rules_findings",
DROP COLUMN "tenant_id",
ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "correctedBy" TEXT NOT NULL,
ADD COLUMN     "correctedDisposition" "ClinicalDisposition" NOT NULL,
ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "featureSnapshot" JSONB NOT NULL,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "predictedDisposition" "ClinicalDisposition" NOT NULL,
ADD COLUMN     "predictionConfidence" DOUBLE PRECISION,
ADD COLUMN     "predictionSource" TEXT NOT NULL,
ADD COLUMN     "rulesFindings" JSONB,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "comorbidities" DROP COLUMN "affects_pulmonary_reserve",
DROP COLUMN "affects_renal_clearance",
DROP COLUMN "created_at",
DROP COLUMN "diagnosed_at",
DROP COLUMN "increases_bleeding_risk",
DROP COLUMN "increases_sepsis_risk",
DROP COLUMN "increases_thrombosis_risk",
DROP COLUMN "patient_id",
DROP COLUMN "tenant_id",
DROP COLUMN "updated_at",
ADD COLUMN     "affectsPulmonaryReserve" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "affectsRenalClearance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diagnosedAt" TIMESTAMP(3),
ADD COLUMN     "increasesBleedingRisk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "increasesSepsisRisk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "increasesThrombosisRisk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "complementary_exam_results" DROP COLUMN "collection_id",
DROP COLUMN "critical_high",
DROP COLUMN "critical_low",
ADD COLUMN     "collectionId" TEXT,
ADD COLUMN     "criticalHigh" BOOLEAN,
ADD COLUMN     "criticalLow" BOOLEAN;

-- AlterTable
ALTER TABLE "complementary_exams" DROP COLUMN "is_critical_metric",
DROP COLUMN "lab_category",
DROP COLUMN "loinc_code",
ADD COLUMN     "isCriticalMetric" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "labCategory" "LabCategory",
ADD COLUMN     "loincCode" TEXT;

-- AlterTable
ALTER TABLE "emergency_references" DROP COLUMN "created_at",
DROP COLUMN "distance_km",
DROP COLUMN "has_hematology_er",
DROP COLUMN "has_oncology_er",
DROP COLUMN "hospital_name",
DROP COLUMN "tenant_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "hasHematologyER" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasOncologyER" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hospitalName" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "medications" DROP COLUMN "created_at",
DROP COLUMN "end_date",
DROP COLUMN "is_active",
DROP COLUMN "is_anticoagulant",
DROP COLUMN "is_antiplatelet",
DROP COLUMN "is_corticosteroid",
DROP COLUMN "is_growth_factor",
DROP COLUMN "is_immunosuppressant",
DROP COLUMN "is_nsaid",
DROP COLUMN "is_opioid",
DROP COLUMN "patient_id",
DROP COLUMN "start_date",
DROP COLUMN "tenant_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isAnticoagulant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAntiplatelet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCorticosteroid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGrowthFactor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isImmunosuppressant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNSAID" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOpioid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "clinical_disposition",
DROP COLUMN "clinical_disposition_at",
DROP COLUMN "clinical_disposition_reason",
DROP COLUMN "currentMedications",
DROP COLUMN "preferred_emergency_hospital",
ADD COLUMN     "clinicalDisposition" "ClinicalDisposition",
ADD COLUMN     "clinicalDispositionAt" TIMESTAMP(3),
ADD COLUMN     "clinicalDispositionReason" TEXT,
ADD COLUMN     "preferredEmergencyHospital" TEXT;

-- AlterTable
ALTER TABLE "performance_status_history" DROP COLUMN "assessed_at",
DROP COLUMN "assessed_by",
DROP COLUMN "created_at",
DROP COLUMN "ecog_score",
DROP COLUMN "patient_id",
DROP COLUMN "tenant_id",
ADD COLUMN     "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assessedBy" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ecogScore" INTEGER NOT NULL,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "treatments" DROP COLUMN "last_application_date",
ADD COLUMN     "lastApplicationDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "clinical_disposition_feedback_tenantId_idx" ON "clinical_disposition_feedback"("tenantId");

-- CreateIndex
CREATE INDEX "clinical_disposition_feedback_patientId_idx" ON "clinical_disposition_feedback"("patientId");

-- CreateIndex
CREATE INDEX "clinical_disposition_feedback_predictedDisposition_idx" ON "clinical_disposition_feedback"("predictedDisposition");

-- CreateIndex
CREATE INDEX "clinical_disposition_feedback_correctedDisposition_idx" ON "clinical_disposition_feedback"("correctedDisposition");

-- CreateIndex
CREATE INDEX "clinical_disposition_feedback_createdAt_idx" ON "clinical_disposition_feedback"("createdAt");

-- CreateIndex
CREATE INDEX "comorbidities_tenantId_idx" ON "comorbidities"("tenantId");

-- CreateIndex
CREATE INDEX "comorbidities_patientId_idx" ON "comorbidities"("patientId");

-- CreateIndex
CREATE INDEX "comorbidities_increasesSepsisRisk_idx" ON "comorbidities"("increasesSepsisRisk");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_references_tenantId_key" ON "emergency_references"("tenantId");

-- CreateIndex
CREATE INDEX "medications_tenantId_idx" ON "medications"("tenantId");

-- CreateIndex
CREATE INDEX "medications_patientId_idx" ON "medications"("patientId");

-- CreateIndex
CREATE INDEX "medications_isActive_idx" ON "medications"("isActive");

-- CreateIndex
CREATE INDEX "medications_isAnticoagulant_idx" ON "medications"("isAnticoagulant");

-- CreateIndex
CREATE INDEX "medications_isCorticosteroid_idx" ON "medications"("isCorticosteroid");

-- CreateIndex
CREATE INDEX "medications_isImmunosuppressant_idx" ON "medications"("isImmunosuppressant");

-- CreateIndex
CREATE INDEX "performance_status_history_tenantId_idx" ON "performance_status_history"("tenantId");

-- CreateIndex
CREATE INDEX "performance_status_history_patientId_idx" ON "performance_status_history"("patientId");

-- CreateIndex
CREATE INDEX "performance_status_history_assessedAt_idx" ON "performance_status_history"("assessedAt");

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comorbidities" ADD CONSTRAINT "comorbidities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comorbidities" ADD CONSTRAINT "comorbidities_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_status_history" ADD CONSTRAINT "performance_status_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_status_history" ADD CONSTRAINT "performance_status_history_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_references" ADD CONSTRAINT "emergency_references_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_disposition_feedback" ADD CONSTRAINT "clinical_disposition_feedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_disposition_feedback" ADD CONSTRAINT "clinical_disposition_feedback_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
