# Document 1: Change Request Document (CRD)

**Service:** Rukny Mail  
**Document ID:** `CRD-MAIL-ENC-001`  
**Document Version:** `1.0`  
**Status:** `Draft — Pending Review`  
**Classification:** Internal — Confidential  
**Related docs:** Document 2 (Technical Implementation Plan), Document 3 (Migration Plan), Document 4 (Risk Assessment), Document 5 (Timeline & Resources), Document 6 (Communication Plan)

---

## 1. Change Overview

### 1.1 Change Identification

| Field | Value |
|--------|--------|
| **Change ID** | `CRD-MAIL-ENC-001` |
| **Title** | Rukny Mail — Message Body Envelope Encryption & Security Hardening |
| **Short name** | Mail Body Encryption (MBE) |
| **Change type** | Security enhancement / Architecture change |
| **Affected product** | Rukny Mail (custom-domain email / webmail) |
| **Primary region** | AWS `eu-north-1` (Stockholm) |

### 1.2 Requestor and Approval Chain

| Role | Name / Team | Action |
|------|-------------|--------|
| **Requestor** | [Product / Security Owner] | Submit CRD |
| **Technical Author** | Lead Software Architect | Draft & maintain package |
| **Technical Approver** | Engineering Lead (API / Mail domain) | Approve design & scope |
| **Security Approver** | Security Engineer / CISO delegate | Approve crypto & key management |
| **Infrastructure Approver** | DevOps / Platform Lead | Approve KMS, IAM, backup impact |
| **Business Approver** | Product Owner — Mail | Approve priority, UX constraints, comms |
| **Final Authorizer** | [CTO / VP Engineering] | Go / no-go for production migration |

**Approval record:**

- [ ] Technical
- [ ] Security
- [ ] Infrastructure
- [ ] Product
- [ ] Final authorization

### 1.3 Priority and Urgency

| Dimension | Classification | Rationale |
|-----------|----------------|-----------|
| **Priority** | **P1 — High** | Plaintext message bodies in PostgreSQL create material privacy and breach blast-radius exposure |
| **Urgency** | **Scheduled (not emergency)** | No active incident; implement via controlled phased rollout, not emergency hotfix |
| **Regulatory driver** | GDPR Art. 32 (security of processing); SOC 2 readiness | Encryption at rest for highly sensitive personal data |
| **Customer impact if delayed** | Rising enterprise due-diligence friction; weaker trust narrative vs. competitors |

### 1.4 Schedule Targets

| Milestone | Target |
|-----------|--------|
| CRD approval | [YYYY-MM-DD] |
| Architecture design locked (see Doc 2) | End of Phase 1 (~Week 2) |
| Production migration complete | End of Phase 6 (~Week 11) |
| **Expected completion (project closure)** | **~13 weeks from kickoff** (see Document 5) |
| Post-deployment monitoring end | ~Week 13 |

**Note:** Exact calendar dates are placeholders pending kickoff date and resource confirmation (Document 5).

---

## 2. Business Justification

### 2.1 Problem Statement

Rukny Mail currently stores full message content in PostgreSQL as plaintext columns:

- `mail_messages.bodyText`
- `mail_messages.bodyHtml`

Metadata and operational fields (sender, recipients, subject, folder, read/star flags, auth verdicts, etc.) are also stored in PostgreSQL. Inbound raw MIME may exist in S3 (`rawS3Key`), but **rendered/searchable bodies used by the application are readable in the database**.

**Current security controls (insufficient for body confidentiality):**

- TLS in transit
- Mailbox password hashing / session controls
- Admin privilege separation (organizational)

**Gap:** Anyone with PostgreSQL read access (operator, compromised credential, stolen backup, over-privileged support tooling) can read full message content — including OTPs, personal correspondence, billing notices, and support tickets — without cryptographic barriers.

This is inconsistent with expectations for an enterprise-grade email hosting service and weakens GDPR “appropriate technical measures” and SOC 2 evidence for confidentiality of customer content.

### 2.2 Business Impact

