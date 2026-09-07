-- DropForeignKey
ALTER TABLE "patient" DROP CONSTRAINT "patient_userId_fkey";

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
