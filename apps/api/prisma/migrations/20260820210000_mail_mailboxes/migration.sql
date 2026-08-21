-- CreateEnum
CREATE TYPE "MailMailboxStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DELETED');

-- CreateTable
CREATE TABLE "mail_mailboxes" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "MailMailboxStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_mailboxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_mailboxes_domain_localPart_key" ON "mail_mailboxes"("domain", "localPart");

-- CreateIndex
CREATE INDEX "mail_mailboxes_mailAppId_idx" ON "mail_mailboxes"("mailAppId");

-- CreateIndex
CREATE INDEX "mail_mailboxes_status_idx" ON "mail_mailboxes"("status");

-- CreateIndex
CREATE INDEX "mail_mailboxes_createdAt_idx" ON "mail_mailboxes"("createdAt");

-- AddForeignKey
ALTER TABLE "mail_mailboxes" ADD CONSTRAINT "mail_mailboxes_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
