-- CreateEnum
CREATE TYPE "MailAppMemberRole" AS ENUM ('ADMIN', 'BILLING', 'MEMBER', 'VIEWER');

-- AlterTable
ALTER TABLE "mail_mailboxes" ADD COLUMN "assignedUserId" TEXT;

-- CreateTable
CREATE TABLE "mail_app_members" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MailAppMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_app_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_app_members_mailAppId_idx" ON "mail_app_members"("mailAppId");

-- CreateIndex
CREATE INDEX "mail_app_members_userId_idx" ON "mail_app_members"("userId");

-- CreateIndex
CREATE INDEX "mail_app_members_status_idx" ON "mail_app_members"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mail_app_members_mailAppId_userId_key" ON "mail_app_members"("mailAppId", "userId");

-- CreateIndex
CREATE INDEX "mail_mailboxes_assignedUserId_idx" ON "mail_mailboxes"("assignedUserId");

-- AddForeignKey
ALTER TABLE "mail_app_members" ADD CONSTRAINT "mail_app_members_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_app_members" ADD CONSTRAINT "mail_app_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_app_members" ADD CONSTRAINT "mail_app_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_mailboxes" ADD CONSTRAINT "mail_mailboxes_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
