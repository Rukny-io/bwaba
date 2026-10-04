-- Standalone Mail plans: FREE | STARTER | PROFESSIONAL | CUSTOM
-- Maps legacy STANDARD/PREMIUM → PROFESSIONAL

CREATE TYPE "MailPlan_new" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'CUSTOM');

ALTER TABLE "mail_subscriptions"
  ALTER COLUMN "plan" TYPE "MailPlan_new"
  USING (
    CASE "plan"::text
      WHEN 'STARTER' THEN 'STARTER'::"MailPlan_new"
      WHEN 'STANDARD' THEN 'PROFESSIONAL'::"MailPlan_new"
      WHEN 'PREMIUM' THEN 'PROFESSIONAL'::"MailPlan_new"
      ELSE 'STARTER'::"MailPlan_new"
    END
  );

DROP TYPE "MailPlan";
ALTER TYPE "MailPlan_new" RENAME TO "MailPlan";
