# Security & Architecture Audit Report — `apps/api`

**Date:** 2026-10-03  
**Scope:** NestJS 11 monolith (~944 files, 100 Prisma models, ~120 controllers)

---

## 1. Executive Summary

The API implements defense-in-depth: global default-deny JWT, session-bound tokens, API key scopes, SSRF guards, webhook HMAC verification, and workspace RBAC. This audit cycle closed several gaps (IP bypass in rate limiters, forms webhook SSRF, upload validation, production auth mode enforcement) and produced domain-level findings for prioritized remediation.

| Area | Rating | Notes |
|------|--------|-------|
| Authentication | Strong | GlobalJwtAuthGuard, session fingerprinting, 2FA |
| API Keys | Strong | Hash at rest, scopes, IP allowlist |
| Input validation | Strong | SanitizePipe + ValidationPipe globally |
| SSRF (outbound) | Good | `ssrf-guard.ts` used in forms, developer webhooks, URL metadata, BIMI |
| Webhooks (inbound) | Mixed | Email-api SNS crypto strong; mail SES token-only |
| WebSocket | Mixed | JWT session check good; events `join-event` ACL gap |
| Test coverage | Low | ~38 spec files (~4%); improving on security utilities |

---

## 2. Fixes Applied in This Audit Cycle

| Fix | File(s) |
|-----|---------|
| Trusted IP for throttling | `core/common/guards/throttler-user.guard.ts`, `infrastructure/rate-limiting/rate-limit.guard.ts` |
| Forms webhook SSRF (DNS) | `domain/forms/services/webhook.service.ts` → `assertUrlSafe()` |
| Banner upload magic bytes | `modules/upload/upload.controller.ts` |
| Forms upload IP bypass | `domain/forms/forms-upload.controller.ts` → `getClientIp()` |
| Production auth mode guard | `core/config/env.validation.ts` rejects `GLOBAL_AUTH_MODE=report` in prod |
| bcrypt rounds unified (12) | `core/common/constants/crypto.constants.ts` + OTP services |
| Health `/db`, `/cache` secret in prod | `core/health/health.controller.ts` |
| `timingSafeEqual` for health secret | `core/health/health.controller.ts` |
| Removed duplicate monitoring health controller | `infrastructure/monitoring/health.controller.ts` (deleted) |
| Route scanner improvements | `scripts/scan-unprotected-routes.ts` + `--public` mode |
| CI scripts | `package.json`: `scan:routes`, `audit:public-routes` |
| New unit tests | guards, ssrf-guard, client-ip, env validation, webhook, order-tracking |

---

## 3. Critical & High Findings (Open)

### Critical

1. **WABA token encryption fallback** — `whatsapp-provider/shared/token-encryption.service.ts` uses hardcoded dev key when `ENCRYPTION_KEY` unset. Require 64-hex key in production via `env.validation.ts`.

2. **Events WebSocket ACL** — `domain/events/events.gateway.ts` `join-event` trusts client-supplied `role`; any authenticated user may join organizer rooms.

### High

3. **OAuth state CSRF** — Integrations (LinkedIn, TikTok, YouTube, Instagram, Google Sheets) encode `userId` in base64 state without HMAC. Sign state with server secret and verify on callback.

4. **Missing `@Public()` on provider callbacks** — Meta webhook, Telegram webhook, Google OAuth callbacks may 401 under `GLOBAL_AUTH_MODE=enforce`. Add `@Public()` where providers must reach endpoints without JWT.

5. **Account upgrade without OTP** — `stores/account-upgrade.service.ts` links orders by phone only; `GET /account/guest-summary` enables enumeration.

6. **Mail SES webhook** — `mail-inbound.service.ts` uses shared token only; mirror email-api SNS signature verification.

### Medium

7. WhatsApp contacts API scoped by `userId` not `developerAppId`  
8. Webhook secrets in Bull queue payloads (`developer/webhooks/webhook-delivery.service.ts`)  
9. Forms webhook URL not validated at save time (`forms-commands.service.ts`)  
10. Forms webhook secrets stored plaintext in DB  
11. `WS_JWT_SECRET` vs `JWT_SECRET` mismatch for WebSocket tokens  
12. Instagram OAuth open redirect via `redirectBase`  
13. Default API key scopes too broad (`developer/api-keys/api-keys.service.ts`)

---

## 4. Domain Audits

### 4.1 Auth (`domain/auth/`)

**Strengths:** Refresh token rotation with reuse detection; bcrypt 12 rounds; account lockout; AES-encrypted 2FA secrets; Redis OAuth state; QuickSign hashed tokens.

**Risks:** OAuth provider `/token` endpoint `@SkipThrottle()`; QuickSign may fall back to `JWT_SECRET`; 2FA pre-login enumeration endpoints.

**Recommendations:**
- Throttle `oauth-provider.controller.ts` `/token`
- Fail fast if `QUICKSIGN_SECRET` unset
- Rate-limit 2FA discovery by session id, not only IP

