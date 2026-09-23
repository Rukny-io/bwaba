-- AlterEnum
ALTER TYPE "MailMessageFolder" ADD VALUE 'QUARANTINE';

-- CreateEnum
CREATE TYPE "MailFilterRuleType" AS ENUM ('BLOCKLIST', 'ALLOWLIST', 'FILTER');

-- CreateEnum
CREATE TYPE "MailFilterMatchField" AS ENUM ('SENDER', 'DOMAIN', 'SUBJECT');

-- CreateEnum
CREATE TYPE "MailFilterAction" AS ENUM ('SPAM', 'QUARANTINE', 'INBOX', 'PROMOTIONS', 'SOCIAL', 'DELETE');

-- CreateTable
CREATE TABLE "mail_filter_rules" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "mailboxId" TEXT,
    "ruleType" "MailFilterRuleType" NOT NULL,
    "matchField" "MailFilterMatchField" NOT NULL,
    "pattern" TEXT NOT NULL,
    "action" "MailFilterAction" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_filter_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_app_security_settings" (
    "mailAppId" TEXT NOT NULL,
    "quarantineSuspicious" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnQuarantine" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_app_security_settings_pkey" PRIMARY KEY ("mailAppId")
);

-- AlterTable
ALTER TABLE "mail_messages" ADD COLUMN "matchedRuleId" TEXT,
ADD COLUMN "quarantineReason" TEXT;

-- CreateIndex
CREATE INDEX "mail_filter_rules_mailAppId_enabled_priority_idx" ON "mail_filter_rules"("mailAppId", "enabled", "priority");

-- CreateIndex
CREATE INDEX "mail_filter_rules_mailboxId_idx" ON "mail_filter_rules"("mailboxId");

-- AddForeignKey
ALTER TABLE "mail_filter_rules" ADD CONSTRAINT "mail_filter_rules_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_filter_rules" ADD CONSTRAINT "mail_filter_rules_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_app_security_settings" ADD CONSTRAINT "mail_app_security_settings_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