| Area | Impact of implementing this change |
|------|-------------------------------------|
| **Compliance** | Strengthens GDPR Art. 32 posture; improves auditability of “encryption of personal data” |
| **SOC 2 readiness** | Provides concrete CC6/CC7-aligned control evidence for content at rest |
| **Customer trust** | Reduces “admin can read my inbox” objection in security questionnaires |
| **Enterprise sales** | Enables stronger answers in RFPs / DPIAs / vendor risk assessments |
| **Competitive positioning** | Moves Rukny Mail closer to industry norms (envelope encryption / KMS-backed body protection) |
| **Incident blast radius** | Limits damage of DB-only compromise from “full mailbox dump” to “ciphertext + metadata” |

### 2.3 Risk of Not Implementing

| Scenario | Likely consequence |
|----------|--------------------|
| Production DB credential leak or insider misuse | Full disclosure of all stored mail bodies |
| Backup / snapshot exfiltration | Same plaintext corpus outside live controls |
| Misconfigured admin tooling (e.g. broad `SELECT *`) | Routine operational access becomes content access |
| Regulatory inquiry after incident | Harder to demonstrate state-of-the-art safeguards for email content |
| Enterprise prospect due diligence failure | Lost deals; prolonged security reviews |
| Reputational damage | Disproportionate to the engineering cost of encryption |

**Residual reality:** Transport TLS and hashed passwords do **not** mitigate at-rest body exposure in PostgreSQL.

### 2.4 Expected Benefits

1. **Zero plaintext message bodies** in production PostgreSQL for encrypted workspaces (success criterion).
2. **Clearer GDPR / SOC 2 narrative** with KMS-backed envelope encryption and CloudTrail auditability.
3. **Marketing / trust advantage:** “Message bodies encrypted at rest with AWS KMS; keys not stored in the application database.”
4. **Operational discipline:** Forces least-privilege access patterns and reduces casual content browsing.
5. **Foundation for later controls:** Attachment encryption, optional subject encryption, retention policies (see Out of Scope / future work).

---

## 3. Scope Definition

### 3.1 In Scope

| Area | Details |
|------|---------|
| **Message bodies** | Encrypt `bodyText` and `bodyHtml` using **AES-256-GCM** via **AWS KMS envelope encryption** |
| **Storage targets** | Encrypted body material in PostgreSQL and/or S3 per final design in Document 2; metadata remains queryable in PostgreSQL |
| **Key management** | CMK in AWS KMS; data keys wrapped by KMS; **no long-lived DEKs stored in plaintext in the DB** |
| **Ingest path** | Encrypt on inbound store and outbound send persist |
| **Read path** | Decrypt only when authorized (mailbox session + app access); lazy decrypt for reader view |
| **Export / download** | Decrypt for authorized export flows only |
| **Existing plaintext backfill** | Migrate historical rows (Document 3) |
| **Attachments (design readiness)** | Include **schema/API hooks and security model** for encrypted attachment objects even if full attachment product feature remains incomplete; do not leave future attachments as plaintext-by-default |
| **Operational hardening tied to this change** | Logging redaction (no body dumps), monitoring for encrypt/decrypt failures, backup awareness |
| **Feature flag** | Per-workspace (MailApp) enablement for phased rollout |

### 3.2 Out of Scope (This Change)

| Area | Rationale |
|------|-----------|
| **Encrypting all metadata** (subject, from, to, folder, timestamps) | Required for list UI, folder counts, and metadata-only search without building encrypted search |
| **Changing public REST contract shape** for clients beyond additive/internal fields | Maintain backward compatibility for webmail clients |
| **Full-text search over decrypted bodies** | Remains metadata/snippet-oriented unless a later encrypted-search project is approved |
| **True zero-knowledge / client-only E2E** where Rukny cannot decrypt under any condition | Incompatible with current server-rendered webmail and SES ingest model; explicitly deferred |
| **Replacing SES / rebuilding mail product** | Infrastructure stays AWS SES + existing Mail domain services |
| **IMAP/JMAP protocol surface** | Not required for this CR unless already in product roadmap as separate CR |
| **Non-Mail products** (Email API transactional product, Instagram inbox, etc.) | Separate change requests |

**Note — wording for external comms:** Prefer “**message bodies encrypted at rest with KMS-backed envelope encryption**.” Avoid claiming “end-to-end encryption” unless client-held keys are actually implemented (they are out of scope). See Document 6.

### 3.3 Affected Systems

