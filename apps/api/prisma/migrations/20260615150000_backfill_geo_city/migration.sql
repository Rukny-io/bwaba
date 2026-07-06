-- Normalize Cloudflare city variants and backfill legacy rows missing city.
UPDATE "form_geographic_analytics"
SET "city" = 'Hillah'
WHERE lower(trim("city")) IN ('al hillah', 'al-hillah', 'alhillah', 'hilla');

UPDATE "form_geographic_analytics"
SET "city" = CASE "governorateCode"
  WHEN 'IQ-AN' THEN 'Ramadi'
  WHEN 'IQ-BA' THEN 'Basra'
  WHEN 'IQ-MU' THEN 'Samawah'
  WHEN 'IQ-QA' THEN 'Diwaniyah'
  WHEN 'IQ-NA' THEN 'Najaf'
  WHEN 'IQ-AR' THEN 'Erbil'
  WHEN 'IQ-SU' THEN 'Sulaymaniyah'
  WHEN 'IQ-NI' THEN 'Mosul'
  WHEN 'IQ-DI' THEN 'Baqubah'
  WHEN 'IQ-BG' THEN 'Baghdad'
  WHEN 'IQ-BB' THEN 'Hillah'
  WHEN 'IQ-KA' THEN 'Karbala'
  WHEN 'IQ-DA' THEN 'Duhok'
  WHEN 'IQ-WA' THEN 'Kut'
  WHEN 'IQ-SD' THEN 'Tikrit'
  WHEN 'IQ-MA' THEN 'Amarah'
  WHEN 'IQ-DQ' THEN 'Nasiriyah'
  WHEN 'IQ-KI' THEN 'Kirkuk'
  ELSE "city"
END
WHERE "city" = ''
  AND "countryCode" = 'IQ'
  AND "governorateCode" <> '';

UPDATE "form_geographic_analytics"
SET "city" = 'Unknown'
WHERE "city" = '';

-- Merge rows that now share the same unique key.
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