### 4.2 Stores (`domain/stores/`)

**Strengths:** Checkout session verified flag; server-side pricing; Redis OTP rate limits; workspace RBAC on merchant routes; download tokens with expiry.

**Risks:** Guest summary/upgrade by phone; order tracking enumeration; `POST /orders/track` uses last-4 digits; public digital preview URLs; `check-services` exposes config.

**Recommendations:**
- Require OTP before account upgrade
- Add `@Public()` + throttles on intentional guest endpoints
- Uniform responses for order tracking to prevent oracles

### 4.3 Forms (`domain/forms/`)

**Strengths:** JwtOrApiKeyGuard + workspace RBAC; Turnstile; submission limits; SSRF on outbound webhooks; OTP HMAC with pepper; S3 key prefix validation.

**Risks:** Webhook secret plaintext; SSRF only at delivery not config; public upload sessions without CAPTCHA.

**Recommendations:**
- `assertUrlSafe()` on webhook URL create/update
- Encrypt webhook secrets at rest
- CAPTCHA on public upload session creation

### 4.4 Mail (`domain/mail/`)

**Strengths:** KMS envelope encryption for bodies; mailbox RBAC; fail-closed SES token; BIMI uses `safeFetch`.

**Risks:** No SNS signature on inbound SES; direct JSON bypass for tests; broad `*.amazonaws.com` subscribe URL allowlist.

**Recommendations:**
- Port SNS verification from `email-ses-events.service.ts`
- Gate direct JSON bypass to non-production only

### 4.5 Email API (`domain/email-api/`)

**Strengths:** API key scopes + IP allowlist; SNS inbound verification; idempotency keys; recipient hashing; test/live key separation.

**Risks:** Marketing contacts store plaintext email; RSA-SHA1 SNS fallback.

### 4.6 WhatsApp Provider + Developer

**Strengths:** Template-only messaging enforcement; Meta POST HMAC; developer webhook SSRF guard; API key SHA-256; 2FA for key reveal.

**Risks:** See Critical/High items above; contacts not app-scoped; WABA JWT routes lack workspace permissions.

### 4.7 Integrations + WebSocket

**Strengths:** Qaseh IDOR prevention; Instagram/Telegram fail-closed webhooks; support-ticket WS ticket ACL.

**Risks:** OAuth CSRF pattern; missing `@Public()` on callbacks; events WS organizer room join; orphaned `infrastructure/notifications/notifications.gateway.ts`.

---

## 5. Architecture & Technical Debt

| Item | Impact | Recommendation |
|------|--------|----------------|
| 100-model Prisma schema | Scaling coupling | Evaluate schema split per product |
| `forwardRef()` × 17 | Maintainability | Reduce circular deps developer↔mail↔email-api |
| `MonitoringModule` unused | Dead code | Import only when wiring metrics interceptor |
| `modules/upload/` legacy | Duplication | Merge with `infrastructure/upload/` |
| `checkout` empty module | Confusion | Move types to shared package |
| Test coverage ~4% | Regression risk | Target 15% on auth, stores, whatsapp |

---

## 6. Operational Checklist (Production)

- [ ] `GLOBAL_AUTH_MODE=enforce`
- [ ] `HEALTH_SECRET` set; detailed metrics/db/cache require `X-Health-Secret`
- [ ] `ENCRYPTION_KEY` (64 hex) for WhatsApp WABA tokens
- [ ] `ENABLE_SWAGGER` not set or `false`
- [ ] `MAIL_SES_WEBHOOK_TOKEN` set; consider SNS verification upgrade
- [ ] `TRUSTED_PROXY_MODE=cloudflare` (or `xff` + `TRUSTED_PROXY_CIDRS`)
- [ ] Run `npm run scan:routes` and `npm run audit:public-routes` in CI

---

## 7. Prioritized Backlog

| Priority | Task |
|----------|------|
| P0 | Fix events gateway `join-event` authorization |
| P0 | Require `ENCRYPTION_KEY` in production |
| P1 | Add `@Public()` to Meta/Telegram/Google OAuth callbacks |
| P1 | HMAC-sign OAuth state across integrations |
| P1 | SNS verification for mail inbound webhooks |
| P1 | OTP-gate account upgrade |
| P2 | Validate webhook URLs at forms save time |
| P2 | Encrypt forms webhook secrets |
| P2 | Scope WhatsApp contacts by `developerAppId` |
| P3 | Delete orphaned `infrastructure/notifications/notifications.gateway.ts` |
| P3 | Unify `WS_JWT_SECRET` verification in all gateways |

---

## 8. Monitoring Commands

```bash
cd apps/api
npm run scan:routes          # Routes without explicit @Public() or guard
npm run audit:public-routes  # Audit all @Public() handlers
npm test                     # Unit tests including security specs
```
