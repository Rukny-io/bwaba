-- Unified Mail + Email API pricing: entitlement perks + mail app link

ALTER TABLE "developer_email_entitlements"
  ADD COLUMN IF NOT EXISTS "webhooksIncluded" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "aiCreditsMonthly" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "slackChannelEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "mail_apps"
  ADD COLUMN IF NOT EXISTS "linkedDeveloperAppId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mail_apps_linkedDeveloperAppId_fkey'
  ) THEN
    ALTER TABLE "mail_apps"
      ADD CONSTRAINT "mail_apps_linkedDeveloperAppId_fkey"
      FOREIGN KEY ("linkedDeveloperAppId") REFERENCES "developer_apps"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "mail_apps_linkedDeveloperAppId_idx"
  ON "mail_apps"("linkedDeveloperAppId");
