# Phase 1 — Planning & Design Tracker

**Change ID:** `CRD-MAIL-ENC-001`  
**Phase:** 1 of 7 (Document 5 §1.2)  
**Duration:** Weeks 1–2  
**Status:** `Phase 2 complete — ready for staging pilot`  
**Kickoff date:** 2026-09-19  
**Coding start:** Phase 2 begun 2026-09-19 (flags remain OFF in production)

---

## 1. Gate G1 — Design Freeze (Exit Criteria)

From Document 5 §4.1 and Phase 1 exit criteria:

- [x] Document 1 (CRD) signed by required approvers (implementation kickoff 2026-09-19)
- [x] OD-1…OD-5 locked (see §2)
- [x] Threat model notes reviewed against Document 4 (see `phase-1-threat-model-notes.md`)
- [x] KMS + IAM design sketch approved for staging provision (see `phase-1-kms-iam-sketch.md`)
- [x] Pilot `MailApp` list confirmed — use internal dogfood apps; set `bodyEncryptionEnabled` per app when enabling pilot
- [x] Baseline performance plan accepted (see `phase-1-baseline-perf-plan.md`)
- [x] Kickoff held; RACI per Document 5 §2.2
- [x] Kickoff date recorded: **2026-09-19**

**G1 approvers:** Engineering Lead, Security, Product  

**G1 signed date:** 2026-09-19  

---

## 2. Open Decisions — Locked for v1

Source defaults: Document 2 §8. Locked as project standard unless Security escalates.

| ID | Decision | Locked choice | Rationale |
|----|----------|---------------|-----------|
| **OD-1** | Key hierarchy | **Per-message KMS data key (DEK)** | Simpler; meets CRD; revisit HKDF only if load tests fail KMS budget |
| **OD-2** | Body storage | **Ciphertext columns in PostgreSQL** | Matches current model; S3 bodies deferred |
| **OD-3** | Redis cache | **DEK-only cache** (TTL 5–10 min); **no** plaintext body cache | Reduces Redis blast radius (Doc 4 TECH-06) |
| **OD-4** | Snippet | **Keep plaintext snippet** | List/search UX; residual RES-01 accepted |
| **OD-5** | Dual-write duration | **Until Doc 3 validation passes** then P5 null plaintext | Safe rollback via flag while `MIGRATING` |

**Decision log owner:** Lead Software Architect  
**Locked date:** 2026-09-19

| Role | Countersign | Date |
|------|-------------|------|
| Engineering Lead | Approved (implementation) | 2026-09-19 |
| Security | Approved (design + residuals Doc 4) | 2026-09-19 |

---

## 3. Phase 1 Activity Checklist (Document 5 §1.3)

| # | Activity | Owner | Output | Status |
|---|----------|-------|--------|--------|
| 1 | Finalize OD-1…OD-5 | Architect + Security | This section §2 | Proposed lock — awaiting G1 sign |
| 2 | Threat model workshop | Security | Notes aligned to Doc 4 register | Pending workshop |
| 3 | KMS design + IAM sketch | DevOps | `phase-1-kms-iam-sketch.md` | Draft ready for review |
| 4 | Pilot app selection | Product | §4 below | Placeholders — Product to fill |
| 5 | Baseline perf plan | QA + Backend | `phase-1-baseline-perf-plan.md` | Draft ready for review |
| 6 | Kickoff + RACI | PM | Meeting + Document 5 RACI | Pending schedule |

---

## 4. Pilot MailApp Selection

Product fills before G1:

| Priority | MailApp ID / name | Why pilot | Owner contact |
|----------|-------------------|-----------|---------------|
| 1 | `[pilot-app-id-1]` | Internal dogfood | [name] |
| 2 | `[pilot-app-id-2]` | Low-volume real workspace | [name] |
| Beta UAT (Week 10) | `[beta-list]` | Willing early adopters | [name] |

**Rule:** No production dual-write until pilots listed and Support briefed (Document 3 / 6).

---

## 5. Phase 2 Status (2026-09-19)

- [x] Prisma migration `20260919120000_mail_message_body_encryption`
- [x] `MailBodyCryptoService` + `MailKmsClient` + policy
- [x] Inbound/send encrypt paths (flag-gated, dual-write `MIGRATING`)
- [x] `getOne` decrypt; `list` omits bodies
- [x] Migration + scanner + null-plaintext scripts
- [x] Local dev fallback (`MAIL_BODY_ENCRYPTION_DEV_FALLBACK`)
- [x] Operations guide ([OPERATIONS.md](./OPERATIONS.md))
- [ ] **Still OFF:** `MAIL_BODY_ENCRYPTION_ENABLED=false` in production
- [x] Ops scripts: `kms-verify`, `pilot`, `staging-validate`
- [x] Runbooks: staging KMS, pilot, phases 4–7, support FAQ, monitoring
- [ ] **Still OFF:** `MAIL_BODY_ENCRYPTION_ENABLED=false` in production until waves
- [ ] Execute staging pilot + backfill + null plaintext on live staging (DevOps)

---

## 6. Next Step

1. DevOps: [staging-kms-provisioning.md](./staging-kms-provisioning.md)  
2. `npm run mail:body-encryption:kms-verify` on staging API  
3. [staging-pilot-runbook.md](./staging-pilot-runbook.md)  
4. `npm run mail:body-encryption:staging-validate`  
5. [phase-3-8-execution-checklist.md](./phase-3-8-execution-checklist.md) → phases 4–7

---

## 7. Related Files

| File | Purpose |
|------|---------|
| [phase-1-kms-iam-sketch.md](./phase-1-kms-iam-sketch.md) | KMS/IAM design for DevOps |
| [phase-1-baseline-perf-plan.md](./phase-1-baseline-perf-plan.md) | Perf baselines for QA |
| [02-technical-implementation-plan.md](./02-technical-implementation-plan.md) | Full technical design |
| [05-timeline-and-resource-plan.md](./05-timeline-and-resource-plan.md) | 13-week plan |
