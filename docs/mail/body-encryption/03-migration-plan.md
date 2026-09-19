# Document 3: Migration Plan

**Service:** Rukny Mail  
**Document ID:** `MIG-MAIL-ENC-001`  
**Document Version:** `1.0`  
**Status:** `Draft — Pending Review`  
**Classification:** Internal — Confidential  
**Parent CRD:** [Document 1 — CRD-MAIL-ENC-001](./01-change-request-document.md)  
**Technical design:** [Document 2 — TIP-MAIL-ENC-001](./02-technical-implementation-plan.md)  
**Related docs:** Document 4 (Risk Assessment), Document 5 (Timeline & Resources), Document 6 (Communication Plan)

---

## 1. Migration Strategy

### 1.1 Approach Decision

| Option | Description | Decision |
|--------|-------------|----------|
| **Big bang** | Encrypt all rows, drop plaintext, enable globally in one cutover | **Rejected** — high blast radius, hard rollback |
| **Phased migration** | Schema → dual-write → backfill → dual-read → plaintext wipe → flag expansion | **Selected** |

**Rationale:** Matches CRD success criteria (backward compatibility, ≤5% perf regression, zero critical audit findings) and Document 2 feature-flag design (global kill switch + per-`MailApp` enablement).

### 1.2 Migration Phases Overview

| Phase | Name | Downtime | User-visible change |
|-------|------|----------|---------------------|
| **P0** | Prep & baselines | None | None |
| **P1** | Additive schema + crypto code (flag off) | None | None |
| **P2** | Dual-write (new mail encrypted + plaintext retained) | None | None (internal) |
| **P3** | Historical backfill | None | None |
| **P4** | Dual-read (prefer ciphertext; plaintext fallback) | None | None if healthy |
| **P5** | Plaintext nulling (per enabled app) | None | None |
| **P6** | Expand flags → default-on for new apps | None | Security posture improved |
| **P7** | Drop plaintext columns (optional later release) | None / low | None |
| **P8** | Soak & close | None | Comms per Document 6 |

### 1.3 Data Migration Sequence

Order of operations (do **not** reorder):

1. **Infrastructure:** KMS CMK + IAM + CloudTrail + alarms (Document 2 §5).  
2. **Schema:** Additive columns / enums only.  
3. **Application:** Deploy crypto + dual-write/dual-read behind flags (`OFF`).  
4. **Staging full rehearsal** including rollback drill.  
5. **Production P2** dual-write for pilot `MailApp`s.  
6. **Backfill** `mail_messages` for pilot apps (oldest → newest **or** hottest mailboxes first — default **oldest first** for predictable progress).  
7. **Validation** then dual-read → null plaintext for pilots.  
8. **Wave rollout** remaining apps by cohort.  
9. **Global defaults** for newly created apps.  
10. **Later release:** drop legacy plaintext columns after soak (≥ [2] weeks).

**Tables / entities:**

| Entity | Action in this migration |
|--------|--------------------------|
| `mail_messages` | Primary backfill target |
| `mail_apps` | Per-app encryption flag / cohort |
| `mail_mailboxes` | No body data; session gate unchanged |
| Attachments table | Not required if not shipped; hooks only (Document 2) |
| S3 raw MIME | SSE-KMS enablement (infra); **not** re-encrypt historical MIME in v1 unless Security mandates a follow-up CR |

### 1.4 Downtime Requirements

| Activity | Expected downtime |
|----------|-------------------|
| Schema additive migration | **Zero** (online DDL) |
| App deploy | **Zero** (rolling / blue-green) |
| Backfill job | **Zero** (background) |
| Plaintext nulling | **Zero** |
| Column drop (P7) | **Zero to minimal** — schedule in normal deploy |

**Hard requirement:** No planned maintenance window that takes webmail offline for encryption cutover.

### 1.5 User Communication Plan (Summary)

Full copy in **Document 6**. Migration-phase touchpoints:

| When | Audience | Message intent |
|------|----------|----------------|
| T−14 days | Customers (pilot + general) | Security enhancement; no action required; no downtime |
| T−2 days | Support | FAQ + known errors (`BODY_DECRYPT_FAILED`) |
| Wave enablement | Affected workspaces | In-app / email: bodies encrypted at rest (not “E2E”) |
| Completion | All | Blog / changelog + privacy policy update |

---

## 2. Data Migration Process

