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

Restart API.

### Dual-write vs direct encrypt

| `MAIL_BODY_ENCRYPTION_DUAL_WRITE` | New mail status | Plaintext in DB |
|-----------------------------------|-----------------|-----------------|
| `true` (staging pilot soak) | `MIGRATING` | Yes until `null-plaintext` |
| `false` (production default) | `ENCRYPTED` | No |

Defaults: `false` in production when unset; `true` in dev/test when unset.

After pilot soak on VPS:

```bash
MAIL_BODY_ENCRYPTION_DUAL_WRITE=false
MAIL_KMS_KEY_ID=alias/rukny-mail-body-encryption   # prod CMK for new mail
```

Keep IAM access to **both** staging and prod KMS keys so legacy rows decrypt.

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
- [vps-hardening-deploy.md](./vps-hardening-deploy.md)
- [phase-6-production-rollout.md](./phase-6-production-rollout.md)

## Rollout sequence (Doc 3)

1. Deploy code, flags **OFF**
2. Pilot: global ON + `bodyEncryptionEnabled` on app
3. `migrate` → dual-read soak → `null-plaintext` → `scan` (must be 0 violations)
4. Expand waves; repeat scan per cohort

## Rollback

```bash
MAIL_BODY_ENCRYPTION_ENABLED=false
# Or re-enable soak rollback:
MAIL_BODY_ENCRYPTION_DUAL_WRITE=true
```

While status is `MIGRATING`, plaintext fallback still works.

## VPS cron (recommended)

```bash
# Daily null-plaintext safety net (3am)
0 3 * * * cd /root/bwaba && docker compose exec -T api node dist/scripts/mail-body-encryption-null-plaintext.js >> /var/log/mail-null-plaintext.log 2>&1

# Weekly scan (Sunday 4am)
0 4 * * 0 cd /root/bwaba && docker compose exec -T api node dist/scripts/mail-body-encryption-scan.js >> /var/log/mail-encryption-scan.log 2>&1
```

Install via: `apps/api/scripts/install-mail-encryption-cron.sh`

## Production

- Do **not** use `MAIL_BODY_ENCRYPTION_DEV_FALLBACK`
- Set `MAIL_BODY_ENCRYPTION_DUAL_WRITE=false` after pilot soak
- Prod CMK: `./scripts/provision-mail-body-kms.sh production`; dual-key IAM: `./scripts/kms/attach-api-iam-dual-keys.sh`
- Do **not** announce until `scan` is clean for cohort
- See [ops-hardening-runbook.md](./ops-hardening-runbook.md)