| System | Impact |
|--------|--------|
| **PostgreSQL** | Schema changes for ciphertext fields / versioning; migration of existing bodies; backup content profile changes |
| **Redis** | Optional short-TTL caches for unwrapped data keys and/or decrypted body cache; mailbox session remains gate for decrypt |
| **Application servers (`apps/api` Mail domain)** | Encrypt/decrypt service; inbound/outbound/message services; export paths |
| **Webmail (`apps/mail`)** | No functional UX change expected; may depend on feature flag / error states |
| **S3** | Possible encrypted body object storage; SSE-KMS alignment for raw MIME / future attachments |
| **AWS KMS** | New CMK(s), key policies, IAM roles for API task role |
| **CloudTrail / monitoring** | KMS usage, decrypt failure alerts, latency SLOs |
| **Backup / restore runbooks** | Ciphertext restores; recovery depends on KMS key availability |

### 3.4 Dependencies

| Dependency | Owner | Blocking? |
|------------|-------|-----------|
| AWS KMS CMK created in `eu-north-1` with rotation enabled | DevOps | Yes |
| IAM policies for Mail API role: `Encrypt` / `Decrypt` / `GenerateDataKey` | DevOps | Yes |
| Application crypto module + migration tooling | Backend | Yes |
| Feature flag / config for per-`MailApp` enablement | Backend / Product | Yes |
| Pre-migration DB backup verified restore | DevOps | Yes (before Phase 6) |
| Security review of key hierarchy & threat model | Security | Yes |
| Customer / legal review of privacy policy wording | Product / Legal | Before external announcement |

---

## 4. Technical Requirements

### 4.1 Cryptographic Standard

| Requirement | Specification |
|-------------|---------------|
| Content cipher | **AES-256-GCM** |
| Pattern | **Envelope encryption** |
| Master keys | **AWS KMS Customer Managed Key (CMK)** in Stockholm |
| Data keys | Ephemeral/data encryption keys (DEK) generated via KMS `GenerateDataKey`; plaintext DEK used only in memory; **encrypted DEK stored with ciphertext** |
| AAD (recommended) | Bind ciphertext to `mailboxId` (+ message id / field name) to prevent cross-row transposition |
| Algorithm agility | Store `cryptoVersion` / `keyId` on each encrypted payload for rotation |

**Rationale:** AES-GCM provides confidentiality + integrity. KMS envelope encryption avoids storing master secrets in the application database and enables audit via CloudTrail.

### 4.2 Key Management Approach

| Topic | Requirement |
|-------|-------------|
| Master secret location | AWS KMS only — **not** in PostgreSQL, Redis persistence, or source control |
| Per-message / per-body wrapping | Encrypted DEK stored alongside ciphertext (column or envelope blob) |
| Optional derivation | If hierarchical keys are used, derive mailbox-scoped keys via **HKDF** using `mailbox_id` as context **from a KMS-protected root**, never from a DB-stored raw key (details in Document 2, Section 4) |
| Access gate | Application decrypt only after successful **Mail mailbox session** assertion (existing Redis session model) + MailApp authorization |
| Rotation | Annual CMK rotation plan (KMS automatic rotation where applicable) + re-wrap procedure for encrypted DEKs if required |
| Recovery | Restore depends on CMK availability + ciphertext backups; documented break-glass with dual control (Document 2 / 4) |

### 4.3 Functional Compatibility Requirements

| Capability | Requirement |
|------------|-------------|
| Webmail list view | Works on **metadata + snippet** without decrypting full bodies |
| Webmail reader | Decrypt on open; latency budget below |
| Send / receive | Encrypt at persist; no plaintext body left in DB after write path succeeds |
| Folder counts / starring / move | Unchanged (metadata operations) |
| Search (current product behavior) | **Metadata-only** (and existing client-side list filtering); no requirement to decrypt all bodies for search |
| Existing clients | **100% backward compatible** at API/UX level for enabled workspaces (additive fields allowed) |

### 4.4 Performance Requirements

| Metric | Target |
|--------|--------|
| Decrypt latency (single message body pair, p95, excluding cold KMS) | **&lt; 50 ms** |
| List endpoint regression | **≤ 5%** vs. pre-change baseline (bodies must not be decrypted in list) |
| Overall API p95 regression (mail read paths) | **≤ 5%** after cache warm |
| Storage overhead | **≤ 10%** increase attributable to ciphertext expansion / envelope fields for typical corpus |
| Cache | Redis TTL for DEK or decrypted body cache: **5–10 minutes**, scoped tightly; never durable plaintext body store |

