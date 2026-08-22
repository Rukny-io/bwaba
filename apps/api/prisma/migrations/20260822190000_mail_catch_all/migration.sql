-- CreateTable
CREATE TABLE "mail_catch_alls" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_catch_alls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_catch_alls_mailAppId_key" ON "mail_catch_alls"("mailAppId");

-- CreateIndex
CREATE INDEX "mail_catch_alls_mailboxId_idx" ON "mail_catch_alls"("mailboxId");

-- AddForeignKey
ALTER TABLE "mail_catch_alls" ADD CONSTRAINT "mail_catch_alls_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_catch_alls" ADD CONSTRAINT "mail_catch_alls_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
