# Staging KMS Provisioning — Mail Body Encryption

**Change ID:** CRD-MAIL-ENC-001  
**Owner:** DevOps

## Prerequisites

- AWS CLI v2 with credentials for the staging account
- Permission: `kms:CreateKey`, `kms:CreateAlias`, `iam:PutRolePolicy`
- API task role name (ECS/Lambda/etc.)

## Steps

### 1. Create CMK

```bash
cd apps/api
./scripts/provision-mail-body-kms.sh staging
```

Output includes `KEY_ID`, alias `alias/rukny-mail-body-encryption-staging`, and key ARN.

### 2. Attach IAM to API task role

```bash
./scripts/kms/attach-api-iam-policy.sh staging <KEY_ID> <API_TASK_ROLE_NAME>
```

Policy template: [`apps/api/scripts/kms/api-task-role-policy.json`](../../../apps/api/scripts/kms/api-task-role-policy.json)

### 3. Set staging API environment

Copy [`apps/api/scripts/staging.mail-encryption.env.example`](../../../apps/api/scripts/staging.mail-encryption.env.example) into secrets manager:

| Variable | Value |
|----------|--------|
| `MAIL_AWS_REGION` | `eu-north-1` |
| `MAIL_KMS_KEY_ID` | `alias/rukny-mail-body-encryption-staging` |
| `MAIL_BODY_ENCRYPTION_ENABLED` | `false` (until pilot) |
| `MAIL_BODY_ENCRYPTION_DEV_FALLBACK` | `false` |

Redeploy API. Do **not** enable global flag until pilot app is selected.

### 4. Verify KMS from API runtime

```bash
cd apps/api
npm run mail:body-encryption:kms-verify
```

Expected: `{ "ok": true, "keyId": "...", "roundTripLatencyMs": <n> }`

### 5. CloudTrail (recommended before pilot)

Enable KMS data events on the CMK. Alarm on `Decrypt` error rate and throttling.

## Sign-off

| Step | Owner | Done |
|------|-------|------|
| CMK + alias created | DevOps | ☐ |
| IAM on API role | DevOps | ☐ |
| Env in staging secrets | DevOps | ☐ |
| `kms-verify` passes on staging | Eng | ☐ |

Next: [staging-pilot-runbook.md](./staging-pilot-runbook.md)
