-- AlterTable
ALTER TABLE "monthly_reports" ADD COLUMN     "feedback" TEXT;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
