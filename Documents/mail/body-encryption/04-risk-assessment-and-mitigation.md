# Document 4: Risk Assessment and Mitigation

**Service:** Rukny Mail  
**Document ID:** `RISK-MAIL-ENC-001`  
**Document Version:** `1.0`  
**Status:** `Draft — Pending Review`  
**Classification:** Internal — Confidential  
**Parent CRD:** [Document 1 — CRD-MAIL-ENC-001](./01-change-request-document.md)  
**Technical design:** [Document 2 — TIP-MAIL-ENC-001](./02-technical-implementation-plan.md)  
**Migration:** [Document 3 — MIG-MAIL-ENC-001](./03-migration-plan.md)  
**Related docs:** Document 5 (Timeline & Resources), Document 6 (Communication Plan)

---

## 0. Risk Methodology

| Element | Definition used in this document |
|---------|----------------------------------|
| **Probability** | Low / Medium / High — likelihood during project + first 90 days in production |
| **Impact** | Low / Medium / High / Critical — effect on confidentiality, availability, integrity, or business |
| **Risk score** | Qualitative: Probability × Impact (for prioritization only) |
| **Treatment** | Mitigate / Accept / Transfer / Avoid |
| **Owner** | Accountable role for mitigation and residual acceptance |

**Risk acceptance authority:** Security Approver + Final Authorizer (CRD §1.2) for Critical residual; Engineering Lead for High technical residuals after mitigation.

---

## 1. Technical Risks

### 1.1 Performance Degradation

| Field | Value |
|-------|--------|
| **Risk ID** | TECH-01 |
| **Description** | Decrypt/KMS latency or accidental list-path decryption slows webmail and API beyond CRD budgets (decrypt p95 &lt; 50 ms; ≤5% regression). |
| **Probability** | Medium |
| **Impact** | High |
| **Treatment** | Mitigate |
| **Owner** | Backend Lead |

**Mitigation:**

- Lazy decryption only on `getOne` / content paths (Document 2 §6.2; Document 3 list asserts no KMS).
- Redis DEK cache TTL 5–10 minutes (Document 2 §4.3).
- Load test before production waves (Document 3 §4.3).
- Wave halt if &gt;5% regression sustained (Document 3 §3.1).
- Fallback design: mailbox-scoped DEK + HKDF if `GenerateDataKey` becomes hotspot (Document 2 OD-1 / §4.2).

**Residual:** Cold KMS / cache miss spikes under sudden traffic; accepted within error budget if p95 recovers &lt; [15] minutes.

---

### 1.2 Key Management Failure

| Field | Value |
|-------|--------|
| **Risk ID** | TECH-02 |
| **Description** | KMS outage, misconfigured IAM, accidental CMK disable/delete, or loss of ability to unwrap DEKs → cannot read bodies; writes may fail closed. |
| **Probability** | Low |
| **Impact** | Critical |
| **Treatment** | Mitigate |
| **Owner** | DevOps / Platform Lead |

**Mitigation:**

- CMK in `eu-north-1` with automatic rotation; deletion window (e.g. 30 days); multi-person delete controls (Document 2 §4.5).
- Least-privilege IAM + CloudTrail alarms on deny/throttle (Document 2 §5.1 / §5.5).
- Staging drill: simulate KMS deny; verify fail-closed behavior (Document 3 §3.4).
- Runbook: page on-call; do not attempt to “fix” by storing plaintext while flag claims encryption.
- Backup strategy documents dependency: ciphertext restore requires live CMK.

**Residual:** Regional KMS dependency — see §4.2. No offline master key file in v1 (accepted).

---

### 1.3 Data Corruption During Migration

| Field | Value |
|-------|--------|
| **Risk ID** | TECH-03 |
| **Description** | Backfill writes wrong ciphertext, nulls plaintext prematurely, or double-encrypts → unreadable or altered message bodies. |
| **Probability** | Low |
| **Impact** | High |
| **Treatment** | Mitigate |
| **Owner** | Backend Lead + QA |

**Mitigation:**

- Phased statuses: `NONE` → `MIGRATING` → `ENCRYPTED` (Document 3 §2.2).
- Idempotent worker + quarantine/DLQ for poison rows.
- Round-trip sample verification before P5 plaintext nulling (Document 3 §2.4).
- Never null plaintext without signed audit (Document 3 §8).
- Pre-P5 backup / PITR + decrypt-restore rollback path (Document 3 §3.2 R3).

