-- Per-app Mail subscription (not per user) + mailbox storage usage

ALTER TABLE "mail_subscriptions" ADD COLUMN "mailAppId" TEXT;

UPDATE "mail_subscriptions" AS ms
SET "mailAppId" = (
  SELECT ma.id
  FROM "mail_apps" AS ma
  WHERE ma."userId" = ms."userId"
  ORDER BY ma."createdAt" ASC
  LIMIT 1
);

DELETE FROM "mail_subscriptions" WHERE "mailAppId" IS NULL;

DROP INDEX IF EXISTS "mail_subscriptions_userId_key";

ALTER TABLE "mail_subscriptions" ALTER COLUMN "mailAppId" SET NOT NULL;

CREATE UNIQUE INDEX "mail_subscriptions_mailAppId_key" ON "mail_subscriptions"("mailAppId");

CREATE INDEX "mail_subscriptions_userId_idx" ON "mail_subscriptions"("userId");

ALTER TABLE "mail_subscriptions"
  ADD CONSTRAINT "mail_subscriptions_mailAppId_fkey"
  FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mail_mailboxes" ADD COLUMN "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

UPDATE "mail_mailboxes" AS mb
SET "storageUsedBytes" = COALESCE((
  SELECT SUM(
    COALESCE(octet_length(mm."bodyText"), 0)
    + COALESCE(octet_length(mm."bodyHtml"), 0)
  )
  FROM "mail_messages" AS mm
  WHERE mm."mailboxId" = mb.id
), 0);
