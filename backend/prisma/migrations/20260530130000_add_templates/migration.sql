-- CreateTable
CREATE TABLE "templates" (
    "template_id" SERIAL NOT NULL,
    "template_name" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "uploaded_by" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("template_id")
);


-- CreateIndex
CREATE INDEX "templates_is_active_idx" ON "templates"("is_active");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
