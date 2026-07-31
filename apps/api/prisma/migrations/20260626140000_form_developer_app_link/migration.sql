-- Link forms to developer apps for embed + portal integration
ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "developerAppId" TEXT;

ALTER TABLE "developer_apps" ADD COLUMN IF NOT EXISTS "embedAllowedOrigins" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "forms_developerAppId_idx" ON "forms"("developerAppId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'forms_developerAppId_fkey'
  ) THEN
    ALTER TABLE "forms"
      ADD CONSTRAINT "forms_developerAppId_fkey"
      FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
