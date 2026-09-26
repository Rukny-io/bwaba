-- Email API: move entitlements and domains from account-scoped to per Developer App.

ALTER TABLE "developer_email_entitlements" ADD COLUMN "developerAppId" TEXT;

-- Assign existing entitlements to the earliest emailApi-installed app per user.
UPDATE "developer_email_entitlements" e
SET "developerAppId" = sub.app_id
FROM (
  SELECT DISTINCT ON (da."userId")
    da."userId",
    da.id AS app_id
  FROM "developer_apps" da
  INNER JOIN "developer_app_products" dap
    ON dap."developerAppId" = da.id AND dap."productId" = 'emailApi'
  ORDER BY da."userId", da."createdAt" ASC
) sub
WHERE e."userId" = sub."userId"
  AND e."developerAppId" IS NULL;

-- Fallback: first developer app for the user.
UPDATE "developer_email_entitlements" e
SET "developerAppId" = sub.app_id
FROM (
  SELECT DISTINCT ON (da."userId")
    da."userId",
    da.id AS app_id
  FROM "developer_apps" da
  ORDER BY da."userId", da."createdAt" ASC
) sub
WHERE e."userId" = sub."userId"
  AND e."developerAppId" IS NULL;

DELETE FROM "developer_email_entitlements" WHERE "developerAppId" IS NULL;

ALTER TABLE "developer_email_entitlements" DROP CONSTRAINT IF EXISTS "developer_email_entitlements_userId_key";
ALTER TABLE "developer_email_entitlements" ALTER COLUMN "developerAppId" SET NOT NULL;
CREATE UNIQUE INDEX "developer_email_entitlements_developerAppId_key"
  ON "developer_email_entitlements"("developerAppId");
CREATE INDEX "developer_email_entitlements_userId_idx"
  ON "developer_email_entitlements"("userId");

ALTER TABLE "developer_email_entitlements"
  ADD CONSTRAINT "developer_email_entitlements_developerAppId_fkey"
  FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Bootstrap FREE entitlements for emailApi apps that do not have one yet.
INSERT INTO "developer_email_entitlements" (
  "id",
  "userId",
  "developerAppId",
  "plan",
  "trialGrantedAt",
  "trialQuota",
  "freePeriodStart",
  "freePeriodEnd",
  "marketingContactsLimit",
  "automationRunsIncluded",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  da."userId",
  da.id,
  'FREE',
  NOW(),
  3000,
  NOW(),
  NOW() + INTERVAL '1 month',
  1000,
  10000,
  NOW(),
  NOW()
FROM "developer_apps" da
INNER JOIN "developer_app_products" dap
  ON dap."developerAppId" = da.id AND dap."productId" = 'emailApi'
WHERE NOT EXISTS (
  SELECT 1 FROM "developer_email_entitlements" e
  WHERE e."developerAppId" = da.id
);

-- Domains: scope to the app's entitlement (same user).
ALTER TABLE "developer_email_domains" ADD COLUMN "developerAppId" TEXT;

UPDATE "developer_email_domains" d
SET "developerAppId" = e."developerAppId"
FROM "developer_email_entitlements" e
WHERE d."userId" = e."userId"
  AND d."developerAppId" IS NULL;

-- Domains linked via senders on a specific app.
UPDATE "developer_email_domains" d
SET "developerAppId" = sub.app_id
FROM (
  SELECT DISTINCT ON (des."emailDomainId")
    des."emailDomainId",
    des."developerAppId" AS app_id
  FROM "developer_email_senders" des
  ORDER BY des."emailDomainId", des."createdAt" ASC
) sub
WHERE d.id = sub."emailDomainId"
  AND d."developerAppId" IS NULL;

DELETE FROM "developer_email_domains" WHERE "developerAppId" IS NULL;

ALTER TABLE "developer_email_domains" DROP CONSTRAINT IF EXISTS "developer_email_domains_userId_domain_key";
ALTER TABLE "developer_email_domains" ALTER COLUMN "developerAppId" SET NOT NULL;
CREATE UNIQUE INDEX "developer_email_domains_developerAppId_domain_key"
  ON "developer_email_domains"("developerAppId", "domain");
CREATE INDEX "developer_email_domains_developerAppId_status_idx"
  ON "developer_email_domains"("developerAppId", "status");

ALTER TABLE "developer_email_domains"
  ADD CONSTRAINT "developer_email_domains_developerAppId_fkey"
  FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
