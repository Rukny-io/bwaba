-- AlterTable
ALTER TABLE "mail_apps"
ADD COLUMN "domainOwnershipToken" TEXT,
ADD COLUMN "domainOwnershipVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "developer_email_domains"
ADD COLUMN "ownershipToken" TEXT,
ADD COLUMN "ownershipVerifiedAt" TIMESTAMP(3);

-- Partial unique: one ACTIVE Mail workspace per primary domain
CREATE UNIQUE INDEX "mail_apps_primary_domain_active_idx"
ON "mail_apps" ("primaryDomain")
WHERE "status" = 'ACTIVE' AND "primaryDomain" IS NOT NULL;

-- Partial unique: one VERIFIED Email API domain globally
CREATE UNIQUE INDEX "developer_email_domains_domain_verified_idx"
ON "developer_email_domains" ("domain")
WHERE "status" = 'VERIFIED';
