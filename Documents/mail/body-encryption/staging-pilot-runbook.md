# Staging Pilot — Mail Body Encryption

**Change ID:** CRD-MAIL-ENC-001

## Preconditions

- [ ] Staging KMS provisioned ([staging-kms-provisioning.md](./staging-kms-provisioning.md))
- [ ] `npm run mail:body-encryption:kms-verify` passes against staging DB + KMS
- [ ] Code deployed with migration applied; global flag **OFF**

## 1. Select pilot MailApp

Internal dogfood workspace only. List apps:

```bash
cd apps/api
npm run mail:body-encryption:pilot -- --list
```

Enable one app:

```bash
npm run mail:body-encryption:pilot -- --enable <mail-app-uuid>
```

Or SQL:

```sql
UPDATE mail_apps SET "bodyEncryptionEnabled" = true WHERE id = '<mail-app-uuid>';
```

## 2. Enable global flag on staging API

Set `MAIL_BODY_ENCRYPTION_ENABLED=true` in staging secrets. Redeploy/restart API.

## 3. Smoke test (manual E2E)

- Send mail from pilot app
- Receive inbound to pilot mailbox
- List messages (bodies omitted)
- Open message (decrypt succeeds)
- Star / move / delete still work

## 4. Rollback drill

Set `MAIL_BODY_ENCRYPTION_ENABLED=false`, restart. Confirm plaintext read still works for `MIGRATING` rows.

## Sign-off

| Check | Done |
|-------|------|
| Pilot app selected | ☐ |
| Global flag ON staging only | ☐ |
| Send/receive/open OK | ☐ |
| Rollback drill OK | ☐ |

Next: run `npm run mail:body-encryption:staging-validate` then [phase-3-8-execution-checklist.md](./phase-3-8-execution-checklist.md) migrate/null/scan steps.
