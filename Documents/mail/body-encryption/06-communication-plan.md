# Document 6: Communication Plan

**Service:** Rukny Mail  
**Document ID:** `COM-MAIL-ENC-001`  
**Document Version:** `1.0`  
**Status:** `Draft — Pending Review`  
**Classification:** Internal — Confidential  
**Parent CRD:** [Document 1 — CRD-MAIL-ENC-001](./01-change-request-document.md)  
**Technical design:** [Document 2 — TIP-MAIL-ENC-001](./02-technical-implementation-plan.md)  
**Migration:** [Document 3 — MIG-MAIL-ENC-001](./03-migration-plan.md)  
**Risks:** [Document 4 — RISK-MAIL-ENC-001](./04-risk-assessment-and-mitigation.md)  
**Timeline:** [Document 5 — TRP-MAIL-ENC-001](./05-timeline-and-resource-plan.md)

---

## 0. Messaging Principles (Mandatory)

1. **Accurate crypto claims only.** Say: *“Message bodies are encrypted at rest using AES-256-GCM with AWS KMS envelope encryption.”*  
2. **Do not say** “end-to-end encryption,” “zero-knowledge,” or “even Rukny cannot read your mail” — the server decrypts for webmail (CRD §3.2; Document 4 RES-03).  
3. **No downtime promise** must match Document 3 (zero planned webmail outage).  
4. **Do not claim completion** for a workspace until Document 3 Phase P5 (`ENCRYPTED`, plaintext nulled) is verified for that cohort.  
5. Legal / Security must approve external copy before send.

---

## 1. Internal Communication

### 1.1 Stakeholder Updates (Weekly Status)

