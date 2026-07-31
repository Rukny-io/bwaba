-- AlterTable: social_links connection for rich Instagram layouts
ALTER TABLE "social_links" ADD COLUMN IF NOT EXISTS "connectionId" TEXT;

CREATE INDEX IF NOT EXISTS "social_links_connectionId_idx" ON "social_links"("connectionId");

-- AlterTable: Instagram profile snapshot fields for ID cards
ALTER TABLE "instagram_connections" ADD COLUMN IF NOT EXISTS "biography" TEXT;
ALTER TABLE "instagram_connections" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "instagram_connections" ADD COLUMN IF NOT EXISTS "followsCount" INTEGER;
