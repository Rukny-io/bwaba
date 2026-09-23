-- Mail card payments via Al-Qaseh
ALTER TABLE "mail_subscription_payments"
  ADD COLUMN IF NOT EXISTS "paymentId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "mail_subscription_payments_paymentId_key"
  ON "mail_subscription_payments"("paymentId");
