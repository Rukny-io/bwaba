# Forms Backend - Improvements and Security Enhancements

This document is a separate action plan for improving the current Forms backend in `apps/api/src/domain/forms`, with special focus on reliability, security, and scale.

## 1) Priority matrix

## P0 (do first - security/consistency critical)

1. Unify submission uniqueness enforcement at database level.
2. Harden public upload flow and isolate temp storage lifecycle.
3. Add idempotency keys for submit endpoint to prevent duplicate writes.
4. Standardize cache writes/reads (avoid mixed JSON/raw handling).
5. Ensure webhook signing, replay protection, and delivery observability.

## P1 (next - robustness and performance)

1. Complete migration from legacy `FormsService` into split services.
2. Move heavy file processing to async jobs where possible.
3. Add stronger DTO/schema validation for nested JSON objects.
4. Improve analytics computation performance for large datasets.
5. Add audit trail for security-sensitive form changes.

## P2 (future - platform maturity)

1. Data retention policies and PII lifecycle controls.
2. tenant-level abuse detection and anomaly scoring.
3. event-driven analytics pipeline for long-term scale.

## 2) Backend architecture improvements

## 2.1 Finish service convergence

Current state:

- CQRS-like services exist, but some flows still pass through legacy service methods.

Recommendation:

- Make `FormsFacadeService` delegate only to split services.
- Keep `FormsService` as thin compatibility wrapper, then remove it.
- Introduce single source of truth for:
  - include/select structures
  - cache invalidation keys
  - S3 key transformation logic

Benefit:

- fewer behavior drifts and easier maintenance/testing.

## 2.2 Introduce transactional idempotency for submissions

Problem:

- Public clients can retry (network timeout) causing duplicate submissions.

Recommendation:

- Accept `Idempotency-Key` header on submit endpoints.
- Persist `(formId, key)` with short TTL/state.
- Return previous result when key is replayed.

Benefit:

- safe retry behavior for frontend and webhook consumers.

## 2.3 Stronger consistency for submission counters

Problem:

- `submissionCount` is increment/decrement manually after insert/delete.

Recommendation:

- Keep DB as source of truth:
  - either compute on query
  - or update via transaction and fallback reconciliation job.

Benefit:

- avoids drift between stored counter and real rows.

## 2.4 Improve cache architecture

Current risk:

- both direct Redis and higher-level cache manager approaches are mixed.

Recommendation:

- adopt one cache abstraction.
- normalize serialization (`JSON.stringify/parse` ownership).
- add versioned key prefixes for safe invalidation after schema changes.

Benefit:

- fewer cache bugs and stale data incidents.

## 3) Security hardening recommendations

## 3.1 Database-level anti-duplicate guard (critical)

App checks exist for:

- one response per user / allowMultipleSubmissions

But race conditions can still happen under concurrency.

Recommendation:

- add unique constraints where applicable, for example:
  - `(formId, userId)` for authenticated one-response policies (with nullable-safe strategy)
  - optional dedupe hash for anonymous submissions with short time window

Benefit:

- hard guarantee regardless of concurrent requests.

## 3.2 Public upload hardening

Current state:

- public upload is throttled and file-validated, but still writes to disk temp.

Improvements:

1. Prefer direct-to-object-storage upload for public flow.
2. Add malware scanning pipeline for uploaded files (async quarantine).
3. Apply per-form and per-IP quotas (daily bytes + file count).
4. Tie uploaded files to temporary upload session tokens and expiry.
5. Enforce strict extension-to-mime and mime-to-content checks.

Benefit:

- reduced disk abuse and stronger protection from malicious files.

## 3.3 Email verification hardening

Current state:

- OTP codes stored in Redis with TTL.

Improvements:

1. Store only hashed OTP (not plaintext code).
2. Add attempt counters and lockouts per `(formId,email,ip)`.
3. Add cool-down windows and resend policy.
4. Expire verification state on successful submission or short absolute TTL.

Benefit:

- lower brute-force risk and better abuse resistance.

## 3.4 Webhook security maturity

Current state:

- queued delivery with retries exists.

Improvements:

1. HMAC signatures with timestamp and nonce in headers.
2. Replay protection window at receiver guidance level.
3. Explicit delivery logs: status, latency, retry count, response body hash.
4. Per-form circuit breaker for failing endpoints.
5. Admin endpoint to replay selected failed deliveries.

Benefit:

- reliable and auditable webhook infrastructure.

## 3.5 Privacy and sensitive data controls

Recommendation:

1. Field-level sensitivity metadata (`PII`, `secret`, `financial`, etc.).
2. Encrypt sensitive submission fields at rest.
3. Redact sensitive fields from logs/notifications/webhook payloads.
4. Add data retention and auto-delete policies per form.
5. Add export scope controls (owner-only, admin override with audit).

Benefit:

- easier compliance and reduced data leakage risk.

## 3.6 Recaptcha and bot defense expansion

Current state:

- recaptcha enforced when RECAPTCHA field exists.

Improvements:

1. Optional form-level "always require recaptcha on public submit".
2. Risk-adaptive checks:
  - suspicious IP/user-agent fingerprinting
  - dynamic throttle escalation
3. honeypot hidden field support for low-friction spam filtering.

Benefit:

- stronger anti-automation defense without harming UX.

## 4) Performance and scalability improvements

## 4.1 Query optimization for analytics

Current state:

- analytics build uses in-memory processing after loading submissions.

Recommendation:

- use aggregate queries/materialized snapshots for heavy forms.
- precompute daily metrics asynchronously.
- keep "real-time lightweight" and "deep analytics batch" separated.

Benefit:

- stable response times with large submission volumes.

## 4.2 Async media processing improvements

Current state:

- image processing can happen in request lifecycle.

Recommendation:

- for large files/images, store temp object and process in queue.
- return processing state to frontend (`pending`, `ready`, `failed`).

Benefit:

- fewer request timeouts and better API responsiveness.

## 4.3 Cursor/offset pagination policy

Current state:

- mixed page-based and cursor-based submission listing.

Recommendation:

- standardize:
  - cursor for large/high-write datasets
  - offset only for small admin views

Benefit:

- predictable performance and easier API contracts.

## 5) Observability and operations

Add operational telemetry:

1. structured logs with correlation/request IDs
2. metrics:
   - submission success/failure rates
   - recaptcha fail ratio
   - webhook queue depth and DLQ rates
   - upload rejection reasons
3. tracing across:
   - submit request
   - file processing
   - webhook delivery
   - sheets/drive side effects
4. alert rules:
   - sudden upload spikes
   - high OTP failure rate
   - webhook failure burst

## 6) Recommended implementation roadmap (6 weeks)

Week 1-2 (P0):

- idempotency for submit
- OTP hashing + attempt limiter
- upload tokenization + quota checks
- webhook signature hardening

Week 3-4 (P1):

- cache abstraction unification
- legacy service convergence
- analytics query optimization baseline
- audit log for critical form operations

Week 5-6 (P1/P2):

- field-level PII policies and redaction
- retention jobs and cleanup policies
- operational dashboards and alerts

## 7) Suggested quick wins (very low effort, high impact)

1. Enforce max `limit` consistently on all list endpoints.
2. Add explicit request body size limits on submission/upload routes.
3. Hash OTP before Redis write.
4. Add idempotency key support on both public and authenticated submit routes.
5. Add webhook delivery event IDs and include them in logs/headers.

---

If needed, the next document can be a direct engineering backlog with:

- ticket titles
- acceptance criteria
- effort estimates
- owner/team mapping
