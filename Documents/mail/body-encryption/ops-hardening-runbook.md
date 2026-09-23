# Ops Hardening Runbook — Mail Body Encryption

**Change ID:** CRD-MAIL-ENC-001  
**When:** Immediately (parallel to Phase 2); before production P5

## Database access

- [ ] Restrict production `SELECT` on `mail_messages` to break-glass roles only  
- [ ] Disable routine pgAdmin browsing of `bodyText` / `bodyHtml` in production  
- [ ] Use read replicas with column-level views (metadata only) for analytics if needed  
- [ ] Audit who has `admin@rukny.io` DB access quarterly

## Backups

- [ ] Encrypt backup storage at rest  
- [ ] Restrict backup download to dual-control  
- [ ] Document when last plaintext-era backup expires (RES-05)  
- [ ] Do not restore pre-P5 snapshots into prod without encryption rollback plan

## Application

- [ ] Keep `MAIL_BODY_ENCRYPTION_ENABLED=false` until pilot wave  
- [ ] No customer marketing until P5 scanner clean for cohort  
- [ ] Ensure production logs / APM do not capture message bodies

## After encryption enabled

- [ ] `MAIL_BODY_ENCRYPTION_DUAL_WRITE=false` on production API after pilot soak  
- [ ] Prod CMK for new mail; IAM allows both staging + prod keys for legacy decrypt  
- [ ] Daily `null-plaintext` cron + weekly `scan` cron (`install-mail-encryption-cron.sh`)  
- [ ] Alert on encrypt/decrypt failure metrics  
- [ ] CloudTrail on both KMS keys (staging + production)
