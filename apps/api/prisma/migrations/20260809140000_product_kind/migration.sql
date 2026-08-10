-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('PHYSICAL', 'DIGITAL', 'SERVICE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "productKind" "ProductKind" NOT NULL DEFAULT 'PHYSICAL';

-- Backfill digital products
UPDATE "products" SET "productKind" = 'DIGITAL' WHERE "isDigital" = true;
