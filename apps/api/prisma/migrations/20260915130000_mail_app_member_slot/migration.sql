-- AlterTable
ALTER TABLE "mail_app_members" ADD COLUMN "slotIndex" INTEGER;

-- CreateIndex
CREATE INDEX "mail_app_members_userId_slotIndex_idx" ON "mail_app_members"("userId", "slotIndex");
