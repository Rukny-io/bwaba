-- CreateEnum
CREATE TYPE "MailAppStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "mail_apps" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "MailAppStatus" NOT NULL DEFAULT 'ACTIVE',
    "primaryDomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_apps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_apps_appId_key" ON "mail_apps"("appId");

-- CreateIndex
CREATE INDEX "mail_apps_userId_idx" ON "mail_apps"("userId");

-- CreateIndex
CREATE INDEX "mail_apps_status_idx" ON "mail_apps"("status");

-- CreateIndex
CREATE INDEX "mail_apps_createdAt_idx" ON "mail_apps"("createdAt");

-- AddForeignKey
ALTER TABLE "mail_apps" ADD CONSTRAINT "mail_apps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
