-- CreateEnum
CREATE TYPE "MailBodyCryptoStatus" AS ENUM ('NONE', 'MIGRATING', 'ENCRYPTED');

-- AlterTable
ALTER TABLE "mail_apps" ADD COLUMN "bodyEncryptionEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "mail_messages" ADD COLUMN "bodyCryptoStatus" "MailBodyCryptoStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "mail_messages" ADD COLUMN "bodyCryptoVersion" INTEGER;
ALTER TABLE "mail_messages" ADD COLUMN "bodyKmsKeyId" TEXT;
ALTER TABLE "mail_messages" ADD COLUMN "bodyEncryptedDek" BYTEA;
ALTER TABLE "mail_messages" ADD COLUMN "bodyTextCiphertext" BYTEA;
ALTER TABLE "mail_messages" ADD COLUMN "bodyHtmlCiphertext" BYTEA;

-- CreateIndex
CREATE INDEX "mail_messages_bodyCryptoStatus_idx" ON "mail_messages"("bodyCryptoStatus");
