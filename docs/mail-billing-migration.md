# Mail billing migration runbook

This migration introduces one `MailBillingAccount` per user and keeps the
existing per-app `MailSubscription` rows as billing history during rollout.
Each Mail app gets one `MailAppSeatAllocation` row. The allocation is the
boundary used by mailbox and domain quota checks.

## Deployment order

1. Take a database backup and deploy the API release containing the Prisma
   migration `20261014120000_mail_billing_accounts`.
2. Run `prisma migrate deploy` before starting API instances that use the new
   client.
3. Review owners with more than one active legacy subscription. The API returns
   `MAIL_BILLING_MIGRATION_REQUIRED` for quota-changing operations until those
   subscriptions are reconciled; no paid period is merged automatically.
4. For an unambiguous owner, link the canonical subscription to the billing
   account and set the per-app seat allocations from the paid seat count.
5. Smoke-test: create a second Mail app, verify a domain, create a mailbox,
   attempt to exceed account seats, and renew a paid subscription.

## Invariants

- A billing account has at most one canonical subscription.
- A Mail app has one primary domain and one allocation row.
- Active mailbox count across all apps cannot exceed the account subscription
  seat count.
- Domain quota is counted across active apps in the billing account.
- Legacy subscriptions remain intact until an operator has reviewed their
  period, plan, seats, and payment history.
