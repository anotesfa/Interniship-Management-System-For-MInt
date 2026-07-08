-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);


-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role_id" INTEGER NOT NULL,
    "account_status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_login" TIMESTAMP(3),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "lockout_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45) NOT NULL,
    "status" VARCHAR(20) NOT NULL,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "universities" (
    "university_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_email" VARCHAR(320) NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("university_id")
);

-- CreateTable
CREATE TABLE "university_users" (
    "university_user_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "role_title" VARCHAR(100),

    CONSTRAINT "university_users_pkey" PRIMARY KEY ("university_user_id")
);

-- CreateTable
CREATE TABLE "students" (
    "student_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "university_id" INTEGER NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(100) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "department" VARCHAR(150) NOT NULL,
    "gpa" DOUBLE PRECISION,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "applications" (
    "application_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "submitted_by" INTEGER NOT NULL,
    "application_letter_path" VARCHAR(500),
    "submission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("application_id")
);

-- CreateTable
CREATE TABLE "application_students" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "remarks" TEXT,

    CONSTRAINT "application_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internships" (
    "internship_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "application_id" INTEGER NOT NULL,
    "assignment_id" INTEGER,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending_assignment',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internships_pkey" PRIMARY KEY ("internship_id")
);

-- CreateTable
CREATE TABLE "supervisors" (
    "supervisor_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "department" VARCHAR(150) NOT NULL,
    "position" VARCHAR(150) NOT NULL,
    "max_students" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervisors_pkey" PRIMARY KEY ("supervisor_id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "assignment_id" SERIAL NOT NULL,
    "internship_id" INTEGER NOT NULL,
    "supervisor_id" INTEGER NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "milestone_id" SERIAL NOT NULL,
    "internship_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "due_date" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'open',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("milestone_id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "submission_id" SERIAL NOT NULL,
    "milestone_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL DEFAULT 'submitted',

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "submission_reviews" (
    "review_id" SERIAL NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "feedback" TEXT,
    "status" VARCHAR(30) NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "attendance_id" SERIAL NOT NULL,
    "internship_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "marked_by" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "report_id" SERIAL NOT NULL,
    "internship_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" INTEGER,
    "status" VARCHAR(30) NOT NULL DEFAULT 'submitted',

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "evaluation_id" SERIAL NOT NULL,
    "internship_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "supervisor_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" VARCHAR(2) NOT NULL,
    "remarks" TEXT NOT NULL,
    "attendance_rating" INTEGER,
    "technical_rating" INTEGER,
    "teamwork_rating" INTEGER,
    "communication_rating" INTEGER,
    "initiative_rating" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "published_by" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("evaluation_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "message_id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "message_text" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_status" VARCHAR(10) NOT NULL DEFAULT 'unread',

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "type_id" SERIAL NOT NULL,
    "type_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "documents" (
    "document_id" SERIAL NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(10) NOT NULL,
    "document_type_id" INTEGER NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "history_id" SERIAL NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "old_status" VARCHAR(30),
    "new_status" VARCHAR(30) NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" INTEGER,
    "ip_address" VARCHAR(45),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "login_logs_user_id_login_time_idx" ON "login_logs"("user_id", "login_time");

-- CreateIndex
CREATE UNIQUE INDEX "university_users_user_id_university_id_key" ON "university_users"("user_id", "university_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "students_university_id_idx" ON "students"("university_id");

-- CreateIndex
CREATE INDEX "applications_university_id_status_idx" ON "applications"("university_id", "status");

-- CreateIndex
CREATE INDEX "applications_status_submission_date_idx" ON "applications"("status", "submission_date");

-- CreateIndex
CREATE INDEX "application_students_application_id_status_idx" ON "application_students"("application_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "application_students_application_id_student_id_key" ON "application_students"("application_id", "student_id");

-- CreateIndex
CREATE INDEX "internships_student_id_status_idx" ON "internships"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "supervisors_user_id_key" ON "supervisors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_internship_id_key" ON "assignments"("internship_id");

-- CreateIndex
CREATE INDEX "assignments_supervisor_id_status_idx" ON "assignments"("supervisor_id", "status");

-- CreateIndex
CREATE INDEX "milestones_internship_id_status_idx" ON "milestones"("internship_id", "status");

-- CreateIndex
CREATE INDEX "submissions_milestone_id_submitted_at_idx" ON "submissions"("milestone_id", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "submission_reviews_submission_id_key" ON "submission_reviews"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_internship_id_key" ON "attendance"("internship_id");

-- CreateIndex
CREATE INDEX "monthly_reports_internship_id_year_month_idx" ON "monthly_reports"("internship_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_internship_id_month_year_key" ON "monthly_reports"("internship_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_internship_id_key" ON "evaluations"("internship_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_receiver_id_sent_at_idx" ON "messages"("sender_id", "receiver_id", "sent_at");

-- CreateIndex
CREATE INDEX "messages_receiver_id_read_status_idx" ON "messages"("receiver_id", "read_status");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_type_name_key" ON "document_types"("type_name");

-- CreateIndex
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "status_history_entity_type_entity_id_idx" ON "status_history"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "status_history_changed_by_changed_at_idx" ON "status_history"("changed_by", "changed_at");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_timestamp_idx" ON "activity_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_users" ADD CONSTRAINT "university_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_users" ADD CONSTRAINT "university_users_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_students" ADD CONSTRAINT "application_students_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_students" ADD CONSTRAINT "application_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internships" ADD CONSTRAINT "internships_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisors" ADD CONSTRAINT "supervisors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("internship_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "supervisors"("supervisor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("internship_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("milestone_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_reviews" ADD CONSTRAINT "submission_reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("submission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("internship_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("internship_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "internships"("internship_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "supervisors"("supervisor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