### 2.1 Preconditions (Gate Checklist)

Before production P2:

- [ ] Document 2 open decisions OD-1…OD-5 resolved  
- [ ] KMS alias `alias/rukny-mail-body-encryption` (or agreed name) active in `eu-north-1`  
- [ ] API task role can `GenerateDataKey` / `Decrypt`  
- [ ] Staging: encrypt → decrypt round-trip tests green  
- [ ] Staging: rollback drill completed and signed  
- [ ] Production backup / PITR verified (restore test within last [30] days)  
- [ ] Baseline performance report captured (list + getOne p95)  
- [ ] Feature flags default **OFF**  
- [ ] Nightly plaintext scanner job ready (dry-run mode)  
- [ ] On-call + escalation path documented  

### 2.2 Step-by-Step Migration Procedure

#### Phase P0 — Prep & Baselines

1. Freeze scope to Document 1 / 2.  
2. Create migration tracking dashboard: `% ENCRYPTED`, fail counts, KMS errors, p95 decrypt.  
3. Record row counts:

```sql
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE "bodyText" IS NOT NULL OR "bodyHtml" IS NOT NULL) AS with_body
FROM public.mail_messages;
```

4. Capture hash sample set (e.g. 1,000 random IDs) for later round-trip verification.

#### Phase P1 — Schema + Code (Flags Off)

1. Deploy Prisma migration adding crypto columns / `MailBodyCryptoStatus`.  
2. Deploy `MailBodyCryptoService` + wiring; **no encrypt on write** while global/per-app flags off.  
3. Smoke: existing send/receive/list/open unchanged.

#### Phase P2 — Dual-Write (Pilot Apps)

1. Enable encryption for pilot `MailApp` IDs: `[pilot-app-id-1]`, `[pilot-app-id-2]`.  
2. On create/update of bodies: write **ciphertext + plaintext** (or ciphertext + plaintext until P5).  
3. Set `bodyCryptoStatus = ENCRYPTED` (or `MIGRATING` if you distinguish dual-write — prefer explicit `MIGRATING` until plaintext nulled).  
4. Monitor encrypt failure rate (fail closed for pilots: do not accept silent plaintext-only writes).

**Recommended status semantics:**

| Status | Meaning |
|--------|---------|
| `NONE` | Legacy plaintext only |
| `MIGRATING` | Ciphertext present; plaintext still present (dual-write / dual-read safe) |
| `ENCRYPTED` | Ciphertext present; plaintext **NULLed** |

#### Phase P3 — Historical Backfill

**Worker:** `mail-body-migration.job` / CLI (Document 2 §3.6)

**Algorithm (per batch):**

1. Select batch (`LIMIT [100–500]`) where `bodyCryptoStatus = NONE` AND app in enabled cohort AND (bodyText/bodyHtml IS NOT NULL OR empty-body policy applies).  
2. For each row:  
   - Read plaintext under migration credentials.  
   - `encryptPair(mailboxId, messageId, text, html)`.  
   - Transaction: write ciphertext + `encryptedDek` + `kmsKeyId` + `cryptoVersion`; set status `MIGRATING`; **keep plaintext**.  
   - Optionally verify immediate decrypt equals original (sample 100% in staging; [1–5%] in production).  
3. Checkpoint progress (`lastId` / `updatedAt`).  
4. Retry transient KMS errors with exponential backoff; quarantine poison rows to DLQ table/log for manual review.  
5. Throttle to protect KMS quotas and DB I/O (target: no &gt;5% list latency regression during job).

**Progress reporting:**

| Metric | Source |
|--------|--------|
| Rows migrated / remaining | SQL on `bodyCryptoStatus` |
| Errors / retries | Job metrics |
| ETA | Moving average rows/sec |
| Cohort completion | Per `mailAppId` rollup via mailbox join |

#### Phase P4 — Dual-Read

1. For apps in cohort: `getOne` decrypts ciphertext when `MIGRATING` or `ENCRYPTED`.  
2. Fallback to plaintext only if ciphertext missing/corrupt **and** plaintext still present; emit alert.  
3. List remains metadata-only (Document 2 §3.2).  
4. Soak pilot for **[48–72] hours** with zero unexplained decrypt errors.

#### Phase P5 — Plaintext Nulling

