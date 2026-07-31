-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailBlindIndex" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_emailBlindIndex_key" ON "users"("emailBlindIndex");
