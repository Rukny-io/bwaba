-- Digital checkout orders do not have a shipping address. Keep the database
-- constraint aligned with the Prisma schema and createDirectMultiItem().
ALTER TABLE "orders" ALTER COLUMN "addressId" DROP NOT NULL;
