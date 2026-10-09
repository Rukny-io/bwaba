-- ProductStatus.DISCONTINUED (soft-delete / hide from merchant lists)
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'DISCONTINUED';

-- Persist selected variant on order line items
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantAttributes" JSONB;

CREATE INDEX IF NOT EXISTS "order_items_variantId_idx" ON "order_items"("variantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_variantId_fkey'
  ) THEN
    ALTER TABLE "order_items"
      ADD CONSTRAINT "order_items_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
