-- Developer subscription payments (missing from initial developer_subscriptions migration)
DO $$ BEGIN
  CREATE TYPE "DeveloperPaymentType" AS ENUM ('SUBSCRIPTION', 'TOP_UP', 'OVERAGE', 'REFUND');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "developer_payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "DeveloperPaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "paymentMethod" TEXT,
    "externalId" TEXT,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "developer_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "developer_payments_subscriptionId_idx" ON "developer_payments"("subscriptionId");
CREATE INDEX IF NOT EXISTS "developer_payments_type_idx" ON "developer_payments"("type");
CREATE INDEX IF NOT EXISTS "developer_payments_status_idx" ON "developer_payments"("status");
CREATE INDEX IF NOT EXISTS "developer_payments_createdAt_idx" ON "developer_payments"("createdAt");

DO $$ BEGIN
  ALTER TABLE "developer_payments"
    ADD CONSTRAINT "developer_payments_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "developer_subscriptions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
