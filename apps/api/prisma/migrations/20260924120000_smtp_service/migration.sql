-- Developer Email API channel tracking (rest | smtp)
ALTER TABLE "developer_email_messages" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'rest';

-- Mailbox outbound client source (webmail | smtp)
ALTER TABLE "mail_messages" ADD COLUMN "clientSource" TEXT;

-- App passwords for third-party mail clients
CREATE TABLE "mail_app_passwords" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "mail_app_passwords_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mail_app_passwords_mailboxId_idx" ON "mail_app_passwords"("mailboxId");
CREATE INDEX "mail_app_passwords_revokedAt_idx" ON "mail_app_passwords"("revokedAt");

ALTER TABLE "mail_app_passwords" ADD CONSTRAINT "mail_app_passwords_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
