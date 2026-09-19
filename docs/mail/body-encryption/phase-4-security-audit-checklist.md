# Phase 4 — Security Audit Checklist

**Change ID:** CRD-MAIL-ENC-001  
**Week:** ~9  
**Owner:** Security + Eng Lead

## Design review

- [ ] Envelope encryption design matches [02-technical-implementation-plan.md](./02-technical-implementation-plan.md)
- [ ] AAD binds `mailboxId` + `messageId` (TECH-05 swap test documented)
- [ ] DEK cache TTL 600s; Redis holds DEK only, not plaintext bodies
- [ ] `list()` omits bodies; logs do not print decrypted content
- [ ] Kill switch: `MAIL_BODY_ENCRYPTION_ENABLED` + per-app flag

## IAM & KMS

- [ ] API role has least-privilege KMS actions on CMK only
- [ ] DBA/analytics roles cannot `kms:Decrypt` on mail CMK
- [ ] CMK rotation enabled; break-glass documented
- [ ] CloudTrail KMS data events enabled

## Pen-test / dynamic tests

- [ ] Attempt pgAdmin read — ciphertext only after P5 for cohort
- [ ] Attempt API list — no body fields
- [ ] Tamper ciphertext → decrypt fails safely (`BODY_DECRYPT_FAILED`)
- [ ] Wrong AAD → decrypt fails
- [ ] Dev fallback disabled in staging/prod `NODE_ENV`

## Access hardening

- [ ] [ops-hardening-runbook.md](./ops-hardening-runbook.md) items for staging
- [ ] Backup/restore access reviewed

## Findings

| ID | Severity | Finding | Status | Waiver |
|----|----------|---------|--------|--------|
| | | | | |

## Sign-off

| Role | Approve | Date |
|------|---------|------|
| Security | | |
| Eng Lead | | |

**Gate:** Zero Critical open, or documented waivers before Phase 5 UAT.
