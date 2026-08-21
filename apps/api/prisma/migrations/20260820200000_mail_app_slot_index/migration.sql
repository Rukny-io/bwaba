-- AlterTable
ALTER TABLE "mail_apps" ADD COLUMN "slotIndex" INTEGER;

-- Backfill stable per-user slots by creation order
WITH ranked AS (
  SELECT id,
         (ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" ASC) - 1)::INTEGER AS idx
  FROM "mail_apps"
)
UPDATE "mail_apps" AS m
SET "slotIndex" = ranked.idx
FROM ranked
WHERE m.id = ranked.id;

ALTER TABLE "mail_apps" ALTER COLUMN "slotIndex" SET NOT NULL;

CREATE UNIQUE INDEX "mail_apps_userId_slotIndex_key" ON "mail_apps"("userId", "slotIndex");