**Residual:** Extremely rare undetected bit-flip in storage; AES-GCM auth tag should fail closed on read (alert, not silent corruption).

---

### 1.4 Incomplete Encryption Coverage (Silent Plaintext)

| Field | Value |
|-------|--------|
| **Risk ID** | TECH-04 |
| **Description** | Code path still writes plaintext after enablement (inbound, send, auto-reply, import, admin tools), undermining “zero plaintext” success criterion. |
| **Probability** | Medium |
| **Impact** | High |
| **Treatment** | Mitigate |
| **Owner** | Backend Lead + Security |

**Mitigation:**

- Centralize encrypt in `MailBodyCryptoService`; all writers must use it when flag on (Document 2 §3.6).
- Fail closed on encrypt errors (Document 2 §7).
- Nightly residual plaintext scanner (Document 3 §2.4 / §5.5).
- Code review checklist + integration tests for inbound/send/import.

**Residual:** Future features that bypass helper — controlled by PR review and scanner alerts.

---

### 1.5 Ciphertext Transposition / Integrity Attack

| Field | Value |
|-------|--------|
| **Risk ID** | TECH-05 |
| **Description** | Attacker with DB write swaps ciphertext between rows/mailboxes to cause mis-delivery of content after decrypt. |
| **Probability** | Low |
| **Impact** | High |
| **Treatment** | Mitigate |
| **Owner** | Security + Backend |

**Mitigation:**

- AAD binding: `mailboxId` + `messageId` + field name (Document 2 §2.2 / §4.2).
- Security test: cross-row swap must fail decrypt (Document 3 §4.4).
- Standard DB/IAM least privilege reduces attacker capability.

**Residual:** Attacker who also compromises app decrypt path can still read content (inherent to server-side webmail model).

---

### 1.6 Redis Cache Exposure

| Field | Value |
|-------|--------|
| **Risk ID** | TECH-06 |
| **Description** | Cached DEKs or (if enabled) plaintext bodies in Redis are readable if Redis is compromised. |
| **Probability** | Low |
| **Impact** | High |
| **Treatment** | Mitigate |
| **Owner** | DevOps + Security |

**Mitigation:**

- Default: cache **DEK only**, not plaintext bodies (Document 2 OD-3).
- Short TTL (5–10 min); TLS + AUTH; prefer non-durable cache for DEK index.
- Evict on session lock where feasible.
- Network isolation of Redis.

**Residual:** Short-lived DEK exposure window if Redis breached — accepted vs. KMS latency; revisit if threat model tightens.

---

### 1.7 Application Memory / Log Leakage

| Field | Value |
|-------|--------|
| **Risk ID** | TECH-07 |
| **Description** | Plaintext bodies appear in logs, APM, exception dumps, or debug Prisma query logs after decrypt. |
| **Probability** | Medium |
| **Impact** | High |
| **Treatment** | Mitigate |
| **Owner** | Backend Lead |

**Mitigation:**

- Log redaction policy (Document 2 §7; CRD §4.6).
- Disable verbose SQL logging in production.
- Sentry/APM scrubbers for `bodyText`/`bodyHtml`.
- Security test for log pipelines (Document 3 §4.4).

**Residual:** Memory-dump forensic access on running API hosts — accepted; host hardening is defense in depth.

---

### 1.8 Dual-Write Window Ambiguity

| Field | Value |
|-------|--------|
| **Risk ID** | TECH-08 |
| **Description** | During `MIGRATING`, operators believe data is protected while plaintext still exists in DB/backups. |
| **Probability** | Medium |
| **Impact** | Medium |
| **Treatment** | Mitigate |
| **Owner** | Product + Security + Eng |

**Mitigation:**

- Explicit status semantics in Document 3; dashboards show `% ENCRYPTED` (plaintext nulled) separately from `% with ciphertext`.
- External claims only after P5 cohort completion (Document 6).
- Backup labeling: “may contain plaintext until wave ENCRYPTED.”

**Residual:** Backups taken during dual-write retain plaintext until retention expiry — accept with retention policy review.

---

## 2. Operational Risks

### 2.1 Increased Support Tickets (User Confusion)

