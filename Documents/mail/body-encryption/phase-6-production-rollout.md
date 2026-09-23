# Phase 6 — Production Rollout Waves

**Change ID:** CRD-MAIL-ENC-001  
**Week:** ~11  
**Owner:** PM + DevOps + Eng

## Preconditions

- [ ] Phase 4 audit signed off
- [ ] Phase 5 UAT signed off
- [ ] Customer notice sent **T−14** ([06-communication-plan.md](./06-communication-plan.md))
- [ ] Production CMK: `./apps/api/scripts/provision-mail-body-kms.sh production`
- [ ] IAM: `./apps/api/scripts/kms/attach-api-iam-policy.sh production <KEY_ID> <PROD_API_ROLE>`
- [ ] Env from [`production.mail-encryption.env.example`](../../../apps/api/scripts/production.mail-encryption.env.example)

## Wave sequence (per cohort)

```
Deploy code (flags OFF) → enable pilot apps → dual-write soak → migrate → null-plaintext → scan=0 → next wave
```

| Wave | Cohort | Apps | Global flag | Backfill | P5 null | Scan |
|------|--------|------|-------------|----------|---------|------|
| W0 | Pilot | 1–2 internal | ON | ✓ | ✓ | 0 |
| W1 | 10% | list | ON | ✓ | after soak | 0 |
| W2 | 50% | list | ON | ✓ | after soak | 0 |
| W3 | 100% | all targeted | ON | ✓ | after soak | 0 |

Track apps in the table below. Enable per app:

```bash
npm run mail:body-encryption:pilot -- --enable <mail-app-uuid>
```

## Wave tracker

| Wave | MailApp IDs | Start | Soak end | migrate done | null-plaintext | scan ok | Owner |
|------|-------------|-------|----------|--------------|----------------|---------|-------|
| W0 | | | | | | | |
| W1 | | | | | | | |
| W2 | | | | | | | |
| W3 | | | | | | | |

## Per-wave commands

```bash
cd apps/api
npm run mail:body-encryption:migrate -- --dry-run
npm run mail:body-encryption:migrate -- --batch=200
npm run mail:body-encryption:null-plaintext -- --dry-run
npm run mail:body-encryption:null-plaintext
npm run mail:body-encryption:scan
npm run mail:body-encryption:staging-validate
```

## Customer communication templates

### T−14 email (workspace owners)

**Subject:** Upcoming security improvement — encrypted mail storage

We are rolling out encryption at rest for message bodies in Rukny Mail using industry-standard AES-256-GCM with AWS KMS. You do not need to take action. We do not expect downtime. Metadata and snippets used in your inbox list are unchanged.

If you have compliance questions, contact support@rukny.com.

### Wave day (in-app / changelog)

**Title:** Mail storage encryption enabled for your workspace

Message bodies in your Rukny Mail workspace are now encrypted at rest. Your everyday mail experience is unchanged.

### Rollback (incident only)

**Title:** Mail encryption rollout paused

We have temporarily paused an encryption update while we investigate an issue. Your mail remains available. We will update you when the rollout resumes.

## Rollback

1. `MAIL_BODY_ENCRYPTION_ENABLED=false` + restart API  
2. Disable affected apps: `npm run mail:body-encryption:pilot -- --disable <id>`  
3. Status page + email per incident policy  
4. Post-incident review before resuming wave  

## Sign-off

| Wave | Go | No-go reason | Date |
|------|-----|--------------|------|
| W0 | | | |
| W1 | | | |
| W2 | | | |
| W3 | | | |
