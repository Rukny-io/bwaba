# Document 5: Timeline and Resource Plan

**Service:** Rukny Mail  
**Document ID:** `TRP-MAIL-ENC-001`  
**Document Version:** `1.0`  
**Status:** `Draft — Pending Review`  
**Classification:** Internal — Confidential  
**Parent CRD:** [Document 1 — CRD-MAIL-ENC-001](./01-change-request-document.md)  
**Technical design:** [Document 2 — TIP-MAIL-ENC-001](./02-technical-implementation-plan.md)  
**Migration:** [Document 3 — MIG-MAIL-ENC-001](./03-migration-plan.md)  
**Risks:** [Document 4 — RISK-MAIL-ENC-001](./04-risk-assessment-and-mitigation.md)  
**Related:** [Document 6 — Communication Plan](./06-communication-plan.md)

---

## 1. Project Timeline

### 1.1 Summary

| Field | Value |
|-------|--------|
| **Total duration** | **13 weeks** from kickoff |
| **Kickoff date** | **2026-09-19** |
| **Target production migration complete** | ~Week 11 |
| **Project closure** | ~Week 13 |
| **Primary constraint** | Zero-downtime phased rollout; do not slip validation to save calendar time (Document 4 OPS-04) |

### 1.2 Phase Schedule

| Phase | Name | Duration | Calendar weeks | Primary exit criteria |
|-------|------|----------|----------------|----------------------|
| **1** | Planning and design | 2 weeks | W1–W2 | Architecture approved; OD-1…OD-5 locked; CRD signed |
| **2** | Development and unit testing | 4 weeks | W3–W6 | Crypto + dual-write/read code complete; unit tests green |
| **3** | Integration and performance testing | 2 weeks | W7–W8 | Staging E2E green; perf budgets met |
| **4** | Security audit and penetration testing | 1 week | W9 | Zero critical findings (or waivers documented) |
| **5** | User acceptance testing | 1 week | W10 | Product + beta sign-off |
| **6** | Migration and deployment | 1 week | W11 | Pilot → waves → default-on path executed per Doc 3 |
| **7** | Post-deployment monitoring | 2 weeks | W12–W13 | Soak stable; project closure checklist done |

```text
W1  W2  W3  W4  W5  W6  W7  W8  W9  W10 W11 W12 W13
|--Phase 1--|
            |-------- Phase 2 --------|
                                      |--Phase 3--|
                                                  |-P4-|
                                                       |-P5-|
                                                            |-P6-|
                                                                 |--Phase 7--|
```

**Note:** Week 11 is the **controlled production cutover window** for phased flags/backfill, not a single big-bang hour. Large corpora may extend backfill into Week 12 — prefer schedule slip over skipping Document 3 P5 gates.

### 1.3 Phase Detail

#### Phase 1 — Planning and Design (Weeks 1–2)

| Activity | Owner | Output |
|----------|-------|--------|
| Finalize Document 2 open decisions | Architect + Security | Decision log |
| Threat model workshop | Security | Threat notes linked to Doc 4 |
| KMS design + IAM sketch | DevOps | Infra ticket ready |
| Pilot app selection | Product | Pilot list |
| Baseline perf plan | QA + Backend | Test plan |
| Kickoff + RACI | PM | Kickoff deck |

#### Phase 2 — Development and Unit Testing (Weeks 3–6)

| Activity | Owner | Output |
|----------|-------|--------|
| Prisma additive migration | Backend | Merged migration |
| `MailBodyCryptoService` + KMS client | Backend | Library + unit tests |
| Inbound/send/getOne wiring + flags | Backend | Feature-complete behind flags OFF |
| Migration/backfill worker | Backend | Job + idempotency |
| Log redaction | Backend | Scrubbers |
| Staging KMS provisioning | DevOps | Staging CMK |

#### Phase 3 — Integration and Performance Testing (Weeks 7–8)