| Field | Value |
|-------|--------|
| **Risk ID** | OPS-01 |
| **Description** | Users or admins misunderstand rollout (“mail broken”, “E2E promised”, decrypt errors) → ticket surge. |
| **Probability** | Medium |
| **Impact** | Low |
| **Treatment** | Mitigate |
| **Owner** | Support Lead + Product |

**Mitigation:**

- FAQ + Support training T−2 days (Document 3 §1.5; Document 6).
- Clear in-app error for `BODY_DECRYPT_FAILED` without leaking internals.
- Internal scripts distinguishing flag rollback vs. true data loss.
- Monitor ticket tag `mail-encryption` during waves.

**Residual:** Short-lived ticket bump during first wave — accepted.

---

### 2.2 Compliance Audit Findings

| Field | Value |
|-------|--------|
| **Risk ID** | OPS-02 |
| **Description** | Auditor finds gaps: overstated claims, missing evidence, residual plaintext, weak key controls. |
| **Probability** | Low |
| **Impact** | Medium |
| **Treatment** | Mitigate |
| **Owner** | Security + Technical Writer |

**Mitigation:**

- Pre-audit evidence pack: design, KMS policies, scanner results, pen-test (Document 3 §4.4; Document 6 SOC 2 collection).
- Accurate language: “KMS-backed envelope encryption at rest,” not E2E (CRD §3.2).
- Close CRD success criteria with artifacts before marketing claims.

**Residual:** Follow-up findings on metadata plaintext — see §4.1 (accepted with rationale).

---

### 2.3 On-Call / Runbook Gaps

| Field | Value |
|-------|--------|
| **Risk ID** | OPS-03 |
| **Description** | Incident during off-hours without clear R1/R2/R3 path causes extended outage or unsafe plaintext fallback. |
| **Probability** | Medium |
| **Impact** | High |
| **Treatment** | Mitigate |
| **Owner** | DevOps + Eng |

**Mitigation:**

- Document 3 §3 rollback runbook required before P2.
- Staging drills signed off (Document 3 §3.4).
- Alerts wired for encrypt/decrypt/KMS (Document 2 §5.5).
- Named incident commander during first production waves (Document 3 §6).

**Residual:** Novel failure modes — handled via incident process; post-mortem updates runbooks (Document 6 internal post-mortem).

---

### 2.4 Migration Job Operational Overload

| Field | Value |
|-------|--------|
| **Risk ID** | OPS-04 |
| **Description** | Backfill causes DB load, KMS throttling, or delayed ETA → pressure to skip validation. |
| **Probability** | Medium |
| **Impact** | Medium |
| **Treatment** | Mitigate |
| **Owner** | Backend + DevOps |

**Mitigation:**

- Throttled batches; progress dashboards (Document 3 §2.2 / §2.6).
- No P5 without audit — schedule protected in Document 5.
- Wave-based cohorts instead of all-at-once.

**Residual:** Longer calendar time if throttled — prefer schedule slip over skipped checks.

---

## 3. Business Risks

### 3.1 Customer Churn During Migration

| Field | Value |
|-------|--------|
| **Risk ID** | BIZ-01 |
| **Description** | Visible downtime, data incidents, or fear-driven churn during encryption rollout. |
| **Probability** | Low |
| **Impact** | High |
| **Treatment** | Mitigate |
| **Owner** | Product Owner — Mail |

**Mitigation:**

- Zero-downtime phased plan (Document 3 §1.4).
- Pilot / beta UAT before broad waves (Document 3 §4.5).
- Transparent, accurate customer comms (Document 6).
- Rapid flag rollback as first response (Document 3 §3.2 R1).

**Residual:** Perception risk even when technically healthy — managed via proactive messaging.

---

### 3.2 Competitive Response / Messaging Backfire

| Field | Value |
|-------|--------|
| **Risk ID** | BIZ-02 |
| **Description** | Competitors attack wording (“not real E2E”) or overclaim causes trust damage. |
| **Probability** | Medium |
| **Impact** | Low |
| **Treatment** | Mitigate |
| **Owner** | Product + Marketing + Legal |

**Mitigation:**

- Approved phrasing only (CRD §3.2; Document 6).
- Security whitepaper for enterprise precision.
- Position as material improvement over plaintext-at-rest, aligned with industry envelope encryption norms.

