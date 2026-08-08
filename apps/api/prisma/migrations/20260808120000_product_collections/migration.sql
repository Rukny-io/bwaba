-- CreateTable
CREATE TABLE "product_collections" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imagePath" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_collections_order_idx" ON "product_collections"("order");

-- CreateIndex
CREATE INDEX "product_collections_storeId_idx" ON "product_collections"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_collections_storeId_slug_key" ON "product_collections"("storeId", "slug");

-- CreateIndex
CREATE INDEX "product_collection_items_collectionId_idx" ON "product_collection_items"("collectionId");

-- CreateIndex
CREATE INDEX "product_collection_items_productId_idx" ON "product_collection_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_collection_items_collectionId_productId_key" ON "product_collection_items"("collectionId", "productId");

-- AddForeignKey
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_items" ADD CONSTRAINT "product_collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "product_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_items" ADD CONSTRAINT "product_collection_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