| Activity | Owner | Output |
|----------|-------|--------|
| Staging full flow (Doc 3 phases dry-run) | QA + Backend | Test report |
| Load tests (list/getOne/mixed) | QA + DevOps | Baseline vs encrypted |
| Rollback drills R1–R3 (staging) | DevOps + Backend | Signed drill record |
| Plaintext scanner dry-run | Backend | Scanner operational |

#### Phase 4 — Security Audit and Penetration Testing (Week 9)

| Activity | Owner | Output |
|----------|-------|--------|
| Design review / pen-test | Security (+ external if used) | Findings report |
| Remediate critical/high | Backend | Patches |
| Evidence pack draft | Security + Writer | SOC 2 folder start |

#### Phase 5 — UAT (Week 10)

| Activity | Owner | Output |
|----------|-------|--------|
| Internal dogfood | Eng + Product | Checklist |
| Beta customer UAT | Product + Support | Sign-off |
| Support training (prep) | Support | Trained roster |
| Customer notice T−14 (if launch in W11) | Product / Comms | Sent per Doc 6 |

#### Phase 6 — Migration and Deployment (Week 11)

| Activity | Owner | Output |
|----------|-------|--------|
| Prod KMS + alarms final check | DevOps | Green |
| Deploy API (flags OFF) then enable pilots | Backend + DevOps | Dual-write ON |
| Backfill → dual-read → null plaintext (pilots) | Backend | Cohort `ENCRYPTED` |
| Wave expansion as capacity allows | Backend + PM | Wave reports |
| Customer announcement (aligned timing) | Product | Per Doc 6 |

#### Phase 7 — Post-Deployment Monitoring (Weeks 12–13)

| Activity | Owner | Output |
|----------|-------|--------|
| Monitor error/perf/tickets | On-call + Support | Daily briefly, then EOD |
| Complete remaining waves if needed | Backend | 100% cohort target |
| Default-on for new MailApps | Backend | Config change |
| Post-mortem / closure | PM | Closure report |
| Schedule P7 column-drop (later release) | Architect | Follow-up ticket |

---

## 2. Resource Requirements

### 2.1 FTE Allocation (13 Weeks)

| Role | FTE | Primary phases | Notes |
|------|-----|----------------|-------|
| Backend developers | **2.0** | 2–6, support 7 | Crypto, API, migration job |
| DevOps engineer | **1.0** | 1–2, 3, 6–7 | KMS, IAM, deploys, backups, alarms |
| Security engineer | **0.5** | 1, 4, gates in 6 | Design review, residual acceptance, audit |
| QA engineer | **1.0** | 3–6 | Integration, perf, UAT support |
| Project manager | **0.5** | All | Status, gates, risk escalations |
| Technical writer | **0.25** | 5–7, Doc 6 | Whitepaper, FAQ, policy diffs |

**Peak concurrent effort:** ~5.25 FTE during Weeks 7–11; average across 13 weeks ≈ **5.25** weighted toward backend/QA.

### 2.2 RACI (Summary)

| Deliverable | Backend | DevOps | Security | QA | Product | PM |
|-------------|---------|--------|----------|-----|---------|-----|
| Crypto implementation | **A/R** | C | C | C | I | I |
| KMS / IAM | C | **A/R** | C | I | I | I |
| Migration execution | **R** | **A** (prod change) | C | C | C | **A** (gate) |
| Perf sign-off | C | C | I | **A/R** | I | I |
| Security sign-off | C | C | **A/R** | C | I | I |
| UAT / customer timing | C | I | I | C | **A/R** | C |
| External comms | I | I | C | I | **A/R** | C |

R = Responsible, A = Accountable, C = Consulted, I = Informed.

### 2.3 External Dependencies

| Dependency | Lead time | Risk if late |
|------------|-----------|--------------|
| External pen-test slot (optional) | Book by Week 6 | Compresses Week 9; use internal review fallback |
| Legal review of privacy wording | 5–10 business days | Blocks Doc 6 publish |
| Beta customers for UAT | Confirm by Week 8 | Internal-only UAT fallback |

