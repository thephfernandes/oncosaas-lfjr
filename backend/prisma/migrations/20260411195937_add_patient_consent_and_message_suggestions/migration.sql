-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EDITED', 'REJECTED');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "suggestedResponse" TEXT,
ADD COLUMN     "suggestionStatus" "SuggestionStatus";

-- CreateTable
CREATE TABLE "patient_consents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_consents_tenantId_idx" ON "patient_consents"("tenantId");

-- CreateIndex
CREATE INDEX "patient_consents_patientId_idx" ON "patient_consents"("patientId");

-- AddForeignKey
ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
