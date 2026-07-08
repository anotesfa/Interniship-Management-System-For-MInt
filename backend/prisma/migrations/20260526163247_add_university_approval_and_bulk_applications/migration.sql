/*
  Warnings:

  - You are about to drop the column `attendance_rating` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `communication_rating` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `initiative_rating` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `teamwork_rating` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `technical_rating` on the `evaluations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[internship_id,month,year]` on the table `attendance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `month` to the `attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_score` to the `evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "application_type" VARCHAR(20) NOT NULL DEFAULT 'bulk';

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "file_type" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "attendance_rating",
DROP COLUMN "communication_rating",
DROP COLUMN "initiative_rating",
DROP COLUMN "score",
DROP COLUMN "teamwork_rating",
DROP COLUMN "technical_rating",
ADD COLUMN     "accuracy_score" DOUBLE PRECISION,
ADD COLUMN     "attendance_percentage" DOUBLE PRECISION,
ADD COLUMN     "communication_score" DOUBLE PRECISION,
ADD COLUMN     "cooperation_score" DOUBLE PRECISION,
ADD COLUMN     "engagement_score" DOUBLE PRECISION,
ADD COLUMN     "general_performance_total" DOUBLE PRECISION,
ADD COLUMN     "independence_score" DOUBLE PRECISION,
ADD COLUMN     "need_for_work_score" DOUBLE PRECISION,
ADD COLUMN     "organizational_skills_score" DOUBLE PRECISION,
ADD COLUMN     "personal_skills_total" DOUBLE PRECISION,
ADD COLUMN     "professional_skills_total" DOUBLE PRECISION,
ADD COLUMN     "professionalism_score" DOUBLE PRECISION,
ADD COLUMN     "project_support_score" DOUBLE PRECISION,
ADD COLUMN     "punctuality_score" DOUBLE PRECISION,
ADD COLUMN     "reliability_score" DOUBLE PRECISION,
ADD COLUMN     "responsibility_score" DOUBLE PRECISION,
ADD COLUMN     "speed_of_work_score" DOUBLE PRECISION,
ADD COLUMN     "team_quality_score" DOUBLE PRECISION,
ADD COLUMN     "technical_skills_score" DOUBLE PRECISION,
ADD COLUMN     "total_absent_days" INTEGER,
ADD COLUMN     "total_score" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "approval_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "rejected_reason" TEXT;

-- CreateTable
CREATE TABLE "bulk_applications" (
    "bulk_application_id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "total_records" INTEGER NOT NULL,
    "processed_records" INTEGER NOT NULL DEFAULT 0,
    "failed_records" INTEGER NOT NULL DEFAULT 0,
    "submission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "error_log" TEXT,

    CONSTRAINT "bulk_applications_pkey" PRIMARY KEY ("bulk_application_id")
);

-- CreateTable
CREATE TABLE "attendance_details" (
    "attendance_detail_id" SERIAL NOT NULL,
    "attendance_id" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "week_start_date" DATE,
    "week_end_date" DATE,
    "monday" BOOLEAN,
    "tuesday" BOOLEAN,
    "wednesday" BOOLEAN,
    "thursday" BOOLEAN,
    "friday" BOOLEAN,

    CONSTRAINT "attendance_details_pkey" PRIMARY KEY ("attendance_detail_id")
);

-- CreateIndex
CREATE INDEX "bulk_applications_university_id_status_idx" ON "bulk_applications"("university_id", "status");

-- CreateIndex
CREATE INDEX "attendance_details_attendance_id_week_idx" ON "attendance_details"("attendance_id", "week");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_internship_id_month_year_key" ON "attendance"("internship_id", "month", "year");

-- CreateIndex
CREATE INDEX "universities_approval_status_idx" ON "universities"("approval_status");

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_applications" ADD CONSTRAINT "bulk_applications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_applications" ADD CONSTRAINT "bulk_applications_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_details" ADD CONSTRAINT "attendance_details_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendance"("attendance_id") ON DELETE CASCADE ON UPDATE CASCADE;
