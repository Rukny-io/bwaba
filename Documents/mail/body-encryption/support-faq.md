# Support FAQ — Mail Body Encryption

**Internal — Support & Success**  
**Change ID:** CRD-MAIL-ENC-001

## What changed?

Message **bodies** (`bodyText` / `bodyHtml`) are encrypted at rest in our database using AES-256-GCM with AWS KMS. Subjects, snippets, and metadata stay readable for listing and search.

## What we say to customers

✅ *"Message bodies are encrypted at rest using AES-256-GCM with AWS KMS envelope encryption."*

❌ Do **not** say "end-to-end encryption," "zero-knowledge," or "even Rukny cannot read your mail."

## Will users notice anything?

No planned downtime. List view is unchanged (snippets still show). Opening a message should feel the same. If decrypt fails, user may see an error opening the message — escalate to Eng.

## Is encryption on for every workspace?

No. Rollout is per MailApp in waves. Until their workspace is migrated and verified, some mail may still be plaintext in DB (legacy rows).

## Troubleshooting

| Symptom | Check | Escalate |
|---------|-------|----------|
| Cannot open message | API logs `BODY_DECRYPT_FAILED` | Eng + on-call |
| New mail not encrypted | `MAIL_BODY_ENCRYPTION_ENABLED`, app `bodyEncryptionEnabled` | DevOps |
| Slow open | KMS latency / Redis | DevOps |

## Rollback (internal)

Set `MAIL_BODY_ENCRYPTION_ENABLED=false` and restart API. `MIGRATING` rows still have plaintext fallback.

## Scripts (Eng only)

```bash
npm run mail:body-encryption:scan
npm run mail:body-encryption:staging-validate
```

See [OPERATIONS.md](./OPERATIONS.md).
