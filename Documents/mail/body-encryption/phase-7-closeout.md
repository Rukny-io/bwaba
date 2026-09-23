# Phase 7 — Closeout & Monitoring

**Change ID:** CRD-MAIL-ENC-001  
**Weeks:** 12–13

## Monitoring ([monitoring-alerts.md](./monitoring-alerts.md))

- [ ] Dashboard: encrypt/decrypt error rate, KMS latency p95, `BODY_DECRYPT_FAILED` count
- [ ] Alert: decrypt error spike &gt; baseline
- [ ] Alert: KMS throttling / `AccessDeniedException`
- [ ] Nightly `mail:body-encryption:scan` in CI or cron (staging + prod)
- [ ] Support ticket tag `mail-encryption` reviewed weekly

## Privacy & external docs

- [ ] Privacy policy updated ([privacy-policy-addendum.md](./privacy-policy-addendum.md))
- [ ] Security whitepaper / trust page paragraph (optional)
- [ ] Customer completion email (if global rollout finished)

## Project closure

- [ ] All waves complete; `scan` clean for 100% cohort
- [ ] [post-mortem-template.md](./post-mortem-template.md) filled within 5 business days
- [ ] Runbooks updated: OPERATIONS, ops-hardening
- [ ] Follow-up tickets: S3 MIME SSE-KMS, attachment encryption, column drop P7

## Final metrics (fill at closure)

| Metric | Target | Actual |
|--------|--------|--------|
| Plaintext violations (scan) | 0 | |
| List API regression | ≤5% | |
| Decrypt p95 | &lt;50ms | |
| Sev-1 incidents | 0 | |
| Customer escalations | &lt;5 | |

## Sign-off

| Role | Approve | Date |
|------|---------|------|
| PM | | |
| Eng Lead | | |
| Security | | |
| Product | | |

**Project status:** ☐ Closed
