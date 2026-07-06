-- CreateEnum
CREATE TYPE "TikTokBlockType" AS ENUM ('FEED');

-- CreateTable
CREATE TABLE "tiktok_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "openId" TEXT NOT NULL,
    "unionId" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "followers" INTEGER,
    "following" INTEGER,
    "likes" INTEGER,
    "videoCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiktok_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok_blocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TikTokBlockType" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiktok_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tiktok_connections_userId_key" ON "tiktok_connections"("userId");

-- AddForeignKey
ALTER TABLE "tiktok_connections" ADD CONSTRAINT "tiktok_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiktok_blocks" ADD CONSTRAINT "tiktok_blocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
