-- Developer subscriptions: add PRO tier, migrate legacy plans
ALTER TYPE "DeveloperPlan" ADD VALUE 'PRO';

UPDATE "developer_subscriptions"
SET "plan" = 'PRO'
WHERE "plan" IN ('STARTER', 'GROWTH', 'ENTERPRISE');
