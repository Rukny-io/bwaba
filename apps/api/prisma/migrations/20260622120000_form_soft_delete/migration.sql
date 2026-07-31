-- Form soft delete + audit log
ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "deletedById" TEXT;
ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "purgeScheduledAt" TIMESTAMP(3);
ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;

CREATE INDEX IF NOT EXISTS "forms_deletedAt_idx" ON "forms"("deletedAt");
CREATE INDEX IF NOT EXISTS "forms_purgeScheduledAt_idx" ON "forms"("purgeScheduledAt");

ALTER TABLE "forms" ADD CONSTRAINT "forms_deletedById_fkey"
  FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "form_deletion_logs" (
  "id" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "formTitle" TEXT NOT NULL,
  "formSlug" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "deletedById" TEXT NOT NULL,
  "submissionCount" INTEGER NOT NULL DEFAULT 0,
  "fieldCount" INTEGER NOT NULL DEFAULT 0,
  "statusAtDelete" "FormStatus" NOT NULL,
  "typeAtDelete" "FormType" NOT NULL,
  "reason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "purgeScheduledAt" TIMESTAMP(3) NOT NULL,
  "restoredAt" TIMESTAMP(3),
  "purgedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "form_deletion_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "form_deletion_logs_formId_idx" ON "form_deletion_logs"("formId");
CREATE INDEX IF NOT EXISTS "form_deletion_logs_ownerId_idx" ON "form_deletion_logs"("ownerId");
CREATE INDEX IF NOT EXISTS "form_deletion_logs_deletedById_idx" ON "form_deletion_logs"("deletedById");
CREATE INDEX IF NOT EXISTS "form_deletion_logs_createdAt_idx" ON "form_deletion_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "form_deletion_logs_purgedAt_idx" ON "form_deletion_logs"("purgedAt");
CREATE INDEX IF NOT EXISTS "form_deletion_logs_restoredAt_idx" ON "form_deletion_logs"("restoredAt");

ALTER TYPE "SecurityAction" ADD VALUE IF NOT EXISTS 'FORM_SOFT_DELETED';
ALTER TYPE "SecurityAction" ADD VALUE IF NOT EXISTS 'FORM_RESTORED';
ALTER TYPE "SecurityAction" ADD VALUE IF NOT EXISTS 'FORM_HARD_DELETED';
