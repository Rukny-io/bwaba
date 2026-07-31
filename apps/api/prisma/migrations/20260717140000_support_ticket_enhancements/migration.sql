-- Support ticket enhancements: internal notes + attachments

ALTER TABLE "support_ticket_messages"
ADD COLUMN "isInternal" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "support_ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "messageId" TEXT,
    "fileId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_ticket_attachments_fileId_key" ON "support_ticket_attachments"("fileId");
CREATE INDEX "support_ticket_attachments_ticketId_idx" ON "support_ticket_attachments"("ticketId");
CREATE INDEX "support_ticket_attachments_messageId_idx" ON "support_ticket_attachments"("messageId");

ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "support_ticket_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "user_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
