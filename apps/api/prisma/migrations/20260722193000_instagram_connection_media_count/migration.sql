-- Add missing profile fields and multi-account unique key for Instagram connections
ALTER TABLE "instagram_connections" ADD COLUMN IF NOT EXISTS "mediaCount" INTEGER;

-- Allow multiple IG accounts per user (schema: @@unique([userId, igUserId]))
DROP INDEX IF EXISTS "instagram_connections_userId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "instagram_connections_userId_igUserId_key"
  ON "instagram_connections"("userId", "igUserId");

CREATE INDEX IF NOT EXISTS "instagram_connections_userId_idx"
  ON "instagram_connections"("userId");
