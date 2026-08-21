-- AlterTable
ALTER TABLE "mail_mailboxes" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "mail_mailboxes" ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mail_mailboxes" ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;
