-- Track geographic analytics per city (not only governorate).
UPDATE "form_geographic_analytics"
SET "city" = COALESCE("city", '')
WHERE "city" IS NULL;

-- Merge rows that shared the same governorate key but had no city dimension.
CREATE TEMP TABLE "_form_geo_dedup" AS
SELECT
  (array_agg("id" ORDER BY "views" DESC, "createdAt" ASC))[1] AS "id",
  "formId",
  "date",
  MAX("country") AS "country",
  "countryCode",
  "governorateCode",
  "city",
  SUM("views")::integer AS "views",
  SUM("submissions")::integer AS "submissions",
  MIN("createdAt") AS "createdAt"
FROM "form_geographic_analytics"
GROUP BY "formId", "date", "countryCode", "governorateCode", "city";

DELETE FROM "form_geographic_analytics";

INSERT INTO "form_geographic_analytics" (
  "id",
  "formId",
  "date",
  "country",
  "countryCode",
  "governorateCode",
  "city",
  "views",
  "submissions",
  "createdAt"
)
SELECT
  "id",
  "formId",
  "date",
  "country",
  "countryCode",
  "governorateCode",
  "city",
  "views",
  "submissions",
  "createdAt"
FROM "_form_geo_dedup";

DROP TABLE "_form_geo_dedup";

ALTER TABLE "form_geographic_analytics"
  ALTER COLUMN "city" SET DEFAULT '',
  ALTER COLUMN "city" SET NOT NULL;

DROP INDEX IF EXISTS "form_geographic_analytics_formId_date_countryCode_governorateCode_key";

CREATE UNIQUE INDEX "form_geographic_analytics_formId_date_countryCode_governorateCode_city_key"
  ON "form_geographic_analytics" ("formId", "date", "countryCode", "governorateCode", "city");