### 4.5 Storage Requirements

- Prefer compact binary/base64 envelope representation; avoid duplicating plaintext columns after cutover.
- Dual-write / dual-read only during migration windows (Document 3), then drop plaintext.
- S3 objects (if used for bodies or raw MIME) must use **SSE-KMS** aligned with project CMK policy where applicable.

### 4.6 Non-Functional / Compliance Requirements

- CloudTrail logging for KMS decrypt/encrypt APIs.
- No plaintext bodies in application logs, exception dumps, or APM payloads.
- Encryption failure = hard fail on write (do not silently store plaintext after feature enablement).
- Decrypt failure = controlled error to client; alert ops; no partial plaintext leakage in error messages.

---

## 5. Success Criteria

The change is **accepted for project closure** when all of the following are true:

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | **Zero plaintext message bodies** in production for encryption-enabled workspaces | DB audit query / scanner: no non-null plaintext `bodyText`/`bodyHtml` (or legacy columns dropped); sample + full-table checks post-migration |
| 2 | **No performance degradation &gt; 5%** on agreed mail API baselines | Pre/post load test report (Document 3 testing + Document 5 milestones) |
| 3 | **100% backward compatibility** with existing webmail clients | UAT + regression suite; no required client force-upgrade |
| 4 | **Security audit: zero critical findings** related to this change | External or internal pen-test / design review sign-off (Week ~9) |
| 5 | KMS keys **not stored in the database** as plaintext master secrets | Architecture review + code review evidence |
| 6 | Decrypt path enforced behind mailbox session + app ACL | Automated authorization tests |
| 7 | Rollback / recovery runbooks tested in staging | Document 3 rollback drill completed |
| 8 | Documentation & comms updated without inaccurate “E2E” claims | Document 6 checklist complete |

---

## 6. Constraints, Assumptions, and Notes

### 6.1 Constraints

- Must preserve current product model: server-side webmail, SES ingest, Redis mailbox sessions.
- Stockholm region primary; cross-region KMS strategy is a residual-risk topic (Document 4), not a blocker for v1.
- Attachment UX may still be incomplete; encryption design must not block future attachment support.

### 6.2 Assumptions

- AWS account already hosts Mail production in Stockholm with IAM roles for API tasks.
- Existing `MailMailboxSession` remains the primary interactive unlock gate.
- Snippet may remain plaintext (truncated); accepted residual risk unless Product opts to encrypt/redact snippets in a follow-up CR.
- Budget/timeline in Document 5 are planning baselines pending final estimation after Document 2 design lock.

### 6.3 Decision Summary (Locked for This CRD)

| Decision | Choice | Why |
|----------|--------|-----|
| Crypto | AES-256-GCM + KMS envelope | Industry standard; integrity + confidentiality; auditable |
| What we encrypt now | Message bodies (and attachment path readiness) | Highest sensitivity / matches observed DB risk |
| What stays plaintext | List metadata (+ snippet unless later CR) | Search/list performance without encrypted search |
| Rollout | Phased + feature flag per workspace | Safer than big-bang (expanded in Document 3) |

### 6.4 Cross-References

- Architecture, schema, code modules, KMS details → **Document 2**
- Migration, rollback, test & deploy → **Document 3**
- Risks & residual acceptance → **Document 4**
- Timeline, FTE, budget → **Document 5**
- Internal/external messaging → **Document 6**

---

## 7. Approvals Sign-Off Block

| Approver | Signature | Date | Decision |
|----------|-----------|------|----------|
| Engineering Lead | ____________ | ________ | Approve / Reject / Conditional |
| Security | ____________ | ________ | Approve / Reject / Conditional |
| DevOps / Platform | ____________ | ________ | Approve / Reject / Conditional |
| Product Owner — Mail | ____________ | ________ | Approve / Reject / Conditional |
| CTO / VP Engineering | ____________ | ________ | Approve / Reject / Conditional |

**Conditional notes:** [free text]

---

**End of Document 1 — Change Request Document (CRD-MAIL-ENC-001)**
