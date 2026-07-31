-- Developer app settings: legal links, profile image, DPO, access review
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "profileImage" TEXT;
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "termsOfUseUrl" TEXT;
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "privacyPolicyUrl" TEXT;
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "dpoName" TEXT;
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "dpoEmail" TEXT;
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "dpoPhone" TEXT;
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "accessReviewRequestedAt" TIMESTAMP(3);
ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "accessVerified" BOOLEAN NOT NULL DEFAULT false;
