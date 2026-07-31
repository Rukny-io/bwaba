-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "users" ADD COLUMN "passwordUpdatedAt" TIMESTAMP(3);
