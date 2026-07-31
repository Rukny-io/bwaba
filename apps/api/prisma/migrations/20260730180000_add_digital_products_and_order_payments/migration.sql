-- Digital products + order payment gateway fields.
-- These exist in schema.prisma but were never applied via a Prisma migration.
-- Safe/idempotent for production (IF NOT EXISTS / duplicate_object guards).

-- Enums
DO $$ BEGIN
  CREATE TYPE "OrderPaymentMethod" AS ENUM ('CASH', 'QASEH_CARD', 'BANK_TRANSFER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrderPaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- products.isDigital
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isDigital" BOOLEAN NOT NULL DEFAULT false;

-- order_items.isDigital
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "isDigital" BOOLEAN NOT NULL DEFAULT false;

-- orders payment gateway columns
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" "OrderPaymentMethod" NOT NULL DEFAULT 'CASH';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentToken" TEXT;

CREATE INDEX IF NOT EXISTS "orders_paymentId_idx" ON "orders"("paymentId");

-- digital_assets
CREATE TABLE IF NOT EXISTS "digital_assets" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" BIGINT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "previewKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "digital_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "digital_assets_fileKey_key" ON "digital_assets"("fileKey");
CREATE INDEX IF NOT EXISTS "digital_assets_productId_idx" ON "digital_assets"("productId");

DO $$ BEGIN
  ALTER TABLE "digital_assets"
    ADD CONSTRAINT "digital_assets_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- download_tokens
CREATE TABLE IF NOT EXISTS "download_tokens" (
  "id" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "maxDownloads" INTEGER NOT NULL DEFAULT 5,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "download_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "download_tokens_token_key" ON "download_tokens"("token");
CREATE INDEX IF NOT EXISTS "download_tokens_token_idx" ON "download_tokens"("token");
CREATE INDEX IF NOT EXISTS "download_tokens_orderItemId_idx" ON "download_tokens"("orderItemId");
CREATE INDEX IF NOT EXISTS "download_tokens_expiresAt_idx" ON "download_tokens"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "download_tokens"
    ADD CONSTRAINT "download_tokens_orderItemId_fkey"
    FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
