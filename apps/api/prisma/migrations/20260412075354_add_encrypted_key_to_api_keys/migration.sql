-- CreateEnum (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeveloperAppStatus') THEN
    CREATE TYPE "DeveloperAppStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeveloperAppType') THEN
    CREATE TYPE "DeveloperAppType" AS ENUM ('BUSINESS', 'CONSUMER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApiKeyStatus') THEN
    CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WabaAccountStatus') THEN
    CREATE TYPE "WabaAccountStatus" AS ENUM ('PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'BANNED', 'DISCONNECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PhoneNumberStatus') THEN
    CREATE TYPE "PhoneNumberStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'DISABLED', 'BANNED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QualityRating') THEN
    CREATE TYPE "QualityRating" AS ENUM ('GREEN', 'YELLOW', 'RED', 'UNKNOWN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TemplateCategory') THEN
    CREATE TYPE "TemplateCategory" AS ENUM ('AUTHENTICATION', 'MARKETING', 'UTILITY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TemplateStatus') THEN
    CREATE TYPE "TemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageDirection') THEN
    CREATE TYPE "MessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WhatsappMessageType') THEN
    CREATE TYPE "WhatsappMessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACTS', 'TEMPLATE', 'INTERACTIVE', 'REACTION');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageLogStatus') THEN
    CREATE TYPE "MessageLogStatus" AS ENUM ('ACCEPTED', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConversationCategory') THEN
    CREATE TYPE "ConversationCategory" AS ENUM ('AUTHENTICATION', 'MARKETING', 'UTILITY', 'SERVICE', 'REFERRAL_CONVERSION');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WebhookStatus') THEN
    CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'PAUSED', 'AUTO_DISABLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeveloperPlan') THEN
    CREATE TYPE "DeveloperPlan" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE');
  END IF;
END $$;

-- CreateTable developer_apps
CREATE TABLE IF NOT EXISTS "developer_apps" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT,
    "appType" "DeveloperAppType" NOT NULL DEFAULT 'BUSINESS',
    "description" TEXT,
    "businessId" TEXT,
    "icon" TEXT,
    "status" "DeveloperAppStatus" NOT NULL DEFAULT 'ACTIVE',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_apps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_apps_appId_key" ON "developer_apps"("appId");
CREATE INDEX IF NOT EXISTS "developer_apps_userId_idx" ON "developer_apps"("userId");
CREATE INDEX IF NOT EXISTS "developer_apps_appId_idx" ON "developer_apps"("appId");
CREATE INDEX IF NOT EXISTS "developer_apps_status_idx" ON "developer_apps"("status");

-- CreateTable developer_app_wallets
CREATE TABLE IF NOT EXISTS "developer_app_wallets" (
    "id" TEXT NOT NULL,
    "developerAppId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "totalAllocated" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_app_wallets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_app_wallets_developerAppId_key" ON "developer_app_wallets"("developerAppId");
CREATE INDEX IF NOT EXISTS "developer_app_wallets_developerAppId_idx" ON "developer_app_wallets"("developerAppId");
CREATE INDEX IF NOT EXISTS "developer_app_wallets_balance_idx" ON "developer_app_wallets"("balance");

-- CreateTable developer_api_keys (includes encryptedKey column)
CREATE TABLE IF NOT EXISTS "developer_api_keys" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "developerAppId" TEXT,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keySuffix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "encryptedKey" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY['whatsapp:send', 'whatsapp:read', 'templates:read', 'contacts:read']::TEXT[],
    "environment" TEXT NOT NULL DEFAULT 'live',
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "ipAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requestCount" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_api_keys_slug_key" ON "developer_api_keys"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "developer_api_keys_keyHash_key" ON "developer_api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "developer_api_keys_keyHash_idx" ON "developer_api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "developer_api_keys_userId_idx" ON "developer_api_keys"("userId");
CREATE INDEX IF NOT EXISTS "developer_api_keys_developerAppId_idx" ON "developer_api_keys"("developerAppId");
CREATE INDEX IF NOT EXISTS "developer_api_keys_status_idx" ON "developer_api_keys"("status");
CREATE INDEX IF NOT EXISTS "developer_api_keys_slug_idx" ON "developer_api_keys"("slug");

-- CreateTable developer_whatsapp_accounts
CREATE TABLE IF NOT EXISTS "developer_whatsapp_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "developerAppId" TEXT NOT NULL,
    "wabaId" TEXT NOT NULL,
    "businessName" TEXT,
    "businessId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezoneId" TEXT NOT NULL DEFAULT 'Asia/Baghdad',
    "status" "WabaAccountStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "accessTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "webhookSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_whatsapp_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_whatsapp_accounts_wabaId_key" ON "developer_whatsapp_accounts"("wabaId");
CREATE INDEX IF NOT EXISTS "developer_whatsapp_accounts_userId_idx" ON "developer_whatsapp_accounts"("userId");
CREATE INDEX IF NOT EXISTS "developer_whatsapp_accounts_developerAppId_idx" ON "developer_whatsapp_accounts"("developerAppId");
CREATE INDEX IF NOT EXISTS "developer_whatsapp_accounts_wabaId_idx" ON "developer_whatsapp_accounts"("wabaId");
CREATE INDEX IF NOT EXISTS "developer_whatsapp_accounts_status_idx" ON "developer_whatsapp_accounts"("status");

-- CreateTable developer_phone_numbers
CREATE TABLE IF NOT EXISTS "developer_phone_numbers" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "displayPhoneNumber" TEXT,
    "verifiedName" TEXT,
    "phoneNumberId" TEXT NOT NULL,
    "qualityRating" "QualityRating" NOT NULL DEFAULT 'UNKNOWN',
    "messagingLimit" TEXT,
    "status" "PhoneNumberStatus" NOT NULL DEFAULT 'PENDING',
    "nameStatus" TEXT,
    "profilePictureUrl" TEXT,
    "aboutText" TEXT,
    "address" TEXT,
    "description" TEXT,
    "email" TEXT,
    "websites" JSONB,
    "category" TEXT,
    "isOfficialBusinessAccount" BOOLEAN NOT NULL DEFAULT false,
    "platformType" TEXT DEFAULT 'CLOUD_API',
    "codeVerificationStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_phone_numbers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_phone_numbers_phoneNumberId_key" ON "developer_phone_numbers"("phoneNumberId");
CREATE INDEX IF NOT EXISTS "developer_phone_numbers_accountId_idx" ON "developer_phone_numbers"("accountId");
CREATE INDEX IF NOT EXISTS "developer_phone_numbers_phoneNumberId_idx" ON "developer_phone_numbers"("phoneNumberId");
CREATE INDEX IF NOT EXISTS "developer_phone_numbers_status_idx" ON "developer_phone_numbers"("status");

-- CreateTable developer_whatsapp_templates
CREATE TABLE IF NOT EXISTS "developer_whatsapp_templates" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "metaTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "category" "TemplateCategory" NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'PENDING',
    "components" JSONB NOT NULL,
    "rejectedReason" TEXT,
    "qualityScore" JSONB,
    "messageSentInTemplate" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_whatsapp_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_whatsapp_templates_accountId_name_language_key" ON "developer_whatsapp_templates"("accountId", "name", "language");
CREATE INDEX IF NOT EXISTS "developer_whatsapp_templates_accountId_idx" ON "developer_whatsapp_templates"("accountId");
CREATE INDEX IF NOT EXISTS "developer_whatsapp_templates_status_idx" ON "developer_whatsapp_templates"("status");
CREATE INDEX IF NOT EXISTS "developer_whatsapp_templates_category_idx" ON "developer_whatsapp_templates"("category");

-- CreateTable whatsapp_message_logs
CREATE TABLE IF NOT EXISTS "whatsapp_message_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "templateId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "messageType" "WhatsappMessageType" NOT NULL,
    "status" "MessageLogStatus" NOT NULL DEFAULT 'ACCEPTED',
    "recipientNumber" TEXT NOT NULL,
    "senderNumber" TEXT,
    "metaMessageId" TEXT,
    "conversationId" TEXT,
    "conversationCategory" "ConversationCategory",
    "content" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "pricing" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_message_logs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_message_logs_metaMessageId_key" ON "whatsapp_message_logs"("metaMessageId");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_userId_idx" ON "whatsapp_message_logs"("userId");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_accountId_idx" ON "whatsapp_message_logs"("accountId");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_phoneNumberId_idx" ON "whatsapp_message_logs"("phoneNumberId");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_metaMessageId_idx" ON "whatsapp_message_logs"("metaMessageId");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_status_idx" ON "whatsapp_message_logs"("status");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_direction_idx" ON "whatsapp_message_logs"("direction");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_createdAt_idx" ON "whatsapp_message_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_recipientNumber_idx" ON "whatsapp_message_logs"("recipientNumber");

-- CreateTable developer_contacts
CREATE TABLE IF NOT EXISTS "developer_contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "waId" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "lastMessageAt" TIMESTAMP(3),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_contacts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_contacts_userId_phoneNumber_key" ON "developer_contacts"("userId", "phoneNumber");
CREATE INDEX IF NOT EXISTS "developer_contacts_userId_idx" ON "developer_contacts"("userId");
CREATE INDEX IF NOT EXISTS "developer_contacts_tags_idx" ON "developer_contacts"("tags");
CREATE INDEX IF NOT EXISTS "developer_contacts_createdAt_idx" ON "developer_contacts"("createdAt");

-- CreateTable developer_webhooks
CREATE TABLE IF NOT EXISTS "developer_webhooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastResponseCode" INTEGER,
    "disabledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_webhooks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "developer_webhooks_userId_idx" ON "developer_webhooks"("userId");
CREATE INDEX IF NOT EXISTS "developer_webhooks_status_idx" ON "developer_webhooks"("status");

-- CreateTable webhook_delivery_logs
CREATE TABLE IF NOT EXISTS "webhook_delivery_logs" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_delivery_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "webhook_delivery_logs_webhookId_idx" ON "webhook_delivery_logs"("webhookId");
CREATE INDEX IF NOT EXISTS "webhook_delivery_logs_eventType_idx" ON "webhook_delivery_logs"("eventType");
CREATE INDEX IF NOT EXISTS "webhook_delivery_logs_success_idx" ON "webhook_delivery_logs"("success");
CREATE INDEX IF NOT EXISTS "webhook_delivery_logs_createdAt_idx" ON "webhook_delivery_logs"("createdAt");

-- CreateTable api_request_logs
CREATE TABLE IF NOT EXISTS "api_request_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_request_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "api_request_logs_userId_idx" ON "api_request_logs"("userId");
CREATE INDEX IF NOT EXISTS "api_request_logs_apiKeyId_idx" ON "api_request_logs"("apiKeyId");
CREATE INDEX IF NOT EXISTS "api_request_logs_path_idx" ON "api_request_logs"("path");
CREATE INDEX IF NOT EXISTS "api_request_logs_statusCode_idx" ON "api_request_logs"("statusCode");
CREATE INDEX IF NOT EXISTS "api_request_logs_createdAt_idx" ON "api_request_logs"("createdAt");

-- CreateTable developer_subscriptions
CREATE TABLE IF NOT EXISTS "developer_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "DeveloperPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle",
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "messagesUsed" INTEGER NOT NULL DEFAULT 0,
    "messagesLimit" INTEGER NOT NULL DEFAULT 1000,
    "apiKeysUsed" INTEGER NOT NULL DEFAULT 0,
    "apiKeysLimit" INTEGER NOT NULL DEFAULT 1,
    "phoneNumbersUsed" INTEGER NOT NULL DEFAULT 0,
    "phoneNumbersLimit" INTEGER NOT NULL DEFAULT 1,
    "webhooksUsed" INTEGER NOT NULL DEFAULT 0,
    "webhooksLimit" INTEGER NOT NULL DEFAULT 2,
    "contactsUsed" INTEGER NOT NULL DEFAULT 0,
    "contactsLimit" INTEGER NOT NULL DEFAULT 500,
    "appsUsed" INTEGER NOT NULL DEFAULT 0,
    "appsLimit" INTEGER NOT NULL DEFAULT 3,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 30,
    "logRetentionDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "developer_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_subscriptions_userId_key" ON "developer_subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "developer_subscriptions_userId_idx" ON "developer_subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "developer_subscriptions_plan_idx" ON "developer_subscriptions"("plan");

-- AddForeignKeys (only if not exist)
DO $$ BEGIN
  ALTER TABLE "developer_apps" ADD CONSTRAINT "developer_apps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_app_wallets" ADD CONSTRAINT "developer_app_wallets_developerAppId_fkey" FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_api_keys" ADD CONSTRAINT "developer_api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_api_keys" ADD CONSTRAINT "developer_api_keys_developerAppId_fkey" FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_whatsapp_accounts" ADD CONSTRAINT "developer_whatsapp_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_whatsapp_accounts" ADD CONSTRAINT "developer_whatsapp_accounts_developerAppId_fkey" FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_phone_numbers" ADD CONSTRAINT "developer_phone_numbers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "developer_whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_whatsapp_templates" ADD CONSTRAINT "developer_whatsapp_templates_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "developer_whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "developer_whatsapp_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "developer_phone_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "developer_api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "developer_whatsapp_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_contacts" ADD CONSTRAINT "developer_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_webhooks" ADD CONSTRAINT "developer_webhooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "webhook_delivery_logs" ADD CONSTRAINT "webhook_delivery_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "developer_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "developer_api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "developer_subscriptions" ADD CONSTRAINT "developer_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
