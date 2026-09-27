-- Add PRO_25K transactional tier (unified Mail + Email API pricing).
ALTER TYPE "DeveloperEmailPlan" ADD VALUE IF NOT EXISTS 'PRO_25K';
