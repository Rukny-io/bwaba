-- Developer wallets + transactions (schema models existed without a migration)

DO $$ BEGIN
  CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTransactionType" AS ENUM (
    'TOP_UP',
    'MESSAGE_CHARGE',
    'REFUND',
    'AUTO_RECHARGE',
    'ADJUSTMENT',
    'APP_ALLOCATION'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "developer_wallets" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'IQD',
  "autoRechargeEnabled" BOOLEAN NOT NULL DEFAULT false,
  "autoRechargeAmount" INTEGER,
  "autoRechargeThreshold" INTEGER,
  "lowBalanceAlert" INTEGER,
  "totalTopUps" INTEGER NOT NULL DEFAULT 0,
  "totalSpent" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "developer_wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "developer_wallets_userId_key" ON "developer_wallets"("userId");
CREATE INDEX IF NOT EXISTS "developer_wallets_userId_idx" ON "developer_wallets"("userId");
CREATE INDEX IF NOT EXISTS "developer_wallets_balance_idx" ON "developer_wallets"("balance");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'developer_wallets_userId_fkey'
  ) THEN
    ALTER TABLE "developer_wallets"
      ADD CONSTRAINT "developer_wallets_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceBefore" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "status" "WalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "description" TEXT,
  "referenceId" TEXT,
  "referenceType" TEXT,
  "paymentMethod" TEXT,
  "externalId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");
CREATE INDEX IF NOT EXISTS "wallet_transactions_type_idx" ON "wallet_transactions"("type");
CREATE INDEX IF NOT EXISTS "wallet_transactions_status_idx" ON "wallet_transactions"("status");
CREATE INDEX IF NOT EXISTS "wallet_transactions_createdAt_idx" ON "wallet_transactions"("createdAt");
CREATE INDEX IF NOT EXISTS "wallet_transactions_referenceId_idx" ON "wallet_transactions"("referenceId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_walletId_fkey'
  ) THEN
    ALTER TABLE "wallet_transactions"
      ADD CONSTRAINT "wallet_transactions_walletId_fkey"
      FOREIGN KEY ("walletId") REFERENCES "developer_wallets"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
