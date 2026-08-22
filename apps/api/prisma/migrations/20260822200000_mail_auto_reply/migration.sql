-- CreateTable
CREATE TABLE "mail_auto_replies" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "subject" TEXT NOT NULL DEFAULT '',
    "bodyText" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_auto_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_auto_reply_receipts" (
    "id" TEXT NOT NULL,
    "autoReplyId" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_auto_reply_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_auto_replies_mailboxId_key" ON "mail_auto_replies"("mailboxId");

-- CreateIndex
CREATE INDEX "mail_auto_replies_mailAppId_idx" ON "mail_auto_replies"("mailAppId");

-- CreateIndex
CREATE INDEX "mail_auto_replies_enabled_idx" ON "mail_auto_replies"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "mail_auto_reply_receipts_autoReplyId_toAddress_key" ON "mail_auto_reply_receipts"("autoReplyId", "toAddress");

-- CreateIndex
CREATE INDEX "mail_auto_reply_receipts_sentAt_idx" ON "mail_auto_reply_receipts"("sentAt");

-- AddForeignKey
ALTER TABLE "mail_auto_replies" ADD CONSTRAINT "mail_auto_replies_mailAppId_fkey" FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_auto_replies" ADD CONSTRAINT "mail_auto_replies_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mail_mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_auto_reply_receipts" ADD CONSTRAINT "mail_auto_reply_receipts_autoReplyId_fkey" FOREIGN KEY ("autoReplyId") REFERENCES "mail_auto_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
