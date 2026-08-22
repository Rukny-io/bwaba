-- CreateTable
CREATE TABLE "mail_forwarders" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "keepCopy" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_forwarders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_forwarders_mailboxId_toAddress_key" ON "mail_forwarders"("mailboxId", "toAddress");

-- CreateIndex
CREATE INDEX "mail_forwarders_mailAppId_idx" ON "mail_forwarders"("mailAppId");

-- CreateIndex
CREATE INDEX "mail_forwarders_mailboxId_idx" ON "mail_forwarders"("mailboxId");

-- CreateIndex
CREATE INDEX "mail_forwarders_enabled_idx" ON "mail_forwarders"("enabled");

-- AddForeignKey
ALTER TABLE "mail_forwarders" ADD CONSTRAINT "mail_forwarders_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_forwarders" ADD CONSTRAINT "mail_forwarders_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