1. Pre-check: for cohort, `COUNT(*)` where status `MIGRATING` and ciphertext null = 0.  
2. Sample round-trip audit signed by Engineering + Security.  
3. Batch update: set `bodyText = NULL`, `bodyHtml = NULL`, status `ENCRYPTED`.  
4. Run residual plaintext scanner — must return **0** for cohort.  
5. Expand to next wave.

#### Phase P6 — Default Enablement

1. Enable for all existing apps in waves (e.g. 10% → 50% → 100%).  
2. New `MailApp` creation: encryption **ON** by default.  
3. Keep global env kill switch for emergency.

#### Phase P7 — Drop Plaintext Columns (Later Release)

1. Confirm ≥ [14] days with zero plaintext reliance in code paths.  
2. Remove Prisma fields / DB columns in dedicated PR.  
3. Update runbooks and SOC 2 evidence pack.

### 2.3 Encryption of Existing Plaintext Bodies

| Step | Detail |
|------|--------|
| Input | `bodyText`, `bodyHtml` from `mail_messages` |
| Crypto | AES-256-GCM + KMS envelope (Document 2 §4) |
| AAD | `mailboxId` + `messageId` + field name |
| Snippet | **Do not rebuild from ciphertext**; leave existing `snippet` as-is |
| Empty bodies | Define once: encrypt empty string **or** store null ciphertext with status `ENCRYPTED` |
| Idempotency | Skip if already `MIGRATING`/`ENCRYPTED` with non-null ciphertext |

### 2.4 Validation Checks

| Check | Method | Pass criteria |
|-------|--------|---------------|
| Row count conservation | `COUNT(*)` pre/post | Unchanged total rows |
| Status distribution | Group by `bodyCryptoStatus` | Cohort fully `ENCRYPTED` before wave close |
| Round-trip sample | Decrypt and SHA-256 compare to pre-hash | 100% match on sample |
| Ciphertext present | No `MIGRATING`/`ENCRYPTED` with both ciphertexts null when body existed | 0 violations |
| Residual plaintext | Scanner after P5 | 0 rows with plaintext for `ENCRYPTED` |
| API functional | Send / receive / open / star / move | UAT checklist green |
| Perf | List/getOne p95 vs baseline | ≤ 5% regression (CRD) |

### 2.5 Error Handling and Retry Logic

| Error class | Handling |
|-------------|----------|
| KMS throttle / transient | Retry with jittered exponential backoff; pause batch |
| KMS access denied | **Stop job**; page DevOps — do not mark rows encrypted |
| AAD / decrypt mismatch in verify | Quarantine row; do not null plaintext |
| Row locked / concurrent update | Retry; re-read latest plaintext |
| Poison message (oversized body) | Quarantine; alert; continue batch |
| Job crash | Resume from checkpoint; idempotent encrypt |

**DLQ / quarantine fields (recommended):** `messageId`, error code, attempts, last_error_at, payload hash.

### 2.6 Progress Tracking and Reporting

- **Daily** during backfill: % complete, errors, ETA → Engineering standup.  
- **Per wave:** written completion report attached to change ticket.  
- **Executive:** weekly rollup (Document 5 / 6).  

Example SQL progress:

```sql
SELECT "bodyCryptoStatus", COUNT(*)
FROM public.mail_messages
GROUP BY 1
ORDER BY 1;
```

---

## 3. Rollback Plan

### 3.1 Rollback Triggers

Initiate rollback (or wave halt) if **any** of:

| Trigger | Severity |
|---------|----------|
| Decrypt failure rate &gt; [1%] of opens for [15] minutes | High — halt wave |
| Encrypt failure causing send/receive failure &gt; [0.5%] | Critical — disable flag |
| Data corruption suspected (round-trip mismatch &gt; 0 in audit) | Critical — freeze P5 |
| KMS outage impacting mail writes | High — fail closed / disable dual-write per runbook |
| Perf regression &gt; 5% sustained [1] hour after cache warm | High — investigate; rollback flag if unresolved |
| Security finding: plaintext still written while claiming ENCRYPTED | Critical |
| Customer-impacting incident attributed to encryption | Per incident commander |

### 3.2 Rollback Procedure (Step-by-Step)

#### R1 — Feature Flag Rollback (First Line, Minutes)

1. Set global `MAIL_BODY_ENCRYPTION_ENABLED=false` **or** disable per-app flags for affected cohort.  
2. Confirm dual-read falls back to plaintext where `MIGRATING`.  
3. Pause backfill job.  
4. Announce in incident channel; notify Support.  

