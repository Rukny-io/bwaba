# Database security and integrity audit

Audit date: 2026-10-14. Scope: `apps/api/prisma/schema.prisma`, all Prisma
migrations, the local PostgreSQL database, and database access configuration.

## Verified state

- PostgreSQL 16.14, 147 public tables, and 106 migrations after the repair.
- The local database had no application rows, so no duplicate or orphaned
  records were found in this environment.
- No row-level security policies exist.
- The local login role `rukny_admin` is a PostgreSQL superuser. This is
  acceptable only for a disposable local database and must not be used by the
  production API.
- The schema and live database now contain the same 151 Prisma models. The
  repair migration added `instagram_comments`, `email_change_requests`, and
  `wallpapers`, which were previously referenced by code but absent from the
  migration history.

## High-risk findings

1. **Raw bearer tokens are stored in database columns.** `quicksign_links.token`,
   `mail_app_email_invites.token`, and `download_tokens.token` are directly
   usable if the database or a backup is read. Store only a hash and compare
   the presented token against the hash. `MailSsoAccessLink` is the correct
   pattern to copy.
2. **Payment provider tokens are retained as plaintext.** `orders.paymentToken`
   and `mail_subscription_payments.paymentToken` should be encrypted with a
   key outside the database, or removed after the provider no longer needs
   them. Payment IDs should remain as non-secret references.
3. **OAuth protection depends on runtime encryption being enabled.** The
   encryption middleware covers Instagram, YouTube, LinkedIn, TikTok, calendar,
   form integrations, and selected user fields, but the Prisma columns remain
   `String`. Production must prove `FIELD_ENCRYPTION_ENABLED=true`, complete
   the backfill, rotate keys, and keep logs redacted. Any integration outside
   the encryption map remains plaintext.
4. **Webhook secrets are stored in plaintext.** `DeveloperWebhook.secret` must
   be encrypted or replaced with a one-way signing key plus a controlled
   rotation mechanism.
5. **The database has no application CHECK constraints.** Amounts, quantities,
   counters, mailbox seats, quotas, file sizes, dates, and balances can be
   made negative or inconsistent by a direct write or a missed service check.
   Add constraints for non-negative values and valid period relationships.

## Integrity and authorization risks

- Mail mailbox, alias, user email, and domain uniqueness is case-sensitive at
  the database layer. Normalize on every write and add lower-case functional
  unique indexes where PostgreSQL must enforce the invariant.
- `orders.paymentId` is indexed but not unique. A provider callback replay or
  two orders using the same provider ID can be accepted unless application
  code rejects it. Add a nullable unique index after checking production data.
- Wallet external references are indexed but not unique. Add a provider/type
  uniqueness rule before enabling automatic retries or reconciliation.
- Most user-owned records use `ON DELETE CASCADE`. This is convenient, but it
  can erase invoices, payment history, audit evidence, and legal records when
  a user is deleted. Billing, payment, security, and audit rows should use
  retention-safe `RESTRICT` or anonymization instead.
- The migration history previously lacked `migration_lock.toml`, which made
  migration-diff tooling unable to determine the provider. The lock file is
  now present and pins PostgreSQL.

## Required production controls

- Use separate least-privilege roles: runtime API, migration owner, and
  read-only analytics. Never run the API as a superuser.
- Enable encrypted backups, rotation, access logging, and restore drills.
- Add automated checks for orphan rows, duplicate normalized domains/emails,
  payment replay, negative balances, and expired bearer tokens.
- Run the migration status and schema-introspection checks in CI before deploy.
