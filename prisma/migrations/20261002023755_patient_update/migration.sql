-- AlterTable
ALTER TABLE "patient_health_data" ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "dateOfBirth" DROP NOT NULL,
ALTER COLUMN "bloodGroup" DROP NOT NULL,
ALTER COLUMN "maritalStatus" DROP NOT NULL;