**Works when:** plaintext columns still populated (`NONE` or `MIGRATING`).

#### R2 — Code Rollback (If Flag Insufficient)

1. Redeploy previous API version via blue-green / prior task definition.  
2. Ensure old code ignores crypto columns safely (forward-compatible schema).  
3. Re-run smoke tests.

#### R3 — Data Rollback After Plaintext Nulling (P5+)

Only if plaintext already nulled:

1. **Preferred:** Run controlled `decrypt-and-restore-plaintext` job for affected cohort (requires KMS).  
2. Set status back to `MIGRATING` or `NONE` as designed.  
3. Disable encryption flags.  
4. If decrypt restore fails: **restore PostgreSQL from pre-P5 backup / PITR** to snapshot before nulling.  
5. Re-apply non-mail transactions carefully (coordinate with Platform) — treat as data incident.

#### R4 — Schema Rollback

1. Do **not** drop crypto columns in emergency (low risk to leave).  
2. Column-drop release (P7) must have a forward fix, not an emergency down-migration, unless unused.

### 3.3 Data Restoration from Backup

| Step | Owner |
|------|-------|
| Identify PITR timestamp / snapshot **before** destructive step | DevOps |
| Restore to isolated instance first; verify sample mailboxes | DevOps + Eng |
| If production restore required: maintenance comms (Document 6) | Product + Support |
| Reconcile messages received after snapshot (SES/S3 re-import if needed) | Eng (`import-inbound` paths) |
| Post-restore: encryption flags remain OFF until RCA complete | Security |

### 3.4 Rollback Testing Requirements

| Drill | Environment | Cadence |
|-------|-------------|---------|
| Flag off while dual-write active | Staging | Before prod P2 |
| Simulate KMS deny | Staging | Before prod P2 |
| Decrypt-restore after nulling on sample DB | Staging | Before prod P5 |
| PITR restore dry-run | Staging / non-prod snapshot | Before prod P5 |

Sign-off required from Engineering Lead + DevOps before production P5.

### 3.5 Communication During Rollback

| Audience | Channel | Content |
|----------|---------|---------|
| Internal eng/ops | Incident channel | Trigger, scope, R1/R2/R3 path, ETA |
| Support | Internal brief | Scripts: “temporary security rollout pause; mail still works” |
| Customers | Only if user-visible impact | Honest status; avoid crypto jargon |
| Executives | Bridge / update | Business impact + ETA |

---

## 4. Testing Plan

### 4.1 Unit Tests

| Area | Cases |
|------|-------|
| Encrypt/decrypt round-trip | Text-only, HTML-only, both, empty |
| AAD mismatch | Must fail closed |
| Version handling | Unknown `bodyCryptoVersion` → controlled error |
| Quota helper | Bytes counted from plaintext pre-encrypt |
| Flag matrix | Off / per-app on / global off overrides |

### 4.2 Integration Tests

| Flow | Assert |
|------|--------|
| Inbound webhook → stored ciphertext | No plaintext when status `ENCRYPTED` |
| Send → SES still gets plaintext MIME | DB stores ciphertext |
| List | No KMS calls (mock assert) |
| getOne with session | Bodies present in API response |
| getOne without session | 403 `MAILBOX_LOCKED`; no decrypt |
| Auto-reply / forward (if body needed) | Uses crypto helper |
| Migration job idempotency | Second run no double-encrypt corruption |

### 4.3 Performance Tests

| Test | Target (from CRD / Doc 2) |
|------|---------------------------|
| getOne decrypt p95 | &lt; 50 ms (warm DEK cache) |
| List p95 regression | ≤ 5% |
| Mixed load (~10k concurrent user model) | Stability + error budget |
| Backfill soak | Sustained throughput without KMS throttle storms |

### 4.4 Security Tests

| Test | Intent |
|------|--------|
| DB dump review post-P5 | No plaintext bodies for cohort |
| Log / APM redaction | Bodies absent from logs |
| Key exposure | No DEK/CMK material in DB/repo |
| Authz bypass attempts | Cannot decrypt without app ACL + session |
| Ciphertext swap across mailboxes | AAD must prevent successful decrypt |
| Pen-test / design review | Zero critical findings (CRD §5) |

### 4.5 User Acceptance Testing (UAT)

