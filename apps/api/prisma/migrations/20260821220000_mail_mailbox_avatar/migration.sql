-- AlterEnum
ALTER TYPE "FileCategory" ADD VALUE IF NOT EXISTS 'MAIL_MAILBOX_AVATAR';

-- AlterTable
ALTER TABLE "mail_mailboxes" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;
