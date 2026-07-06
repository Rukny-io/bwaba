-- CreateTable
CREATE TABLE "developer_app_products" (
    "id" TEXT NOT NULL,
    "developerAppId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installedBy" TEXT NOT NULL,

    CONSTRAINT "developer_app_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "developer_app_products_developerAppId_productId_key" ON "developer_app_products"("developerAppId", "productId");

-- CreateIndex
CREATE INDEX "developer_app_products_developerAppId_idx" ON "developer_app_products"("developerAppId");

-- CreateIndex
CREATE INDEX "developer_app_products_productId_idx" ON "developer_app_products"("productId");

-- AddForeignKey
ALTER TABLE "developer_app_products" ADD CONSTRAINT "developer_app_products_developerAppId_fkey" FOREIGN KEY ("developerAppId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: apps with linked forms → forms product installed
INSERT INTO "developer_app_products" ("id", "developerAppId", "productId", "installedAt", "installedBy")
SELECT
    gen_random_uuid()::text,
    da."id",
    'forms',
    COALESCE(MIN(f."createdAt"), da."createdAt"),
    da."userId"
FROM "developer_apps" da
INNER JOIN "forms" f ON f."developerAppId" = da."id"
WHERE da."status" <> 'DELETED'
GROUP BY da."id", da."userId", da."createdAt"
ON CONFLICT ("developerAppId", "productId") DO NOTHING;

-- Backfill: apps with WhatsApp accounts → whatsapp product installed
INSERT INTO "developer_app_products" ("id", "developerAppId", "productId", "installedAt", "installedBy")
SELECT
    gen_random_uuid()::text,
    da."id",
    'whatsapp',
    COALESCE(MIN(wa."createdAt"), da."createdAt"),
    da."userId"
FROM "developer_apps" da
INNER JOIN "developer_whatsapp_accounts" wa ON wa."developerAppId" = da."id"
WHERE da."status" <> 'DELETED'
GROUP BY da."id", da."userId", da."createdAt"
ON CONFLICT ("developerAppId", "productId") DO NOTHING;