| Cohort | Scope |
|--------|-------|
| Internal dogfood MailApps | Full webmail: read, send, reply, folders, star, search-as-today |
| Beta customers `[n]` | Same checklist + feedback form |
| Support shadow | Ticket simulation for decrypt errors |

**UAT exit criteria:** written sign-off from Product Owner — Mail; no Sev-1 open issues.

---

## 5. Deployment Plan

### 5.1 Deployment Sequence

1. **AWS:** KMS + IAM + alarms.  
2. **DB:** Additive migration.  
3. **API:** Crypto code, flags OFF.  
4. **Staging validation** (full phases on staging dataset).  
5. **Production API** (flags OFF).  
6. **Enable dual-write** pilots.  
7. **Backfill** pilots → validate → dual-read → null plaintext.  
8. **Wave** remaining apps.  
9. **Default ON** for new apps.  
10. **Later:** drop plaintext columns.

`apps/mail` deploy only if client error handling / types change; otherwise API-only.

### 5.2 Blue-Green / Rolling Strategy

| Component | Strategy |
|-----------|----------|
| `apps/api` | Rolling or blue-green; both versions must tolerate additive columns |
| Migration worker | Single leader (DB advisory lock / queue) to avoid double writers |
| Webmail | Standard Next deploy if needed |

**Compatibility rule:** Old API ignores new columns; new API must read legacy `NONE` rows until backfill completes.

### 5.3 Feature Flags

| Flag | Scope | Default |
|------|-------|---------|
| `MAIL_BODY_ENCRYPTION_ENABLED` | Global kill switch | `false` until P6 |
| `MailApp.bodyEncryptionEnabled` (or equivalent) | Per workspace | Pilot list → waves → `true` for new apps |

**Runtime behavior matrix:**

| Global | Per-app | Write | Read |
|--------|---------|-------|------|
| off | * | Plaintext (legacy) | Plaintext / ignore cipher |
| on | off | Plaintext | Plaintext |
| on | on | Encrypt (dual-write then encrypt-only) | Decrypt with fallback while `MIGRATING` |

### 5.4 Monitoring During Deployment

Watch continuously during each wave:

- Encrypt / decrypt error rates  
- KMS throttle / latency  
- Mail send/receive success  
- List & getOne p95  
- SSE `mail.changed` still healthy  
- Support ticket volume tagged `mail-encryption`

### 5.5 Post-Deployment Validation Checklist

**After each wave:**

- [ ] Smoke: inbound test message encrypted  
- [ ] Smoke: outbound test message encrypted in DB, delivered via SES  
- [ ] Open message in webmail renders HTML  
- [ ] List latency within budget  
- [ ] Residual plaintext scanner clean for `ENCRYPTED` rows  
- [ ] No Sev-1/2 open related to change  
- [ ] Wave completion note filed  

**After full production:**

- [ ] CRD success criteria §5 evidenced  
- [ ] Security audit artifacts attached  
- [ ] Document 6 customer announcement sent  
- [ ] Privacy policy / security whitepaper updated  
- [ ] Project handoff to Document 5 Phase 7 soak  

---

## 6. Roles During Migration

| Role | Responsibilities |
|------|------------------|
| Backend engineers | Code, backfill job, validation queries |
| DevOps | KMS, deploys, backups, PITR, alarms |
| Security | Threat review, residual risk acceptance, audit |
| QA | Test plans §4 execution |
| Product | Pilot selection, UAT sign-off, external timing |
| Support | FAQ readiness, ticket triage |
| Incident commander | Rollback decisions per §3 |

---

## 7. Cross-References

| Topic | Document |
|-------|----------|
| Success criteria & scope | [Document 1](./01-change-request-document.md) |
| Schema, crypto, modules, KMS | [Document 2](./02-technical-implementation-plan.md) |
| Risk probabilities & mitigations | Document 4 |
| Week-by-week timeline & budget | Document 5 |
| Customer / internal messaging | Document 6 |

---

## 8. Notes

1. **Never** null plaintext before dual-read soak and signed round-trip audit.  
2. Prefer **wave halt** over immediate PITR unless data loss/corruption is confirmed.  
3. External language: “encrypted at rest with AWS KMS” — not “end-to-end encryption.”  
4. Historical S3 MIME re-encryption is intentionally deferred unless Security elevates it to a linked CR.

---

**End of Document 3 — Migration Plan (MIG-MAIL-ENC-001)**
