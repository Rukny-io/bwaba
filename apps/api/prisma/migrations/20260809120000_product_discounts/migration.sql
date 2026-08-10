-- CreateTable
CREATE TABLE "product_discounts" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_discount_items" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_discount_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_discounts_storeId_idx" ON "product_discounts"("storeId");

-- CreateIndex
CREATE INDEX "product_discounts_isActive_idx" ON "product_discounts"("isActive");

-- CreateIndex
CREATE INDEX "product_discount_items_discountId_idx" ON "product_discount_items"("discountId");

-- CreateIndex
CREATE INDEX "product_discount_items_productId_idx" ON "product_discount_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_discount_items_discountId_productId_key" ON "product_discount_items"("discountId", "productId");

-- AddForeignKey
ALTER TABLE "product_discounts" ADD CONSTRAINT "product_discounts_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_discount_items" ADD CONSTRAINT "product_discount_items_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "product_discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_discount_items" ADD CONSTRAINT "product_discount_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
