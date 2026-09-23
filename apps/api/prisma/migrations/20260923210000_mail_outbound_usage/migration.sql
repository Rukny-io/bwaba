-- Mail outbound usage counters for prepaid packs (Starter Usage)
ALTER TABLE "mail_subscriptions"
  ADD COLUMN IF NOT EXISTS "outboundUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "outboundPackCredits" INTEGER NOT NULL DEFAULT 0;
