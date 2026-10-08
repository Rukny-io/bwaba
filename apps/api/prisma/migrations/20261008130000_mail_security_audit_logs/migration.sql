CREATE TABLE "mail_security_audit_logs" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_security_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mail_security_audit_logs_mailAppId_createdAt_idx"
  ON "mail_security_audit_logs"("mailAppId", "createdAt");
CREATE INDEX "mail_security_audit_logs_actorUserId_createdAt_idx"
  ON "mail_security_audit_logs"("actorUserId", "createdAt");
CREATE INDEX "mail_security_audit_logs_action_createdAt_idx"
  ON "mail_security_audit_logs"("action", "createdAt");

ALTER TABLE "mail_security_audit_logs"
  ADD CONSTRAINT "mail_security_audit_logs_mailAppId_fkey"
  FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_security_audit_logs"
  ADD CONSTRAINT "mail_security_audit_logs_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