---

## 3. Budget Estimate

### 3.1 Cost Model (Planning Baseline)

Figures below match the CRD planning package and are **estimates** for approval — replace with local loaded rates as needed.

| Category | Amount (USD) | Type | Notes |
|----------|--------------|------|-------|
| Development / delivery labor | **$50,000** | One-time | Approx. 13 weeks × ~5 FTE × ~$770/week blended (planning figure) |
| AWS KMS | **~$5/month** | Ongoing | CMK + API requests; validate against actual decrypt volume |
| Security audit / pen-test | **$10,000** | One-time | External or equivalent internal opportunity cost |
| Testing tools & staging load infra | **$5,000** | One-time | Load generators, extra staging capacity |
| Contingency (20%) | **$13,000** | Reserve | Schedule/risk overrun (Document 4 BIZ-03) |
| **Total planning budget** | **~$78,000** | | Excludes steady-state KMS beyond Year 0 |

### 3.2 Ongoing (Post-Project)

| Item | Estimate | Notes |
|------|----------|-------|
| KMS requests | Low tens of USD/month typical at early scale; revisit after load test | Driven by opens + backfill |
| Redis memory for DEK cache | Marginal | Monitor eviction |
| Eng maintenance | ~0.1 FTE | Rotation, scanner, incidents |

### 3.3 Budget Controls

- Contingency draw requires PM + Engineering Lead approval.  
- Do not spend contingency to skip Document 3 P5 validation.  
- Re-forecast at end of Phase 3 (Week 8) with measured KMS and perf data.

---

## 4. Milestones and Deliverables

| Week | Milestone | Deliverable | Success check |
|------|-----------|-------------|---------------|
| **2** | Architecture design approved | Signed Doc 1 + Doc 2 decisions | OD list closed |
| **6** | Development complete | Main PR(s) merged; unit tests passing | Flags OFF in prod/staging as designed |
| **8** | Integration + performance met | Test + load reports | ≤5% list regression; decrypt budget on track |
| **9** | Security audit complete | Audit report | **Zero critical** findings open |
| **10** | UAT complete | Customer/Product sign-off | No Sev-1 |
| **11** | Migration / production deployment | Wave reports + scanner clean for enabled cohorts | CRD criteria on path |
| **13** | Post-deployment review / closure | Closure report + Doc 6 complete | Handoff to BAU |

### 4.1 Gate Reviews

| Gate | When | Required approvers |
|------|------|-------------------|
| G1 Design freeze | End W2 | Eng Lead, Security, Product |
| G2 Code ready | End W6 | Eng Lead, QA |
| G3 Staging go | End W8 | Eng Lead, DevOps, QA |
| G4 Security go | End W9 | Security |
| G5 Prod pilot go | Start W11 | Eng Lead, DevOps, Security, Product |
| G6 Project close | End W13 | PM + Final Authorizer |

Align with Document 4 §6 go/no-go risk gates before P5 plaintext nulling.

---

## 5. Schedule Risks and Buffers

| Risk | Buffer / response |
|------|-------------------|
| Pen-test delay | Internal design review can unblock G4 conditionally; marketing waits full clear |
| Large backfill | Extend into W12; keep flags wave-based |
| Perf miss | Activate Doc 2 mailbox-scoped DEK option; halt waves |
| Holiday / PTO | Confirm staffing at kickoff; slip end date rather than descope crypto |

---

## 6. Cross-References

| Topic | Document |
|-------|----------|
| Success criteria | [Document 1](./01-change-request-document.md) |
| Implementation scope | [Document 2](./02-technical-implementation-plan.md) |
| Migration phases P0–P8 | [Document 3](./03-migration-plan.md) |
| Risk register | [Document 4](./04-risk-assessment-and-mitigation.md) |
| Announcements & training timing | [Document 6](./06-communication-plan.md) |

---

**End of Document 5 — Timeline and Resource Plan (TRP-MAIL-ENC-001)**
