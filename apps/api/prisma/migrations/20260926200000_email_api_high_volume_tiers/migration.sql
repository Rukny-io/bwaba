-- Extend Email API plan enums for high-volume tiers
ALTER TYPE "DeveloperEmailPlan" ADD VALUE IF NOT EXISTS 'SCALE_1_5M';
ALTER TYPE "DeveloperEmailPlan" ADD VALUE IF NOT EXISTS 'SCALE_2_5M';

ALTER TYPE "DeveloperEmailMarketingPlan" ADD VALUE IF NOT EXISTS 'PRO_15K';
ALTER TYPE "DeveloperEmailMarketingPlan" ADD VALUE IF NOT EXISTS 'PRO_150K';
