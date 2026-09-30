/*
  Warnings:

  - The primary key for the `doctor_schedules` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `doctor_schedules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "doctor_schedules" DROP CONSTRAINT "doctor_schedules_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "doctor_schedules_pkey" PRIMARY KEY ("doctorId", "scheduleId");

-- CreateIndex
CREATE INDEX "doctor_schedules_doctorId_idx" ON "doctor_schedules"("doctorId");

-- CreateIndex
CREATE INDEX "doctor_schedules_scheduleId_idx" ON "doctor_schedules"("scheduleId");
