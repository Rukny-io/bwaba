# Phase 1 — Baseline Performance Plan

**Change ID:** `CRD-MAIL-ENC-001`  
**Owners:** QA Engineer + Backend Lead  
**Status:** Draft for Phase 1 approval  
**Budgets (CRD / Document 2):**

| Metric | Target |
|--------|--------|
| Decrypt latency p95 (warm, single message) | **&lt; 50 ms** |
| List endpoint regression | **≤ 5%** vs pre-change baseline |
| Mail read-path p95 regression | **≤ 5%** after cache warm |

---

## 1. When to Capture Baselines

| Checkpoint | Environment | Timing |
|------------|-------------|--------|
| **B0 — Pre-change** | Staging (prod-like) + sample prod read-only metrics if available | End of Phase 1 / start Phase 2 (flags OFF) |
| **B1 — Encrypted staging** | Staging with encryption ON | End Phase 3 (Week 8) |
| **B2 — Production post-wave** | Prod after pilot / each major wave | Phase 6–7 |

No production encryption until B0 exists and B1 meets budgets (Document 3 / Gate G3).

---

## 2. Endpoints / Flows to Measure

| Flow | Endpoint / action | Notes |
|------|-------------------|--------|
| List | `GET .../messages?mailboxId&folder&take=` | Must stay **decrypt-free** |
| Counts | `GET .../messages/counts` | Metadata only |
| Open | `GET .../messages/:id` | Decrypt path |
| Send | `POST .../messages` (send) | Encrypt on write |
| Session gate | Open without mailbox session | Expect `MAILBOX_LOCKED`; no KMS |

---

## 3. Load Scenarios

| Scenario | Shape | Success |
|----------|-------|---------|
| S1 List heavy | Mostly list/counts | ≤5% regression vs B0 |
| S2 Open mix | List + intermittent open (realistic webmail) | Decrypt p95 &lt; 50 ms warm |
| S3 Spike opens | Burst getOne | Error rate stable; KMS throttle handled |
| S4 Backfill soak | Migration job + normal traffic (staging) | List regression ≤5% |

**Aspirational scale (Document 2):** model toward **10,000 concurrent users** mix (not all opening messages at once).

---

## 4. Tooling

| Item | Choice |
|------|--------|
| Load tool | `[k6 / Artillery / existing internal]` |
| APM | `[Datadog / CloudWatch / existing]` |
| KMS metrics | CloudWatch: latency, throttles, errors |
| Pass/fail artifact | Markdown/PDF report attached to Gate G3 |

---

## 5. Pass / Fail Rules

- **Pass:** All budget rows met on B1; no Sev-1 functional failures.  
- **Fail:** Sustained &gt;5% list regression or decrypt p95 &gt;50 ms warm → do not expand production waves; consider Document 2 mailbox-scoped DEK fallback (OD-1 revisit).

---

## 6. Phase 1 Sign-Off

| Role | Approve plan | Date |
|------|--------------|------|
| QA | ____________ | ________ |
| Backend Lead | ____________ | ________ |
