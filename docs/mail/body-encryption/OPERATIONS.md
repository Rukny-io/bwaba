# Mail Body Encryption — Operations Guide

**Change ID:** CRD-MAIL-ENC-001

## Prerequisites

1. Apply migration: `cd apps/api && npm run migrate`
2. KMS (staging/prod): `./scripts/provision-mail-body-kms.sh staging`
3. Or local dev: `MAIL_BODY_ENCRYPTION_DEV_FALLBACK=true` + `FIELD_ENCRYPTION_KEY` (64 hex)

## Enable encryption (staging pilot)

```bash
# API environment
MAIL_BODY_ENCRYPTION_ENABLED=true
MAIL_KMS_KEY_ID=alias/rukny-mail-body-encryption-staging
```

```sql
UPDATE mail_apps SET "bodyEncryptionEnabled" = true WHERE id = '<mail-app-uuid>';
```

Restart API. New mail is stored as `MIGRATING` (dual-write plaintext + ciphertext).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run mail:body-encryption:kms-verify` | KMS / dev-fallback round-trip check |
| `npm run mail:body-encryption:pilot -- --list` | List apps + encryption flags |
| `npm run mail:body-encryption:pilot -- --enable <id>` | Enable pilot app |
| `npm run mail:body-encryption:staging-validate` | Staging gate (flags, KMS, scan, decrypt) |
| `npm run mail:body-encryption:gate` | Full gate: kms-verify + staging-validate + scan |
| `npm run mail:body-encryption:migrate` | Backfill existing rows (`--dry-run` optional) |
| `npm run mail:body-encryption:null-plaintext` | P5: null plaintext after verify (`--dry-run`) |
| `npm run mail:body-encryption:scan` | Find ENCRYPTED rows that still have plaintext |

## Staging / production runbooks

- [staging-kms-provisioning.md](./staging-kms-provisioning.md)
- [staging-pilot-runbook.md](./staging-pilot-runbook.md)
- [phase-6-production-rollout.md](./phase-6-production-rollout.md)

## Rollout sequence (Doc 3)

1. Deploy code, flags **OFF**
2. Pilot: global ON + `bodyEncryptionEnabled` on app
3. `migrate` → dual-read soak → `null-plaintext` → `scan` (must be 0 violations)
4. Expand waves; repeat scan per cohort

## Rollback

```bash
MAIL_BODY_ENCRYPTION_ENABLED=false
```

While status is `MIGRATING`, plaintext fallback still works.

## Production

- Do **not** use `MAIL_BODY_ENCRYPTION_DEV_FALLBACK`
- Do **not** announce until `scan` is clean for cohort
- See [ops-hardening-runbook.md](./ops-hardening-runbook.md)
