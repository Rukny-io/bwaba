-- CreateEnum
CREATE TYPE "DeveloperEmailDomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeveloperEmailSenderStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DeveloperEmailMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeveloperEmailSuppressionReason" AS ENUM ('BOUNCE', 'COMPLAINT', 'MANUAL');

-- CreateEnum
CREATE TYPE "DeveloperEmailSubscriptionStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateTable
CREATE TABLE "developer_email_domains" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "DeveloperEmailDomainStatus" NOT NULL DEFAULT 'PENDING',
    "dkimTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_email_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_email_senders" (
    "id" TEXT NOT NULL,
    "developerAppId" TEXT NOT NULL,
    "emailDomainId" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "status" "DeveloperEmailSenderStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_email_senders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_email_messages" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "developerAppId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "senderId" TEXT,
    "recipientHash" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "status" "DeveloperEmailMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "sesMessageId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_email_suppressions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientHash" TEXT NOT NULL,
    "reason" "DeveloperEmailSuppressionReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_email_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_email_entitlements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trialGrantedAt" TIMESTAMP(3),
    "trialQuota" INTEGER NOT NULL DEFAULT 0,
    "trialUsed" INTEGER NOT NULL DEFAULT 0,
    "subscriptionStatus" "DeveloperEmailSubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "periodStartsAt" TIMESTAMP(3),
    "periodEndsAt" TIMESTAMP(3),
    "monthlyQuota" INTEGER NOT NULL DEFAULT 0,
    "monthlyUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_email_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "developer_email_domains_userId_domain_key" ON "developer_email_domains"("userId", "domain");
CREATE INDEX "developer_email_domains_userId_status_idx" ON "developer_email_domains"("userId", "status");
CREATE UNIQUE INDEX "developer_email_senders_developerAppId_emailDomainId_localPart_key" ON "developer_email_senders"("developerAppId", "emailDomainId", "localPart");
CREATE INDEX "developer_email_senders_developerAppId_status_idx" ON "developer_email_senders"("developerAppId", "status");
CREATE UNIQUE INDEX "developer_email_messages_externalId_key" ON "developer_email_messages"("externalId");
CREATE UNIQUE INDEX "developer_email_messages_sesMessageId_key" ON "developer_email_messages"("sesMessageId");
CREATE UNIQUE INDEX "developer_email_messages_apiKeyId_idempotencyKey_key" ON "developer_email_messages"("apiKeyId", "idempotencyKey");
CREATE INDEX "developer_email_messages_developerAppId_createdAt_idx" ON "developer_email_messages"("developerAppId", "createdAt");
CREATE INDEX "developer_email_messages_userId_createdAt_idx" ON "developer_email_messages"("userId", "createdAt");
CREATE UNIQUE INDEX "developer_email_suppressions_userId_recipientHash_key" ON "developer_email_suppressions"("userId", "recipientHash");
CREATE INDEX "developer_email_suppressions_userId_reason_idx" ON "developer_email_suppressions"("userId", "reason");
CREATE UNIQUE INDEX "developer_email_entitlements_userId_key" ON "developer_email_entitlements"("userId");
CREATE INDEX "developer_email_entitlements_subscriptionStatus_periodEndsAt_idx" ON "developer_email_entitlements"("subscriptionStatus", "periodEndsAt");

-- AddForeignKey
ALTER TABLE "developer_email_domains" ADD CONSTRAINT "developer_email_domains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "developer_email_senders" ADD CONSTRAINT "developer_email_senders_developerAppId_fkey" FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "developer_email_senders" ADD CONSTRAINT "developer_email_senders_emailDomainId_fkey" FOREIGN KEY ("emailDomainId") REFERENCES "developer_email_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "developer_email_messages" ADD CONSTRAINT "developer_email_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "developer_email_messages" ADD CONSTRAINT "developer_email_messages_developerAppId_fkey" FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "developer_email_messages" ADD CONSTRAINT "developer_email_messages_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "developer_api_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "developer_email_suppressions" ADD CONSTRAINT "developer_email_suppressions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "developer_email_entitlements" ADD CONSTRAINT "developer_email_entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
