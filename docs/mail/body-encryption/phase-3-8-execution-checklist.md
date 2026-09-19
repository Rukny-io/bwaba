# Phases 3–8 — Execution Checklist

**Change ID:** CRD-MAIL-ENC-001  
**Use after:** Phase 2 code merged (flags OFF)

## Phase 3 — Integration & performance (Weeks 7–8)

- [ ] Deploy to staging with `MAIL_BODY_ENCRYPTION_ENABLED=false`
- [ ] Provision staging CMK — [staging-kms-provisioning.md](./staging-kms-provisioning.md)
- [ ] `npm run mail:body-encryption:kms-verify` on staging API
- [ ] Enable pilot: `npm run mail:body-encryption:pilot -- --enable <id>` ([staging-pilot-runbook.md](./staging-pilot-runbook.md))
- [ ] Set staging `MAIL_BODY_ENCRYPTION_ENABLED=true`
- [ ] `npm run mail:body-encryption:staging-validate`
- [ ] Run E2E: inbound, send, list (no bodies), open (decrypt), star, move
- [ ] Capture baseline B0 vs B1 per `phase-1-baseline-perf-plan.md`
- [ ] Rollback drills R1–R3 (`03-migration-plan.md` §3.4)
- [ ] Run `npm run mail:body-encryption:migrate -- --dry-run` on staging copy

## Phase 4 — Security audit (Week 9)

See [phase-4-security-audit-checklist.md](./phase-4-security-audit-checklist.md).

- [ ] Design review + pen-test
- [ ] AAD swap test (Doc 4 TECH-05)
- [ ] Log redaction verification
- [ ] Zero critical findings or documented waivers

## Phase 5 — UAT (Week 10)

See [phase-5-uat-checklist.md](./phase-5-uat-checklist.md) and [support-faq.md](./support-faq.md).

- [ ] Internal dogfood + beta sign-off
- [ ] Support training (Doc 6 T−2)
- [ ] Customer notice T−14

## Phase 6 — Production waves (Week 11)

See [phase-6-production-rollout.md](./phase-6-production-rollout.md).

- [ ] Prod CMK + IAM
- [ ] Deploy API flags OFF → enable pilots → backfill → dual-read → P5 null plaintext
- [ ] Waves 10% → 50% → 100%
- [ ] `npm run mail:body-encryption:scan` after each wave

## Phase 7 — Monitoring (Weeks 12–13)

See [phase-7-closeout.md](./phase-7-closeout.md), [monitoring-alerts.md](./monitoring-alerts.md), [privacy-policy-addendum.md](./privacy-policy-addendum.md).

- [ ] Monitor encrypt/decrypt errors, KMS latency, tickets
- [ ] Privacy policy + whitepaper (Doc 6)
- [ ] Post-mortem + project closure

## NPM scripts (API)

```bash
npm run mail:body-encryption:kms-verify
npm run mail:body-encryption:pilot -- --list
npm run mail:body-encryption:pilot -- --enable <mail-app-uuid>
npm run mail:body-encryption:staging-validate
./scripts/run-mail-encryption-gate.sh   # kms-verify + staging-validate + scan
npm run mail:body-encryption:migrate -- --batch=200
npm run mail:body-encryption:migrate -- --dry-run
npm run mail:body-encryption:null-plaintext -- --dry-run
npm run mail:body-encryption:scan
```
