-- AddGroupScheduleFields
ALTER TABLE "student_groups" ADD COLUMN IF NOT EXISTS "start_date" DATE;
ALTER TABLE "student_groups" ADD COLUMN IF NOT EXISTS "end_date" DATE;
ALTER TABLE "student_groups" ADD COLUMN IF NOT EXISTS "attendance_days" VARCHAR(100);
