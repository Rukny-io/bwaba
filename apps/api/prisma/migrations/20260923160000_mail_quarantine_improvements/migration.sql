-- AlterEnum
ALTER TYPE "MailFilterMatchField" ADD VALUE 'RECIPIENT';
ALTER TYPE "MailFilterMatchField" ADD VALUE 'SENDER_REGEX';
ALTER TYPE "MailFilterMatchField" ADD VALUE 'SUBJECT_REGEX';

-- CreateEnum
CREATE TYPE "MailQuarantineAction" AS ENUM ('RELEASE', 'SPAM', 'DELETE', 'EXPIRED');

-- AlterTable
ALTER TABLE "mail_app_security_settings" ADD COLUMN "quarantineRetentionDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "mail_app_security_settings" ADD COLUMN "quarantineNewSendersWithoutDmarc" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "mail_messages" ADD COLUMN "quarantineExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "mail_messages_folder_quarantineExpiresAt_idx" ON "mail_messages"("folder", "quarantineExpiresAt");

-- CreateTable
CREATE TABLE "mail_quarantine_action_logs" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "messageId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "action" "MailQuarantineAction" NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "mailboxAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_quarantine_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_quarantine_action_logs_mailAppId_createdAt_idx" ON "mail_quarantine_action_logs"("mailAppId", "createdAt");

-- CreateIndex
CREATE INDEX "mail_quarantine_action_logs_actorUserId_idx" ON "mail_quarantine_action_logs"("actorUserId");

-- AddForeignKey
ALTER TABLE "mail_quarantine_action_logs" ADD CONSTRAINT "mail_quarantine_action_logs_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_quarantine_action_logs" ADD CONSTRAINT "mail_quarantine_action_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
