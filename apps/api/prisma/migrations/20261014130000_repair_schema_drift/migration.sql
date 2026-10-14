-- Repair schema objects present in schema.prisma and used by the API but
-- missing from the migration history/database.
-- Idempotent: local/dev DBs may already have these objects from earlier drift.

DO $$
BEGIN
  CREATE TYPE "EmailChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "instagram_comments" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "igCommentId" TEXT NOT NULL,
    "fromUsername" TEXT NOT NULL,
    "fromIgId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "isReply" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isReplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "instagram_comments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "instagram_comments_igCommentId_key"
  ON "instagram_comments"("igCommentId");
CREATE INDEX IF NOT EXISTS "instagram_comments_connectionId_isRead_idx"
  ON "instagram_comments"("connectionId", "isRead");
CREATE INDEX IF NOT EXISTS "instagram_comments_mediaId_idx"
  ON "instagram_comments"("mediaId");
DO $$
BEGIN
  ALTER TABLE "instagram_comments"
    ADD CONSTRAINT "instagram_comments_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "instagram_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "email_change_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldEmail" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "status" "EmailChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "browser" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_change_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "email_change_requests_userId_idx" ON "email_change_requests"("userId");
CREATE INDEX IF NOT EXISTS "email_change_requests_status_idx" ON "email_change_requests"("status");
CREATE INDEX IF NOT EXISTS "email_change_requests_createdAt_idx" ON "email_change_requests"("createdAt");
DO $$
BEGIN
  ALTER TABLE "email_change_requests"
    ADD CONSTRAINT "email_change_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "wallpapers" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallpapers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "wallpapers_s3Key_key" ON "wallpapers"("s3Key");
CREATE INDEX IF NOT EXISTS "wallpapers_isActive_sortOrder_idx"
  ON "wallpapers"("isActive", "sortOrder");
