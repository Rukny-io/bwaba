-- CreateEnum
CREATE TYPE "MailDomainTrustStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "MailDomainVerificationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MailSenderBrandStatus" AS ENUM ('UNKNOWN', 'NO_RECORD', 'INVALID', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "MailBrandCertificateType" AS ENUM ('NONE', 'CMC', 'VMC', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MailAuthenticationVerdict" AS ENUM ('PASS', 'FAIL', 'GRAY', 'PROCESSING_FAILED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "mail_apps"
  ADD COLUMN "domainTrustStatus" "MailDomainTrustStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "domainVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "domainReviewedById" TEXT,
  ADD COLUMN "domainTrustReason" TEXT;

-- AlterTable
ALTER TABLE "mail_messages"
  ADD COLUMN "senderDomain" TEXT,
  ADD COLUMN "spfVerdict" "MailAuthenticationVerdict",
  ADD COLUMN "dkimVerdict" "MailAuthenticationVerdict",
  ADD COLUMN "dmarcVerdict" "MailAuthenticationVerdict";

-- Backfill normalized sender domains without changing existing folders.
UPDATE "mail_messages"
SET "senderDomain" = LOWER(SPLIT_PART("fromAddress", '@', 2))
WHERE POSITION('@' IN "fromAddress") > 1
  AND SPLIT_PART("fromAddress", '@', 2) <> '';

-- CreateTable
CREATE TABLE "mail_domain_verification_requests" (
  "id" TEXT NOT NULL,
  "mailAppId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "status" "MailDomainVerificationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "evidence" JSONB,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mail_domain_verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_sender_brands" (
  "id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "status" "MailSenderBrandStatus" NOT NULL DEFAULT 'UNKNOWN',
  "bimiRecord" TEXT,
  "logoSourceUrl" TEXT,
  "authorityUrl" TEXT,
  "logoS3Key" TEXT,
  "logoSha256" TEXT,
  "dmarcPolicy" TEXT,
  "certificateType" "MailBrandCertificateType" NOT NULL DEFAULT 'NONE',
  "certificateSubject" TEXT,
  "certificateIssuer" TEXT,
  "certificateSerial" TEXT,
  "certificateFingerprint" TEXT,
  "certificateValidFrom" TIMESTAMP(3),
  "certificateValidTo" TIMESTAMP(3),
  "certificateDomains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lastError" TEXT,
  "checkedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mail_sender_brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_apps_domainTrustStatus_idx" ON "mail_apps"("domainTrustStatus");
CREATE INDEX "mail_apps_domainReviewedById_idx" ON "mail_apps"("domainReviewedById");
CREATE INDEX "mail_messages_senderDomain_idx" ON "mail_messages"("senderDomain");
CREATE INDEX "mail_domain_verification_requests_mailAppId_status_idx" ON "mail_domain_verification_requests"("mailAppId", "status");
CREATE UNIQUE INDEX "mail_domain_verification_requests_one_pending_per_app_key"
  ON "mail_domain_verification_requests"("mailAppId")
  WHERE "status" = 'PENDING';
CREATE INDEX "mail_domain_verification_requests_domain_idx" ON "mail_domain_verification_requests"("domain");
CREATE INDEX "mail_domain_verification_requests_requestedById_idx" ON "mail_domain_verification_requests"("requestedById");
CREATE INDEX "mail_domain_verification_requests_reviewedById_idx" ON "mail_domain_verification_requests"("reviewedById");
CREATE INDEX "mail_domain_verification_requests_createdAt_idx" ON "mail_domain_verification_requests"("createdAt");
CREATE UNIQUE INDEX "mail_sender_brands_domain_key" ON "mail_sender_brands"("domain");
CREATE INDEX "mail_sender_brands_status_idx" ON "mail_sender_brands"("status");
CREATE INDEX "mail_sender_brands_expiresAt_idx" ON "mail_sender_brands"("expiresAt");

-- AddForeignKey
ALTER TABLE "mail_apps" ADD CONSTRAINT "mail_apps_domainReviewedById_fkey"
  FOREIGN KEY ("domainReviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mail_domain_verification_requests" ADD CONSTRAINT "mail_domain_verification_requests_mailAppId_fkey"
  FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mail_domain_verification_requests" ADD CONSTRAINT "mail_domain_verification_requests_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mail_domain_verification_requests" ADD CONSTRAINT "mail_domain_verification_requests_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
