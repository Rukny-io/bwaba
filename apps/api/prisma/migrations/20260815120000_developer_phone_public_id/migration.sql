-- Public numeric phoneId for developer phone numbers (like DeveloperApp.appId)

ALTER TABLE "developer_phone_numbers" ADD COLUMN IF NOT EXISTS "phoneId" TEXT;

DO $$
DECLARE
  r RECORD;
  new_id TEXT;
  done BOOLEAN;
BEGIN
  FOR r IN SELECT id FROM "developer_phone_numbers" WHERE "phoneId" IS NULL LOOP
    done := FALSE;
    WHILE NOT done LOOP
      new_id := LEFT(
        (FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000))::bigint::text ||
        (FLOOR(random() * 900 + 100))::int::text,
        16
      );
      IF NOT EXISTS (SELECT 1 FROM "developer_phone_numbers" WHERE "phoneId" = new_id) THEN
        UPDATE "developer_phone_numbers" SET "phoneId" = new_id WHERE id = r.id;
        done := TRUE;
      END IF;
    END LOOP;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "developer_phone_numbers_phoneId_key"
  ON "developer_phone_numbers"("phoneId");

ALTER TABLE "developer_phone_numbers" ALTER COLUMN "phoneId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "developer_phone_numbers_phoneId_idx"
  ON "developer_phone_numbers"("phoneId");
