-- Rukny Verified (blue badge) applications
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isRuknyVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ruknyVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verifiedCategory" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verifiedDisplayName" TEXT;

CREATE TABLE IF NOT EXISTS "rukny_verified_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "publicBio" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "socialLinks" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rukny_verified_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rukny_verified_applications_userId_idx" ON "rukny_verified_applications"("userId");
CREATE INDEX IF NOT EXISTS "rukny_verified_applications_status_idx" ON "rukny_verified_applications"("status");

ALTER TABLE "rukny_verified_applications" DROP CONSTRAINT IF EXISTS "rukny_verified_applications_userId_fkey";
ALTER TABLE "rukny_verified_applications" ADD CONSTRAINT "rukny_verified_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