**Residual:** Some buyers still require client-side E2E — out of scope; track as future CR if demand justifies.

---

### 3.3 Timeline / Budget Overrun

| Field | Value |
|-------|--------|
| **Risk ID** | BIZ-03 |
| **Description** | KMS redesign, audit findings, or migration scale extends beyond ~13 weeks / budget (Document 5). |
| **Probability** | Medium |
| **Impact** | Medium |
| **Treatment** | Mitigate |
| **Owner** | Project Manager |

**Mitigation:**

- Contingency 20% in Document 5 budget.
- Scope freeze: metadata encryption & true E2E out of scope (CRD §3.2).
- Prefer schedule slip over unsafe P5 (OPS-04).
- Weekly status (Document 6) with early escalation.

**Residual:** External pen-test vendor delay — buffer in Phase 4 (Document 5).

---

### 3.4 Enterprise Deal Blocked by Residual Gaps

| Field | Value |
|-------|--------|
| **Risk ID** | BIZ-04 |
| **Description** | Prospects reject server-side decrypt model or plaintext metadata/snippet. |
| **Probability** | Medium |
| **Impact** | Medium |
| **Treatment** | Accept + roadmap |
| **Owner** | Product + Sales Engineering |

**Mitigation:**

- Document residual risks honestly in questionnaires (§4).
- Offer roadmap options: snippet reduction, subject encryption, attachment encryption completion.
- Do not oversell.

**Residual:** Accepted for v1; revisit quarterly.

---

## 4. Residual Risks (Accepted)

### 4.1 Metadata Still in Plaintext (Subject, Sender, Recipients, Folder, Snippet)

| Field | Value |
|-------|--------|
| **Risk ID** | RES-01 |
| **Probability** | High (by design) |
| **Impact** | Medium (confidentiality of metadata) |
| **Treatment** | **Accept** for v1 |

**Acceptance rationale:**

- Required for list UI, folder counts, and metadata-only search without encrypted search infrastructure (CRD §3.2 / §4.3).
- Snippet remains short preview for UX (Document 2 OD-4).

**Compensating controls:**

- TLS in transit; DB access least privilege; future optional subject/snippet encryption CR.
- User education in Privacy Policy / FAQ (Document 6).

**Review date:** [90 days post-launch] or next SOC 2 cycle.

---

### 4.2 AWS KMS Dependency

| Field | Value |
|-------|--------|
| **Risk ID** | RES-02 |
| **Probability** | Low |
| **Impact** | Critical (availability of body read/write when encryption enforced) |
| **Treatment** | **Accept** with mitigations |

**Acceptance rationale:**

- Industry standard for envelope encryption; higher availability than self-managed HSM for current stage.
- Aligns with AWS Stockholm deployment.

**Compensating controls:**

- CloudTrail, IAM least privilege, deletion protection, alarms, staging deny drills.
- Future enhancement: multi-region replica keys / documented multi-region strategy (not required for v1 go-live).

**Explicit non-goal for v1:** Offline decryption without AWS (would require exporting key material — rejected).

**Review date:** After first production KMS incident or annual DR test.

---

### 4.3 Server-Side Decryption (Not Zero-Knowledge)

| Field | Value |
|-------|--------|
| **Risk ID** | RES-03 |
| **Probability** | High (by design) |
| **Impact** | Medium–High vs. nation-state / full app compromise |
| **Treatment** | **Accept** |

**Acceptance rationale:**

- Current product is server-rendered webmail + SES ingest; Rukny API must decrypt to display/send (CRD out of scope for true E2E).

**Compensating controls:**

- Mailbox session gate + ACL; encrypt at rest vs. opportunistic DB reads; audit logging; reduce admin SQL use.

**Review date:** If Product prioritizes zero-knowledge roadmap.

---

### 4.4 Historical Raw MIME in S3 May Remain Un-Reencrypted

| Field | Value |
|-------|--------|
| **Risk ID** | RES-04 |
| **Probability** | High (if historical objects exist) |
| **Impact** | Medium–High if bucket ACL fails |
| **Treatment** | Mitigate partially / Accept remainder for v1 |

**Mitigation now:** Enable SSE-KMS on bucket going forward; tighten bucket policies.

**Accepted remainder:** Re-encrypting all historical raw MIME is deferred unless Security elevates linked CR (Document 3 §8).

