-- CreateEnum
CREATE TYPE "InstagramMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "instagram_inbox_conversations" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "participantIgId" TEXT NOT NULL,
    "participantName" TEXT,
    "participantUsername" TEXT,
    "participantPicUrl" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageText" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "messagingWindowExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_inbox_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_inbox_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "InstagramMessageDirection" NOT NULL,
    "igMessageId" TEXT,
    "text" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_inbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_inbox_conversations_connectionId_participantIgId_key" ON "instagram_inbox_conversations"("connectionId", "participantIgId");

-- CreateIndex
CREATE INDEX "instagram_inbox_conversations_connectionId_lastMessageAt_idx" ON "instagram_inbox_conversations"("connectionId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_inbox_messages_igMessageId_key" ON "instagram_inbox_messages"("igMessageId");

-- CreateIndex
CREATE INDEX "instagram_inbox_messages_conversationId_sentAt_idx" ON "instagram_inbox_messages"("conversationId", "sentAt");

-- AddForeignKey
ALTER TABLE "instagram_inbox_conversations" ADD CONSTRAINT "instagram_inbox_conversations_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "instagram_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_inbox_messages" ADD CONSTRAINT "instagram_inbox_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "instagram_inbox_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
