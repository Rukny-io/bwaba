-- CreateTable
CREATE TABLE "mail_aliases" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_aliases_domain_localPart_key" ON "mail_aliases"("domain", "localPart");

-- CreateIndex
CREATE INDEX "mail_aliases_mailAppId_idx" ON "mail_aliases"("mailAppId");

-- CreateIndex
CREATE INDEX "mail_aliases_mailboxId_idx" ON "mail_aliases"("mailboxId");

-- CreateIndex
CREATE INDEX "mail_aliases_enabled_idx" ON "mail_aliases"("enabled");

-- AddForeignKey
ALTER TABLE "mail_aliases" ADD CONSTRAINT "mail_aliases_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_aliases" ADD CONSTRAINT "mail_aliases_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
