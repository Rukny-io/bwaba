-- Email API competitive pricing: multi-tier plans, marketing, automations, add-ons

CREATE TYPE "DeveloperEmailPlan" AS ENUM (
  'FREE',
  'PRO_10K',
  'PRO_50K',
  'PRO_100K',
  'SCALE_100K',
  'SCALE_200K',
  'SCALE_500K',
  'SCALE_1M',
  'ENTERPRISE'
);

CREATE TYPE "DeveloperEmailMarketingPlan" AS ENUM (
  'FREE',
  'PRO_5K',
  'PRO_10K',
  'PRO_25K',
  'PRO_50K',
  'PRO_100K',
  'ENTERPRISE'
);

CREATE TYPE "DeveloperEmailBroadcastStatus" AS ENUM (
  'DRAFT',
  'SCHEDULED',
  'SENDING',
  'SENT',
  'FAILED',
  'CANCELED'
);

CREATE TYPE "DeveloperEmailBroadcastRecipientStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'SKIPPED'
);

CREATE TYPE "DeveloperEmailAutomationStatus" AS ENUM (
  'ACTIVE',
  'PAUSED',
  'ARCHIVED'
);

ALTER TABLE "developer_email_entitlements"
  ADD COLUMN IF NOT EXISTS "plan" "DeveloperEmailPlan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "overagePackCredits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freePeriodStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "freePeriodEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "freeMonthlyUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freeDailyUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freeDailyDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "marketingPlan" "DeveloperEmailMarketingPlan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "marketingContactsLimit" INTEGER NOT NULL DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS "marketingContactsUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "automationRunsIncluded" INTEGER NOT NULL DEFAULT 15000,
  ADD COLUMN IF NOT EXISTS "automationRunsUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "addonDomainsExtra" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dedicatedIpEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "enterpriseMonthlyQuota" INTEGER;

CREATE INDEX IF NOT EXISTS "developer_email_entitlements_freePeriodEnd_idx"
  ON "developer_email_entitlements"("freePeriodEnd");

-- Migrate legacy trial users to free monthly model
UPDATE "developer_email_entitlements"
SET
  "plan" = 'FREE',
  "freeMonthlyUsed" = LEAST(COALESCE("trialUsed", 0), 3000),
  "freePeriodStart" = COALESCE("periodStartsAt", "trialGrantedAt", NOW()),
  "freePeriodEnd" = COALESCE(
    "periodEndsAt",
    ("trialGrantedAt" + INTERVAL '1 month'),
    (NOW() + INTERVAL '1 month')
  ),
  "trialQuota" = 3000
WHERE "subscriptionStatus" <> 'ACTIVE';

-- Active legacy Starter subscriptions → PRO_10K
UPDATE "developer_email_entitlements"
SET
  "plan" = 'PRO_10K',
  "monthlyQuota" = GREATEST(COALESCE("monthlyQuota", 0), 10000)
WHERE
  "subscriptionStatus" = 'ACTIVE'
  AND COALESCE("monthlyQuota", 0) <= 10000;

CREATE TABLE IF NOT EXISTS "developer_email_contacts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailHash" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "source" TEXT NOT NULL DEFAULT 'manual',
  "unsubscribedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "developer_email_contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "developer_email_broadcasts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "bodyHtml" TEXT,
  "bodyText" TEXT,
  "status" "DeveloperEmailBroadcastStatus" NOT NULL DEFAULT 'DRAFT',
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "developer_email_broadcasts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "developer_email_broadcast_recipients" (
  "id" TEXT NOT NULL,
  "broadcastId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "status" "DeveloperEmailBroadcastRecipientStatus" NOT NULL DEFAULT 'PENDING',
  "errorCode" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "developer_email_broadcast_recipients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "developer_email_automations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "triggerType" TEXT NOT NULL DEFAULT 'webhook',
  "actionType" TEXT NOT NULL DEFAULT 'send_email',
  "configJson" JSONB NOT NULL DEFAULT '{}',
  "status" "DeveloperEmailAutomationStatus" NOT NULL DEFAULT 'ACTIVE',
  "runsTotal" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "developer_email_automations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "developer_email_automation_runs" (
  "id" TEXT NOT NULL,
  "automationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "billed" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "developer_email_automation_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "developer_email_contacts_userId_emailHash_key"
  ON "developer_email_contacts"("userId", "emailHash");
CREATE INDEX IF NOT EXISTS "developer_email_contacts_userId_unsubscribedAt_idx"
  ON "developer_email_contacts"("userId", "unsubscribedAt");

CREATE INDEX IF NOT EXISTS "developer_email_broadcasts_userId_status_createdAt_idx"
  ON "developer_email_broadcasts"("userId", "status", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "developer_email_broadcast_recipients_broadcastId_contactId_key"
  ON "developer_email_broadcast_recipients"("broadcastId", "contactId");
CREATE INDEX IF NOT EXISTS "developer_email_broadcast_recipients_broadcastId_status_idx"
  ON "developer_email_broadcast_recipients"("broadcastId", "status");

CREATE INDEX IF NOT EXISTS "developer_email_automations_userId_status_idx"
  ON "developer_email_automations"("userId", "status");

CREATE INDEX IF NOT EXISTS "developer_email_automation_runs_userId_createdAt_idx"
  ON "developer_email_automation_runs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "developer_email_automation_runs_automationId_createdAt_idx"
  ON "developer_email_automation_runs"("automationId", "createdAt");

ALTER TABLE "developer_email_contacts"
  ADD CONSTRAINT "developer_email_contacts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_email_broadcasts"
  ADD CONSTRAINT "developer_email_broadcasts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_email_broadcast_recipients"
  ADD CONSTRAINT "developer_email_broadcast_recipients_broadcastId_fkey"
  FOREIGN KEY ("broadcastId") REFERENCES "developer_email_broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_email_broadcast_recipients"
  ADD CONSTRAINT "developer_email_broadcast_recipients_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "developer_email_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_email_automations"
  ADD CONSTRAINT "developer_email_automations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_email_automation_runs"
  ADD CONSTRAINT "developer_email_automation_runs_automationId_fkey"
  FOREIGN KEY ("automationId") REFERENCES "developer_email_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "developer_email_automation_runs"
  ADD CONSTRAINT "developer_email_automation_runs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'EMAIL_OVERAGE_PACK';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'EMAIL_AUTOMATION_RUN';
