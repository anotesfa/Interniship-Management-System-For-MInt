-- Add monthly attendance sheet storage
ALTER TABLE "attendance"
ADD COLUMN "attendance_sheet" JSONB,
ADD COLUMN "total_absent_days" INTEGER NOT NULL DEFAULT 0;