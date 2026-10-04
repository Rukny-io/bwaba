-- Mail message attachments + scheduled send support

ALTER TABLE "mail_messages" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "mail_messages_scheduledAt_idx" ON "mail_messages"("scheduledAt");

ALTER TYPE "FileCategory" ADD VALUE IF NOT EXISTS 'MAIL_MESSAGE_ATTACHMENT';

CREATE TABLE IF NOT EXISTS "mail_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "mailboxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "contentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "mail_attachments_messageId_idx" ON "mail_attachments"("messageId");
CREATE INDEX IF NOT EXISTS "mail_attachments_mailboxId_idx" ON "mail_attachments"("mailboxId");

ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
