# Monitoring & Alerts — Mail Body Encryption

**Change ID:** CRD-MAIL-ENC-001

## Application metrics (API)

| Metric | Source | Alert threshold |
|--------|--------|-----------------|
| `mail.body.decrypt.errors` | Log filter `BODY_DECRYPT_FAILED` | &gt;10 / 5 min |
| `mail.body.encrypt.errors` | Encrypt path exceptions | &gt;5 / 5 min |
| `mail.body.decrypt.latency_ms` | Histogram on `resolveBodies` | p95 &gt; 200ms sustained |
| KMS client errors | AWS SDK error codes | Any `AccessDenied` |

## AWS KMS (CloudWatch)

- `AWS/KMS` — `SuccessfulRequestLatency` (Decrypt, GenerateDataKey)
- `UserErrors` / `SystemErrors` on the mail CMK
- CloudTrail: `Decrypt`, `GenerateDataKey` failure events

## Scheduled jobs

```bash
# Nightly (staging + production DB via secure runner)
cd apps/api && npm run mail:body-encryption:scan
```

Exit code 2 = plaintext violation on `ENCRYPTED` rows → page on-call.

## Dashboard panels

1. Encrypt/decrypt QPS and error rate  
2. KMS latency p50/p95  
3. Row counts: `NONE` / `MIGRATING` / `ENCRYPTED`  
4. Pilot apps with `bodyEncryptionEnabled=true`  
5. Global flag state (config snapshot)

## Log redaction rules

- Never log `bodyText`, `bodyHtml`, DEK plaintext, or full ciphertext blobs
- OK: `messageId`, `mailboxId`, `bodyCryptoStatus`, KMS `keyId`

## Runbook links

- Rollback: [OPERATIONS.md](./OPERATIONS.md)
- Incident comms: [06-communication-plan.md](./06-communication-plan.md) §2.3
