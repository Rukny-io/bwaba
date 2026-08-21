-- CreateEnum
CREATE TYPE "MailPlan" AS ENUM ('STARTER', 'STANDARD', 'PREMIUM');

-- CreateTable
CREATE TABLE "mail_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "MailPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "mailboxCount" INTEGER NOT NULL DEFAULT 1,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_subscription_payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "mailboxCount" INTEGER NOT NULL DEFAULT 1,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "receiptUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mail_subscriptions_userId_key" ON "mail_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "mail_subscriptions_plan_idx" ON "mail_subscriptions"("plan");

-- CreateIndex
CREATE INDEX "mail_subscriptions_status_idx" ON "mail_subscriptions"("status");

-- CreateIndex
CREATE INDEX "mail_subscriptions_currentPeriodEnd_idx" ON "mail_subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "mail_subscription_payments_subscriptionId_idx" ON "mail_subscription_payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "mail_subscription_payments_status_idx" ON "mail_subscription_payments"("status");

-- CreateIndex
CREATE INDEX "mail_subscription_payments_createdAt_idx" ON "mail_subscription_payments"("createdAt");

-- AddForeignKey
ALTER TABLE "mail_subscriptions" ADD CONSTRAINT "mail_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_subscription_payments" ADD CONSTRAINT "mail_subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "mail_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
