# Phase 1 — Threat Model Notes

**Change ID:** CRD-MAIL-ENC-001  
**Date:** 2026-09-19  
**Maps to:** [Document 4 — Risk Assessment](./04-risk-assessment-and-mitigation.md)

## Assets

| Asset | Sensitivity | Current exposure |
|-------|-------------|------------------|
| `mail_messages.bodyText` / `bodyHtml` | Critical | Plaintext in PostgreSQL |
| `mail_messages` metadata + `snippet` | High | Plaintext (accepted v1) |
| S3 raw MIME (`rawS3Key`) | High | SSE optional; content not re-encrypted in v1 |
| KMS CMK | Critical | AWS-managed; not in DB |
| Redis DEK cache | High | Short TTL; DEK-only |

## Threat actors

1. **External attacker** — DB credential leak, backup exfiltration  
2. **Insider** — pgAdmin / broad SQL access  
3. **App compromise** — API can decrypt when session valid (inherent server-side model)  
4. **KMS abuse** — IAM misconfiguration

## Mitigations (v1)

- Envelope encryption (AES-256-GCM + KMS DEK per message)  
- AAD binds ciphertext to `mailboxId` + `messageId` + field  
- Decrypt only after MailApp ACL + mailbox session  
- Lazy decrypt on `getOne` only; list uses `snippet`  
- Fail closed on encrypt when flag enabled  
- Operational: reduce DB/backups access ([ops-hardening-runbook.md](./ops-hardening-runbook.md))

## Out of scope (accepted residuals)

- RES-01: metadata/snippet plaintext  
- RES-03: not zero-knowledge / E2E  
- RES-04: historical S3 MIME  
- RES-05: plaintext-era backups until retention expires
