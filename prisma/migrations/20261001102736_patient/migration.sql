/*
  Warnings:

  - You are about to drop the column `height` on the `patient_health_data` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `patient_health_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "patient_health_data" DROP COLUMN "height",
DROP COLUMN "weight",
ADD COLUMN     "heightCm" DECIMAL(5,2),
ADD COLUMN     "weightKg" DECIMAL(5,2);
