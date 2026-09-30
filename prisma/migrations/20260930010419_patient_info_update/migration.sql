-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');

-- CreateTable
CREATE TABLE "medical_reports" (
    "id" TEXT NOT NULL,
    "reportName" TEXT NOT NULL,
    "reportLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,

    CONSTRAINT "medical_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_health_data" (
    "id" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "hasAllergies" BOOLEAN NOT NULL DEFAULT false,
    "hasDiabetes" BOOLEAN NOT NULL DEFAULT false,
    "height" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "smokingStatus" BOOLEAN NOT NULL DEFAULT false,
    "dietaryPreferences" TEXT,
    "pregnancyStatus" BOOLEAN NOT NULL DEFAULT false,
    "mentalHealthHistory" TEXT,
    "immunizationStatus" TEXT,
    "hasPastSurgeries" BOOLEAN NOT NULL DEFAULT false,
    "recentAnxiety" BOOLEAN NOT NULL DEFAULT false,
    "recentDepression" BOOLEAN NOT NULL DEFAULT false,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT NOT NULL,

    CONSTRAINT "patient_health_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_health_data_patientId_key" ON "patient_health_data"("patientId");

-- AddForeignKey
ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_health_data" ADD CONSTRAINT "patient_health_data_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
