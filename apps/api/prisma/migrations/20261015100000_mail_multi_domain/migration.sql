-- Introduce first-class Mail domains while preserving the legacy primaryDomain
-- fields for a safe, online migration.
CREATE TABLE "mail_domains" (
  "id" TEXT NOT NULL,
  "mailAppId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "status" "MailDomainStatus" NOT NULL DEFAULT 'NONE',
  "checkedAt" TIMESTAMP(3),
  "ownershipToken" TEXT,
  "ownershipVerifiedAt" TIMESTAMP(3),
  "trustStatus" "MailDomainTrustStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mail_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mail_domains_domain_key" ON "mail_domains"("domain");
CREATE UNIQUE INDEX "mail_domains_mailAppId_domain_key" ON "mail_domains"("mailAppId", "domain");
CREATE INDEX "mail_domains_mailAppId_status_idx" ON "mail_domains"("mailAppId", "status");
CREATE INDEX "mail_domains_status_idx" ON "mail_domains"("status");

ALTER TABLE "mail_mailboxes" ADD COLUMN "domainId" TEXT;
CREATE INDEX "mail_mailboxes_domainId_idx" ON "mail_mailboxes"("domainId");

INSERT INTO "mail_domains" (
  "id", "mailAppId", "domain", "status", "checkedAt",
  "ownershipToken", "ownershipVerifiedAt", "trustStatus", "verifiedAt",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text, "id", lower(trim("primaryDomain")), "domainStatus",
  "domainCheckedAt", "domainOwnershipToken", "domainOwnershipVerifiedAt",
  "domainTrustStatus", "domainVerifiedAt", "createdAt", CURRENT_TIMESTAMP
FROM "mail_apps"
WHERE "primaryDomain" IS NOT NULL
ON CONFLICT ("domain") DO NOTHING;

UPDATE "mail_mailboxes" AS mb
SET "domainId" = md."id"
FROM "mail_domains" AS md
WHERE md."mailAppId" = mb."mailAppId"
  AND md."domain" = lower(trim(mb."domain"));

ALTER TABLE "mail_domains"
  ADD CONSTRAINT "mail_domains_mailAppId_fkey"
  FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_mailboxes"
  ADD CONSTRAINT "mail_mailboxes_domainId_fkey"
  FOREIGN KEY ("domainId") REFERENCES "mail_domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
