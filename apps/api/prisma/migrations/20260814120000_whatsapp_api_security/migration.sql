-- WhatsApp API security: per-app webhooks
ALTER TABLE "developer_webhooks" ADD COLUMN IF NOT EXISTS "developerAppId" TEXT;

CREATE INDEX IF NOT EXISTS "developer_webhooks_developerAppId_idx"
  ON "developer_webhooks"("developerAppId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developer_webhooks_developerAppId_fkey'
  ) THEN
    ALTER TABLE "developer_webhooks"
      ADD CONSTRAINT "developer_webhooks_developerAppId_fkey"
      FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
