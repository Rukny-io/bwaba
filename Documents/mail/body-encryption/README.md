# Rukny Mail — Body Encryption Change Documentation Package

**Change ID:** `CRD-MAIL-ENC-001`  
**Package status:** Documents 1–6 complete  
**Current phase:** **Phase 3+ — Staging rollout** (code ready; operational runbooks below)  
**G1:** Complete (2026-09-19)

## Documents

| # | Document | File |
|---|----------|------|
| 1 | Change Request Document (CRD) | [01-change-request-document.md](./01-change-request-document.md) |
| 2 | Technical Implementation Plan | [02-technical-implementation-plan.md](./02-technical-implementation-plan.md) |
| 3 | Migration Plan | [03-migration-plan.md](./03-migration-plan.md) |
| 4 | Risk Assessment and Mitigation | [04-risk-assessment-and-mitigation.md](./04-risk-assessment-and-mitigation.md) |
| 5 | Timeline and Resource Plan | [05-timeline-and-resource-plan.md](./05-timeline-and-resource-plan.md) |
| 6 | Communication Plan | [06-communication-plan.md](./06-communication-plan.md) |

## Phase 1 working files

| File | Purpose |
|------|---------|
| [phase-1-planning-tracker.md](./phase-1-planning-tracker.md) | G1 checklist, locked OD-1…OD-5, pilots |
| [phase-1-kms-iam-sketch.md](./phase-1-kms-iam-sketch.md) | KMS CMK + IAM sketch |
| [phase-1-baseline-perf-plan.md](./phase-1-baseline-perf-plan.md) | Perf baselines & budgets |
| [phase-1-threat-model-notes.md](./phase-1-threat-model-notes.md) | Threat model |
| [ops-hardening-runbook.md](./ops-hardening-runbook.md) | DB/backups access controls |
| [phase-3-8-execution-checklist.md](./phase-3-8-execution-checklist.md) | Staging → prod gates |
| [staging-kms-provisioning.md](./staging-kms-provisioning.md) | DevOps: staging CMK + IAM |
| [staging-pilot-runbook.md](./staging-pilot-runbook.md) | Enable pilot on staging |
| [phase-4-security-audit-checklist.md](./phase-4-security-audit-checklist.md) | Security audit |
| [phase-5-uat-checklist.md](./phase-5-uat-checklist.md) | UAT + support |
| [phase-6-production-rollout.md](./phase-6-production-rollout.md) | Prod waves + comms |
| [phase-7-closeout.md](./phase-7-closeout.md) | Monitoring + closure |
| [support-faq.md](./support-faq.md) | Support FAQ |
| [monitoring-alerts.md](./monitoring-alerts.md) | Alerts & dashboards |
| [privacy-policy-addendum.md](./privacy-policy-addendum.md) | Legal draft |
| [post-mortem-template.md](./post-mortem-template.md) | Closure post-mortem |

## Implementation (API)

- `apps/api/src/domain/mail/crypto/` — KMS client + body crypto service
- Env: `MAIL_BODY_ENCRYPTION_ENABLED=false`, `MAIL_KMS_KEY_ID`
- Per app: `mail_apps.bodyEncryptionEnabled`
- Scripts: `kms-verify`, `pilot`, `staging-validate`, `migrate`, `null-plaintext`, `scan` (see [OPERATIONS.md](./OPERATIONS.md))
- KMS provision: `apps/api/scripts/provision-mail-body-kms.sh`
- IAM attach: `apps/api/scripts/kms/attach-api-iam-policy.sh`

## Quick summary

Encrypt Rukny Mail `bodyText` / `bodyHtml` at rest with **AES-256-GCM** and **AWS KMS envelope encryption**, keep metadata readable for list/search, roll out in **phased zero-downtime** waves, and communicate accurately (**not** end-to-end encryption).

**Next (ops):** [staging-kms-provisioning.md](./staging-kms-provisioning.md) → [staging-pilot-runbook.md](./staging-pilot-runbook.md) → `staging-validate` → Phase 4–7 checklists.
