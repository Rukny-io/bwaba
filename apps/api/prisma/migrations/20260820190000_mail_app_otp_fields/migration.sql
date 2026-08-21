-- AlterEnum
ALTER TYPE "OtpType" ADD VALUE 'MAIL_APP_VERIFICATION';

-- CreateEnum
CREATE TYPE "MailAppType" AS ENUM ('BUSINESS', 'CONSUMER');

-- AlterTable
ALTER TABLE "mail_apps" ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "appType" "MailAppType" NOT NULL DEFAULT 'BUSINESS';
