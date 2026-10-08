-- CreateEnum
CREATE TYPE "MailIdentityProviderType" AS ENUM ('OIDC', 'SAML');

-- CreateEnum
CREATE TYPE "MailIdentityProviderPreset" AS ENUM ('GOOGLE_WORKSPACE', 'MICROSOFT_ENTRA', 'CUSTOM');

-- AlterTable
ALTER TABLE "mail_mailboxes" ADD COLUMN     "pendingAssigneeEmail" TEXT;

-- CreateTable
CREATE TABLE "mail_app_sso_settings" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "quickLinkEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoAcceptOnLink" BOOLEAN NOT NULL DEFAULT true,
    "skipMailboxPasswordForAssigned" BOOLEAN NOT NULL DEFAULT true,
    "linkTtlHours" INTEGER NOT NULL DEFAULT 72,
    "allowedEmailDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_app_sso_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_sso_access_links" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mailboxId" TEXT,
    "memberId" TEXT,
    "emailInviteId" TEXT,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_sso_access_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_app_identity_providers" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "type" "MailIdentityProviderType" NOT NULL DEFAULT 'OIDC',
    "preset" "MailIdentityProviderPreset" NOT NULL DEFAULT 'CUSTOM',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "issuer" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretEncrypted" TEXT NOT NULL,
    "emailDomain" TEXT NOT NULL,
    "jitProvisioning" BOOLEAN NOT NULL DEFAULT true,
    "defaultRole" "MailAppMemberRole" NOT NULL DEFAULT 'MEMBER',
    "enforceSso" BOOLEAN NOT NULL DEFAULT false,
    "autoMapMailboxByLocalPart" BOOLEAN NOT NULL DEFAULT true,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_app_identity_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_sso_identities" (
    "id" TEXT NOT NULL,
    "identityProviderId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_sso_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_app_sso_settings_mailAppId_key" ON "mail_app_sso_settings"("mailAppId");

-- CreateIndex
CREATE UNIQUE INDEX "mail_sso_access_links_tokenHash_key" ON "mail_sso_access_links"("tokenHash");

-- CreateIndex
CREATE INDEX "mail_sso_access_links_mailAppId_idx" ON "mail_sso_access_links"("mailAppId");

-- CreateIndex
CREATE INDEX "mail_sso_access_links_email_idx" ON "mail_sso_access_links"("email");

-- CreateIndex
CREATE INDEX "mail_sso_access_links_mailboxId_idx" ON "mail_sso_access_links"("mailboxId");

-- CreateIndex
CREATE INDEX "mail_sso_access_links_expiresAt_idx" ON "mail_sso_access_links"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "mail_app_identity_providers_mailAppId_key" ON "mail_app_identity_providers"("mailAppId");

-- CreateIndex
CREATE UNIQUE INDEX "mail_app_identity_providers_emailDomain_key" ON "mail_app_identity_providers"("emailDomain");

-- CreateIndex
CREATE INDEX "mail_sso_identities_userId_idx" ON "mail_sso_identities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mail_sso_identities_identityProviderId_subject_key" ON "mail_sso_identities"("identityProviderId", "subject");

-- CreateIndex
CREATE INDEX "mail_mailboxes_pendingAssigneeEmail_idx" ON "mail_mailboxes"("pendingAssigneeEmail");

-- AddForeignKey
ALTER TABLE "mail_app_sso_settings" ADD CONSTRAINT "mail_app_sso_settings_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_sso_access_links" ADD CONSTRAINT "mail_sso_access_links_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_sso_access_links" ADD CONSTRAINT "mail_sso_access_links_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_sso_access_links" ADD CONSTRAINT "mail_sso_access_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_app_identity_providers" ADD CONSTRAINT "mail_app_identity_providers_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_sso_identities" ADD CONSTRAINT "mail_sso_identities_identityProviderId_fkey" FOREIGN KEY ("identityProviderId") REFERENCES "mail_app_identity_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_sso_identities" ADD CONSTRAINT "mail_sso_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

