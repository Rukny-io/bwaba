-- Geographic analytics: country + governorate codes (Iraq focus)
ALTER TABLE "form_geographic_analytics"
  ADD COLUMN IF NOT EXISTS "countryCode" TEXT,
  ADD COLUMN IF NOT EXISTS "governorateCode" TEXT;

UPDATE "form_geographic_analytics"
SET
  "countryCode" = COALESCE("countryCode", 'XX'),
  "governorateCode" = COALESCE("governorateCode", '')
WHERE "countryCode" IS NULL;

DROP INDEX IF EXISTS "form_geographic_analytics_formId_date_country_city_key";

CREATE UNIQUE INDEX IF NOT EXISTS "form_geographic_analytics_formId_date_countryCode_governorateCode_key"
  ON "form_geographic_analytics" ("formId", "date", "countryCode", "governorateCode");

CREATE INDEX IF NOT EXISTS "form_geographic_analytics_countryCode_governorateCode_idx"
  ON "form_geographic_analytics" ("countryCode", "governorateCode");