**Review date:** Security decision within [30] days of P6 completion.

---

### 4.5 Backup Retention of Pre-Encryption Plaintext

| Field | Value |
|-------|--------|
| **Risk ID** | RES-05 |
| **Probability** | High until retention elapses |
| **Impact** | High if those backups leak |
| **Treatment** | Mitigate + time-bounded Accept |

**Mitigation:**

- Restrict backup access; encrypt backups at rest; define retention; track when last plaintext-era backup expires.
- Prefer not to restore plaintext-era backups into prod after P6 without cause.

**Review date:** When backup retention window clears post-P5.

---

## 5. Risk Register Summary

| ID | Title | Prob. | Impact | Treatment | Owner |
|----|-------|-------|--------|-----------|-------|
| TECH-01 | Performance degradation | Medium | High | Mitigate | Backend |
| TECH-02 | Key management failure | Low | Critical | Mitigate | DevOps |
| TECH-03 | Migration data corruption | Low | High | Mitigate | Backend + QA |
| TECH-04 | Silent plaintext writes | Medium | High | Mitigate | Backend + Security |
| TECH-05 | Ciphertext transposition | Low | High | Mitigate | Security + Backend |
| TECH-06 | Redis cache exposure | Low | High | Mitigate | DevOps + Security |
| TECH-07 | Log/memory leakage | Medium | High | Mitigate | Backend |
| TECH-08 | Dual-write false assurance | Medium | Medium | Mitigate | Product + Security |
| OPS-01 | Support ticket surge | Medium | Low | Mitigate | Support + Product |
| OPS-02 | Audit findings | Low | Medium | Mitigate | Security |
| OPS-03 | Runbook/on-call gaps | Medium | High | Mitigate | DevOps + Eng |
| OPS-04 | Backfill overload / skipped checks | Medium | Medium | Mitigate | Backend + DevOps |
| BIZ-01 | Customer churn | Low | High | Mitigate | Product |
| BIZ-02 | Messaging backfire | Medium | Low | Mitigate | Product + Marketing |
| BIZ-03 | Schedule/budget overrun | Medium | Medium | Mitigate | PM |
| BIZ-04 | Enterprise residual rejection | Medium | Medium | Accept + roadmap | Product + SE |
| RES-01 | Plaintext metadata/snippet | High | Medium | Accept | Security + Product |
| RES-02 | KMS dependency | Low | Critical | Accept + controls | DevOps + Security |
| RES-03 | Server-side decrypt model | High | Medium–High | Accept | Product + Security |
| RES-04 | Historical S3 MIME | High | Medium–High | Partial accept | Security |
| RES-05 | Plaintext-era backups | High | High | Time-bounded accept | DevOps + Security |

---

## 6. Go / No-Go Risk Gates

Encryption **production P5 (plaintext nulling)** must not proceed if:

- [ ] Any **Critical** open risk without approved mitigation owner and runbook  
- [ ] TECH-03 validation sample not signed  
- [ ] TECH-02 staging KMS deny drill not completed  
- [ ] TECH-04 scanner not operational  
- [ ] OPS-03 rollback drill not signed  

Encryption **marketing claims** must not proceed if:

- [ ] Residual plaintext scanner fails for claimed cohorts  
- [ ] Document 6 wording not Legal/Security approved  

---

## 7. Cross-References

| Topic | Document |
|-------|----------|
| Success criteria & out-of-scope | [Document 1](./01-change-request-document.md) |
| Crypto, AAD, caching, monitoring | [Document 2](./02-technical-implementation-plan.md) |
| Phases, rollback, tests | [Document 3](./03-migration-plan.md) |
| Schedule buffers & contingency budget | Document 5 |
| External wording & FAQ | Document 6 |

---

## 8. Approval of Residual Risks

| Residual ID | Accepted by (Security) | Accepted by (Product / CTO) | Date |
|-------------|------------------------|-----------------------------|------|
| RES-01 | ____________ | ____________ | ________ |
| RES-02 | ____________ | ____________ | ________ |
| RES-03 | ____________ | ____________ | ________ |
| RES-04 | ____________ | ____________ | ________ |
| RES-05 | ____________ | ____________ | ________ |

---

**End of Document 4 — Risk Assessment and Mitigation (RISK-MAIL-ENC-001)**