| Item | Detail |
|------|--------|
| **Cadence** | Weekly during Weeks 1–13 |
| **Owner** | Project Manager |
| **Audience** | Eng Lead, DevOps, Security, QA, Product, Support Lead |
| **Channel** | [Email / Notion / Slack #mail-encryption] |
| **Template** | Status (G/Y/R) · Progress vs Document 5 milestones · Risks from Doc 4 · Asks · Next week |

**Minimum content each week:**

- Phase % complete  
- Open Critical/High risks  
- Flag state (OFF / pilots / waves)  
- Perf & decrypt error snapshot (from W7+)  

### 1.2 Technical Team Briefings

| Cadence | When | Format |
|---------|------|--------|
| Daily standup | Phases 2–6 (W3–W11) | 15 min: blockers, KMS/migration, tests |
| Pre-wave huddle | Before each production wave | 30 min: checklist Doc 3 §5.5 |
| Rollback drill readout | After staging drills | Async note + recorded decision |

### 1.3 Executive Summaries (Monthly)

| Cadence | Audience | Owner |
|---------|----------|-------|
| Monthly (or end of Phases 1, 3, 6, 7) | CTO / VP Eng, Product leadership | PM |

**One-page content:** business outcome, timeline adherence, budget burn vs Document 5, residual risks accepted, go/no-go recommendation.

### 1.4 Post-Mortem / Closure Review

| Timing | Audience | Output |
|--------|----------|--------|
| Within 5 business days after Week 13 closure (or after any Sev-1) | Delivery team + Security | Written post-mortem; runbook updates; follow-up tickets (e.g. column drop P7, S3 MIME CR) |

---

## 2. External Communication

### 2.1 Customer Announcement Timeline

| Timing | Action | Channel |
|--------|--------|---------|
| **T−14 days** before first production pilot wave (aligned to Document 5 Week 10–11) | Advance notice | Email to workspace owners + blog draft ready |
| **T−2 days** | Support final readiness | Internal only (see §2.4) |
| **Wave enablement day** | Short in-app banner / changelog for affected cohorts | In-app + status/changelog |
| **Cohort / global completion** | Confirmation post | Blog + email optional |
| **Incident / rollback** | Only if user-visible impact | Status page + email per incident policy |

### 2.2 Core Customer Message (Approved Direction)

**Subject line (email):**  
`[Rukny Mail] We’re strengthening how message content is protected at rest`

**Body (short form):**

> We’re rolling out an enhancement to Rukny Mail that encrypts **email message bodies at rest** using industry-standard **AES-256 encryption** with keys protected by **AWS KMS**.  
>  
> **What this means for you:** stronger protection if database storage were ever exposed; **no action required**; **no planned downtime**; webmail continues to work as today.  
>  
> **What this does not change:** Rukny still needs to decrypt message content on our servers to show it in webmail and to send/receive mail through our service. List metadata (such as subject and sender) remains available so your inbox can function normally.  
>  
> Questions? See the FAQ: [URL] or contact Support.

**Banned phrases in customer copy:** end-to-end, unreadable by Rukny, military-grade (unless Legal approves), 100% unhackable.

### 2.3 In-App Notification (Optional)

> Mail security update: message bodies are now encrypted at rest with AWS KMS. [Learn more]

Show only after the workspace cohort reaches `ENCRYPTED` (Document 3 P5).

### 2.4 Support Team Training

| Timing | Duration | Owner |
|--------|----------|-------|
| **T−2 days** before first prod wave | ~2 hours training + FAQ dry-run | Support Lead + Backend on-call |

**Training agenda:**

1. What changed / what did not (metadata, not E2E).  
2. How to read `BODY_DECRYPT_FAILED` vs `MAILBOX_LOCKED`.  
3. Escalation path to eng on-call.  
4. What not to promise customers.  
5. Rollback messaging if flags disabled (“temporary pause of security rollout; mail still available”).

### 2.5 FAQ Document (Customer-Facing)

Publish at: `[docs.rukny.io / help center URL]`

| Question | Answer direction |
|----------|------------------|
| Is my email end-to-end encrypted? | No. Bodies are encrypted at rest; webmail decrypts on our servers after you unlock your mailbox session. |
| Can Rukny staff read my mail? | Operational access is restricted; bodies are stored encrypted. Authorized systems decrypt to provide the service. We are reducing casual database readability. |
| Will search change? | Inbox search continues to work on metadata/snippets as today; we are not decrypting every body to search. |
| Do I need to do anything? | No. |
| Will there be downtime? | No planned downtime. |
| Are attachments included? | Body encryption ships now; attachment encryption follows the same security model as features land. |
| Where are keys stored? | Master keys in AWS KMS — not as plaintext secrets in the application database. |

Legal + Security review required before publish.

---

## 3. Documentation Updates

### 3.1 Checklist

| Document | Owner | Timing | Change |
|----------|-------|--------|--------|
| **Privacy Policy** | Legal + Product | Before public “complete” claim | Describe encryption at rest for Mail message content; avoid E2E |
| **Terms of Service** | Legal | Same | Security commitments consistent with actual controls |
| **API documentation** | Backend + Writer | If additive error codes / fields | Document decrypt errors; note bodies returned only on authorized read |
| **Security whitepaper** | Security + Writer | Week 11–13 | Enterprise detail: AES-256-GCM, envelope encryption, KMS, session gate, residuals |
| **SOC 2 evidence pack** | Security | From Week 9 onward | Design, policies, scanner outputs, audit report, change tickets |
| **Internal runbooks** | DevOps + Backend | Before W11 | Rollback R1–R3, KMS deny, scanner |
| **Changelog / release notes** | Product | Per wave | Factual, short |

### 3.2 Privacy Policy — Suggested Insert (Draft for Legal)

> For Rukny Mail, message body content is stored using strong encryption at rest. Encryption keys are managed with Amazon Web Services Key Management Service (KMS). Rukny processes and decrypts message content as needed to provide the Mail service (including displaying messages in webmail and sending and receiving email). Certain message metadata (such as sender, recipient, subject, and folder) may be stored in a form that allows the service to list and organize messages efficiently.

### 3.3 Security Whitepaper — Outline

1. Scope (Mail bodies; metadata residual).  
2. Threat model (DB exfiltration vs. full app compromise).  
3. Crypto design (AES-256-GCM, envelope, AAD).  
4. Key management (KMS, no DB master keys).  
5. Access control (MailApp ACL + mailbox session).  
6. Operational controls (logging redaction, least privilege).  
7. Residual risks (honest; Document 4 §4).  
8. Customer responsibilities (mailbox password/session hygiene).

### 3.4 SOC 2 Evidence Collection

| Evidence | Source |
|----------|--------|
| Change tickets / CRD approvals | This package + tracker |
| KMS key policy + rotation setting | AWS screenshots / IaC |
| CloudTrail samples (Encrypt/Decrypt) | AWS |
| Pen-test / design review report | Week 9 |
| Plaintext residual scanner reports | Post-P5 waves |
| Perf test reports | Weeks 8 / 11 |
| Access control test results | CI / QA |

---

## 4. Communication RACI

| Message type | Product | Marketing | Legal | Security | Support | PM | Eng |
|--------------|---------|-----------|-------|----------|---------|----|----|
| Weekly internal status | I | I | I | C | I | **A/R** | C |
| Customer email / blog | **A/R** | C | **C** (approve) | **C** (approve) | I | C | C |
| In-app banner | **A/R** | I | C | C | I | I | C |
| FAQ | **A** | I | **C** | **C** | **R** (maintain) | I | C |
| Privacy / ToS | C | I | **A/R** | C | I | I | I |
| Whitepaper | C | C | C | **A/R** | I | I | C |
| Incident external | C | C | C | C | C | C | **A** (IC) |

---

## 5. Channel Matrix

| Audience | Primary channel | Backup |
|----------|-----------------|--------|
| Eng / DevOps | Slack #mail-encryption | Email |
| Executives | Monthly one-pager | Live review |
| Support | Training session + helpdesk macros | Slack |
| Customers | Email + help center | In-app |
| Enterprise prospects | Whitepaper + security questionnaire updates | Sales eng brief |
| Public | Blog / changelog | Social (only after Legal OK) |

---

## 6. Incident Communication (If Rollback or Outage)

| Severity | External? | Message posture |
|----------|-----------|-----------------|
| Flag rollback, no user impact | No | Internal only |
| Elevated decrypt errors, intermittent open failures | Yes if sustained | “Investigating Mail message display issues”; avoid crypto blame until confirmed |
| Data integrity incident | Yes | Incident commander + Legal; factual; no speculation |

Align with Document 3 §3.5.

---

## 7. Success Criteria for Communications

- [ ] No public “E2E” claim in any shipped channel  
- [ ] T−14 customer notice sent before first prod wave  
- [ ] Support trained at T−2  
- [ ] FAQ live before or with first wave  
- [ ] Privacy Policy / ToS updated before broad “encrypted at rest” marketing  
- [ ] Whitepaper available for enterprise by project closure  
- [ ] SOC 2 evidence folder populated  

---

## 8. Cross-References

| Topic | Document |
|-------|----------|
| Approved technical wording constraints | [Document 1 §3.2](./01-change-request-document.md) |
| What customers experience technically | [Document 2](./02-technical-implementation-plan.md) |
| Wave timing / rollback comms | [Document 3](./03-migration-plan.md) |
| Residual risks to disclose carefully | [Document 4 §4](./04-risk-assessment-and-mitigation.md) |
| Calendar (W1–W13) | [Document 5](./05-timeline-and-resource-plan.md) |

---

**End of Document 6 — Communication Plan (COM-MAIL-ENC-001)**
