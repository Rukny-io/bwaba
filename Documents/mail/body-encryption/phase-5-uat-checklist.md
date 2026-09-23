# Phase 5 — UAT & Support Readiness

**Change ID:** CRD-MAIL-ENC-001  
**Week:** ~10

## Internal UAT

- [ ] Dogfood pilot: 5+ users, 48h soak on `MIGRATING`
- [ ] `migrate` dry-run then live on staging pilot
- [ ] `null-plaintext` dry-run then live after round-trip verify
- [ ] `scan` → `encryptedWithPlaintextViolation: 0`
- [ ] Mobile + web open message
- [ ] Search/list/snippet unchanged UX
- [ ] Perf: list ≤5% regression; decrypt p95 &lt;50ms ([phase-1-baseline-perf-plan.md](./phase-1-baseline-perf-plan.md))

## Beta (optional)

- [ ] 1–3 friendly customers on staging-like cohort
- [ ] Feedback ticket queue monitored

## Support training (T−2 before prod wave 1)

- [ ] Session delivered (30 min)
- [ ] [support-faq.md](./support-faq.md) published internally
- [ ] Escalation path: Eng on-call + `#mail-encryption`

## Customer comms prep (T−14)

- [ ] Email draft approved (Legal + Security) — see [06-communication-plan.md](./06-communication-plan.md) §2
- [ ] Changelog / in-app copy ready
- [ ] Status page template if rollback needed

## Sign-off

| Role | Approve | Date |
|------|---------|------|
| Product | | |
| Support Lead | | |
| QA | | |
