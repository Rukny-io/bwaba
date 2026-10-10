-- Meta Business Portfolio requests (Developer Pro perk)
CREATE TABLE IF NOT EXISTS "meta_business_portfolio_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "developerAppId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "businessEmail" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "businessDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metaBusinessId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_business_portfolio_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "meta_business_portfolio_requests_userId_idx"
  ON "meta_business_portfolio_requests"("userId");
CREATE INDEX IF NOT EXISTS "meta_business_portfolio_requests_developerAppId_idx"
  ON "meta_business_portfolio_requests"("developerAppId");
CREATE INDEX IF NOT EXISTS "meta_business_portfolio_requests_status_idx"
  ON "meta_business_portfolio_requests"("status");
CREATE INDEX IF NOT EXISTS "meta_business_portfolio_requests_submittedAt_idx"
  ON "meta_business_portfolio_requests"("submittedAt");

ALTER TABLE "meta_business_portfolio_requests"
  DROP CONSTRAINT IF EXISTS "meta_business_portfolio_requests_userId_fkey";
ALTER TABLE "meta_business_portfolio_requests"
  ADD CONSTRAINT "meta_business_portfolio_requests_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meta_business_portfolio_requests"
  DROP CONSTRAINT IF EXISTS "meta_business_portfolio_requests_developerAppId_fkey";
ALTER TABLE "meta_business_portfolio_requests"
  ADD CONSTRAINT "meta_business_portfolio_requests_developerAppId_fkey"
  FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
