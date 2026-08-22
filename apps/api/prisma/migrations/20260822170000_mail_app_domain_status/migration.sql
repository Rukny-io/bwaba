-- CreateEnum
CREATE TYPE "MailDomainStatus" AS ENUM ('NONE', 'PENDING_DNS', 'VERIFYING', 'ACTIVE', 'FAILED');

-- AlterTable
ALTER TABLE "mail_apps" ADD COLUMN "domainStatus" "MailDomainStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "mail_apps" ADD COLUMN "domainCheckedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "mail_apps_domainStatus_idx" ON "mail_apps"("domainStatus");
