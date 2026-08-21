-- CreateEnum
CREATE TYPE "MailMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MailMessageFolder" AS ENUM ('INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "MailMessageStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'RECEIVED');

-- CreateTable
CREATE TABLE "mail_messages" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "direction" "MailMessageDirection" NOT NULL,
    "folder" "MailMessageFolder" NOT NULL DEFAULT 'INBOX',
    "status" "MailMessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "toAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ccAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bccAddresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "replyTo" TEXT,
    "subject" TEXT NOT NULL DEFAULT '',
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "snippet" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "sesMessageId" TEXT,
    "errorMessage" TEXT,
    "rawS3Key" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_messages_messageId_key" ON "mail_messages"("messageId");

-- CreateIndex
CREATE INDEX "mail_messages_mailboxId_folder_createdAt_idx" ON "mail_messages"("mailboxId", "folder", "createdAt");

-- CreateIndex
CREATE INDEX "mail_messages_mailboxId_folder_isRead_idx" ON "mail_messages"("mailboxId", "folder", "isRead");

-- CreateIndex
CREATE INDEX "mail_messages_threadId_idx" ON "mail_messages"("threadId");

-- CreateIndex
CREATE INDEX "mail_messages_userId_idx" ON "mail_messages"("userId");

-- CreateIndex
CREATE INDEX "mail_messages_sesMessageId_idx" ON "mail_messages"("sesMessageId");

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
