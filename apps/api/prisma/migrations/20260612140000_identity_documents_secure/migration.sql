-- Secure identity document storage (S3 keys + residence card + retention)
ALTER TABLE "identity_verifications" ADD COLUMN IF NOT EXISTS "residenceFrontKey" TEXT;
ALTER TABLE "identity_verifications" ADD COLUMN IF NOT EXISTS "residenceBackKey" TEXT;
ALTER TABLE "identity_verifications" ADD COLUMN IF NOT EXISTS "uploadSessionId" TEXT;
ALTER TABLE "identity_verifications" ADD COLUMN IF NOT EXISTS "documentsPurgeAt" TIMESTAMP(3);
ALTER TABLE "identity_verifications" ADD COLUMN IF NOT EXISTS "documentsDeletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "identity_verifications_documentsPurgeAt_idx"
  ON "identity_verifications"("documentsPurgeAt");
