# Rukny Platform — Comprehensive Security & Engineering Audit

**Audit date:** 2026-07-07
**Scope:** Entire monorepo at `Rukny-v1/` — NestJS API (`apps/api`), 7 Next.js apps (`accounts`, `hq`, `forms`, `developer`, `public`, `app`, `workspace`), shared packages, Docker/Compose, Nginx, Cloudflare Tunnel, CI/CD, deploy scripts.
**Method:** Static source review of the working tree, plus direct line-level verification of every High/Critical finding against the actual code (not comments).

> **Important accuracy note.** Some issues that pattern-match to classic vulnerabilities were verified to be **already mitigated** in the current code. Those are listed in §7 ("Verified NOT vulnerable") so you don't waste effort re-fixing them. The audit distinguishes *confirmed* problems from *theoretical* ones.

---

## 1. Severity legend

| Level | Meaning | Action window |
|-------|---------|---------------|
| 🔴 **CRITICAL** | Exploitable now, or a leaked/committed secret. Direct path to account/data/infra compromise. | Immediate (hours) |
| 🟠 **HIGH** | Serious weakness; exploitable under realistic conditions or a misconfiguration away from critical. | Days |
| 🟡 **MEDIUM** | Defense-in-depth gap, or exploitable only with preconditions. | Weeks |
| 🔵 **LOW** | Hardening / hygiene / correctness. | Backlog |

**Tally:** 2 Critical · 5 High · 9 Medium · 11 Low.

---

## 2. Executive summary

The platform is, on the whole, **built by someone who understands security**. The authentication core is genuinely strong: rotating refresh tokens with reuse/theft detection, session-bound JWTs with fingerprinting, AES-256-GCM for 2FA secrets, bcrypt-hashed OTPs, HMAC-peppered form OTPs with constant-time comparison, progressive account lockout, `whitelist`/`forbidNonWhitelisted` validation, helmet, per-endpoint throttling, a real SSRF guard, and correct `httpOnly`/`Secure`/`SameSite` cookies with `__Host-`/`__Secure-` prefixes. The two primary dashboard apps (`hq`, `forms`) cryptographically **verify** JWT signatures in middleware rather than merely decoding them.

The real risk is concentrated in **infrastructure and configuration**, not application logic:

1. A **real TLS private key is committed** to the repo (🔴).
2. **pgAdmin is exposed to the public internet** with its CSRF protections disabled (🔴).
3. The API and HQ admin app are **bound to `0.0.0.0`**, bypassing Nginx/Cloudflare (🟠).
4. `JWT_SECRET` is **baked into the `forms` Docker image** via build arg (🟠).
5. Nginx **trusts spoofable `CF-Connecting-IP`** from broad internal ranges, defeating rate limits (🟠).
6. A **hardcoded JWT fallback secret** in frontend middleware is gated only on `NODE_ENV==='production'` (🟠).
7. An **open redirect** via protocol-relative `next=` parameter (🟠).

Fix the two Criticals and five Highs and the platform's posture goes from "good code, dangerous deployment" to "solid end-to-end."

---

## 3. 🔴 CRITICAL findings

### C1 — Real TLS private key committed to the repository
- **Location:** `nginx/ssl/rukny.key` (line 1 confirmed `-----BEGIN PRIVATE KEY-----`, 28-line PKCS#8 key). Matching cert at `nginx/ssl/rukny.crt`. Mounted into Nginx at `docker-compose.yml:374`.
- **Why it's critical:** A private key in source control must be treated as compromised. Anyone with repo access (past or present, including forks and clones) holds it. `.gitignore` (lines 16–19) ignores only `.env*` — there is **no** `*.key`, `*.pem`, or `nginx/ssl/` rule, so nothing prevents it from being tracked. Worse, the key is **not even referenced** by any Nginx config (no `ssl_certificate`/`listen 443 ssl` directive exists) — it's pure liability with zero benefit.
- **Solution:**
  1. Treat as compromised → **revoke/rotate immediately** (if it's a Cloudflare Origin Certificate, revoke in the CF dashboard and reissue).
  2. `git rm --cached nginx/ssl/rukny.key nginx/ssl/rukny.crt` and delete from the working tree.
  3. Purge from history: `git filter-repo --path nginx/ssl --invert-paths` (or BFG), then force-push and have all clones re-clone.
  4. Add to `.gitignore`: `nginx/ssl/`, `*.key`, `*.pem`.
  5. Provision the key on the server out-of-band (secret manager / deploy-time copy), never in the image or repo.

### C2 — pgAdmin published to the internet with CSRF/cookie protection disabled
- **Location:** `nginx/conf.d/default.conf:330-345` (`db.rukny.io` server block → `pgadmin_upstream`); `docker-compose.yml:348-349` (`PGADMIN_CONFIG_ENHANCED_COOKIE_PROTECTION: "False"`, `PGADMIN_CONFIG_WTF_CSRF_SSL_STRICT: "False"`). Same weakening in `docker-compose.rukny-dev.yml:281-282`.
- **Why it's critical:** pgAdmin stores saved **production database credentials**. Its public server block is the **only one with no `limit_req`** and no IP allowlist / auth layer, and the two disabled flags weaken pgAdmin's built-in CSRF defenses. A compromise here is a direct route to the entire database.
- **Solution:**
  1. **Remove the `db.rukny.io` server block** from Nginx.
  2. Access pgAdmin only via its `127.0.0.1:5050` binding over an **SSH tunnel**, or place it behind **Cloudflare Access** (SSO + policy).
  3. Re-enable `PGADMIN_CONFIG_ENHANCED_COOKIE_PROTECTION` and `PGADMIN_CONFIG_WTF_CSRF_SSL_STRICT` (`"True"`).
  4. If it must stay reachable, add `limit_req` and an IP allowlist.

---

## 4. 🟠 HIGH findings

### H1 — API and HQ admin app bound to all interfaces (`0.0.0.0`)
- **Location:** `docker-compose.yml:61` (`"0.0.0.0:3001:3001"`, api), `docker-compose.yml:198` (`"0.0.0.0:3002:3002"`, hq); also `docker-compose.rukny-dev.yml:54`.
- **Why it matters:** Every other service correctly binds `127.0.0.1` (`accounts`, `public`, `developers`, `forms`, `postgres`, `redis`, `pgadmin`). Ingress is designed as **Cloudflare Tunnel → Nginx → containers over the compose network**, so host-port exposure is redundant and dangerous: it lets traffic reach the NestJS API and the admin console **directly**, skipping Nginx rate limits, the Cloudflare WAF, and TLS. Docker's iptables rules typically bypass `ufw`, so a host firewall won't save you.
- **Solution:** Change both to `127.0.0.1:...` or, better, **drop the `ports:` mappings entirely** — Nginx reaches them via `rukny_network`.

### H2 — `JWT_SECRET` baked into the `forms` image via Docker build arg
- **Location:** `docker-compose.yml:314` (`JWT_SECRET: ${JWT_SECRET}` under `forms.build.args`); `apps/forms/Dockerfile:48` (`ARG JWT_SECRET=...`) and `:56` (`ENV JWT_SECRET=${JWT_SECRET}` in the builder stage). Repeated in `docker-compose.rukny-dev.yml:251`, `docker-test/docker-compose.yml:232`.
- **Why it matters:** Build args and `ENV` values are recorded in image history and layer metadata. Anyone who can pull the built image recovers the **production JWT signing secret** via `docker history` — a full token-forgery capability. The Dockerfile's placeholder default proves the build doesn't actually need the real value.
- **Solution:**
  1. Remove `JWT_SECRET` from `build.args` in all three compose files and remove the `ARG`/`ENV JWT_SECRET` lines from `apps/forms/Dockerfile`. Keep it as a **runtime** env only (which is already present and correct).
  2. If a build genuinely needs it, use BuildKit `--mount=type=secret`.
  3. **Rotate `JWT_SECRET`** afterward, since existing images already contain it (this invalidates active sessions — schedule accordingly).

### H3 — Nginx trusts spoofable `CF-Connecting-IP`, enabling rate-limit bypass and log poisoning
- **Location:** `nginx/nginx.conf:15-18` (`set_real_ip_from 172.16.0.0/12; set_real_ip_from 10.0.0.0/8; real_ip_header CF-Connecting-IP;`). Combined with `docker-compose.yml:366-368` (ports `80`/`443` on all interfaces).
- **Why it matters:** Anyone reaching Nginx directly (possible while 80/443 are open) can send a forged `CF-Connecting-IP` header. Because the connection arrives via Docker NAT (source rewritten into `172.16/12`), Nginx accepts the forged header as `$remote_addr`. That defeats all three `limit_req` zones (keyed on `$binary_remote_addr`, `nginx/nginx.conf:48-54`), poisons access logs, and spoofs the client IP forwarded to the API for geo/audit.
- **Solution:** Make the Cloudflare tunnel the **only ingress** — remove the host `ports` for Nginx (`docker-compose.yml:366-368`); cloudflared reaches Nginx over the compose network. If direct exposure is unavoidable, drop the `10.0.0.0/8` and `172.16.0.0/12` trust lines and trust only the exact cloudflared subnet. The public Cloudflare ranges in `nginx/cloudflare-real-ip.conf:5-28` are correct and can stay.

### H4 — Hardcoded JWT fallback secret in frontend middleware, gated only on `NODE_ENV`
- **Location:** `apps/hq/lib/middleware-auth.ts:52-59` and `apps/forms/lib/middleware-auth.ts:49-55` (**verified**):

```52:59:apps/hq/lib/middleware-auth.ts
    const secretValue = process.env.JWT_SECRET;
    if (!secretValue && process.env.NODE_ENV === 'production') {
      console.error('[hq middleware] JWT_SECRET is required in production');
      return { isAuthenticated: false, user: null, tokenExpired: true };
    }
    const secret = new TextEncoder().encode(
      secretValue || 'fallback-secret-min-32-chars-for-e2e-tests!!',
    );
```

- **Why it matters:** Any deployment where `NODE_ENV` is not exactly `production` (unset, `staging`, `test`, `development`) will verify tokens against the **publicly-known** string — a full authentication bypass for the admin (`hq`) and forms dashboards. Relying on a single env string for a security boundary is fragile.
- **Solution:** **Fail closed** whenever `JWT_SECRET` is absent, regardless of `NODE_ENV` (return unauthenticated / throw at startup). Confine the test fallback to an explicit test-only guard, e.g. `secretValue ?? (process.env.CI_E2E === '1' ? testSecret : undefined)`, and never place a literal secret in the runtime path.

### H5 — Open redirect via protocol-relative `next` parameter
- **Location (verified):** `apps/forms/middleware.ts:124-147` (`resolveSafeNext`); mirrored in `apps/hq/lib/auth-redirect.ts` and `apps/forms/lib/auth-redirect.ts`.

```128:133:apps/forms/middleware.ts
  if (!nextParam) return null;
  try {
    if (nextParam.startsWith('/')) {
      return nextParam;
    }
```

- **Why it matters:** `//evil.com` starts with `/`, so it passes the "internal path" shortcut and is returned as-is. A victim visiting `…/login?next=//evil.com` is redirected off-site after auth — a phishing/credential-relay primitive.
- **Solution:** Reject protocol-relative and backslash paths:
  `if (nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.startsWith('/\\')) return nextParam;`
  Better still, always parse against a fixed base and re-validate `url.hostname` against the allowlist, returning only `url.pathname + url.search`.

---

## 5. 🟡 MEDIUM findings

### M1 — Weak randomness for WhatsApp 2FA login OTP
- **Location (verified):** `apps/api/src/domain/auth/two-factor.controller.ts:465` — `Math.floor(100000 + Math.random() * 900000)`.
- **Why:** `Math.random()` is not cryptographically secure and is predictable. **Every other OTP path in the codebase correctly uses `crypto.randomInt`** (checkout, profiles, forms phone/email verification, developer apps) — this one is the outlier.
- **Solution:** `crypto.randomInt(100000, 1000000).toString()`.

### M2 — Authenticated user can delete arbitrary S3 objects (weak delete scoping)
- **Location (verified):** `apps/api/src/modules/upload/upload.controller.ts:81-109` → `upload.service.ts:497-509`. `deleteKeys` deletes whatever raw S3 keys the caller supplies; the only ownership logic filters the user's own `bannerUrls` in the DB, but the S3 delete runs on client-supplied keys with **no `users/{userId}/` prefix check**.
- **Why:** Keys are predictable (`buildKey` → `users/{userId}/banners/{timestamp}-...`). A user who learns/guesses another user's key can delete their file. Presign/confirm are correctly scoped; only delete is not.
- **Solution:** In `deleteKeys`, reject any key not prefixed with `users/${userId}/` (pass `userId` through and validate), or intersect the requested keys with keys the user actually owns before deleting.

### M3 — Startup env validation is dead code; `INTERNAL_API_SECRET` protects nothing
- **Location (verified):** `apps/api/src/core/config/env.validation.ts` is imported only by `main-secure.ts:5`, but the real entrypoint is `main.ts` (`package.json` → `nest start`), and `ConfigModule.forRoot` passes no `validate`. `INTERNAL_API_SECRET` appears **only** in `env.validation.ts` — no guard/middleware consumes it.
- **Why:** The schema checks (min-length secrets, required `DATABASE_URL`, `TWO_FACTOR_ENCRYPTION_KEY`, etc.) never run; only the two inline `JWT_SECRET` checks in `main.ts:100-114` are enforced. If any "internal-only" endpoint is *assumed* protected by `INTERNAL_API_SECRET`, that protection does not exist.
- **Solution:** Wire `validate: validateEnv` into `ConfigModule.forRoot` in `app.module.ts` (or call it at the top of `main.ts`). Audit for endpoints that should be internal-only and add a guard that checks `INTERNAL_API_SECRET`, or remove the variable if unused.

### M4 — Qaseh payment webhook has no signature verification
- **Location:** `apps/api/src/integrations/qaseh-payment/qaseh-payment.controller.ts:118-183` — `POST /payments/qaseh/webhook` accepts any body with a `payment_id`, no HMAC/signature, no replay protection, and logs the full body (`:121`).
- **Mitigating factor:** It re-fetches authoritative status from Qaseh via `getPaymentContext(paymentId)` rather than trusting the body, so direct amount/status tampering is not possible. Still unauthenticated and abusable (forced status re-checks, log noise).
- **Solution:** Verify a gateway signature the way the Meta webhook already does correctly (`whatsapp-provider/webhooks/meta-webhook.controller.ts:54-79` — `x-hub-signature-256` HMAC over the raw body with `timingSafeEqual`). Add replay protection (timestamp/nonce). Stop logging full webhook bodies.

### M5 — OAuth accounts auto-linked by email (including Facebook)
- **Location:** `apps/api/src/domain/auth/auth.service.ts:128-153`; `facebookLogin` at `:344` flows through the same path.
- **Why:** The header comment claims OAuth is *not* auto-linked without confirmation, but the code links whenever emails match. For Google/LinkedIn (verified emails) this is acceptable; Facebook does not always guarantee a verified email, so a Facebook account with a spoofed/unverified email matching a victim could take over the existing account.
- **Solution:** Exclude providers without guaranteed email verification from auto-link, or require explicit link confirmation for them.

### M6 — `accounts` middleware only decodes JWT (no signature verification)
- **Location:** `apps/accounts/middleware.ts:95-96, 123, 144-145, 163` — uses `decodeJwt` (never `jwtVerify`) and derives `role` to drive redirects.
- **Why:** Not the security boundary (backend still verifies data requests), but a forged token with an arbitrary `role`/`exp` controls redirect logic and "logged-in" appearance. Authorization decisions should never rest on an unverified token.
- **Solution:** Use `jwtVerify(token, JWT_SECRET)` like `hq`/`forms`, or drop role logic from middleware and rely on server-side `/auth/me`.

### M7 — Client-side-only route protection for `accounts` `/manage` and `/onboarding`
- **Location:** `apps/accounts/app/manage/{layout,page}.tsx` render a `"use client"` root; the only gate is a cookie *presence* check (`middleware.ts:183`).
- **Solution:** Add a server-component/DAL guard (mirroring `hq`/`developer` `getDashboardUser()` → `/auth/me` → `redirect()`) at the `manage`/`onboarding` layout level.

### M8 — Missing CSP / security headers on `hq`, `app`, `workspace`
- **Location:** `apps/hq/next.config.ts` (no `headers()`, middleware sets only `x-user-*`), `apps/app/next.config.ts`, `apps/workspace/next.config.ts` (no headers, no middleware). `forms`/`public` apply full CSP; `accounts` sets a partial set.
- **Why:** `hq` is the **admin console** with no CSP, `X-Frame-Options`, `nosniff`, or HSTS — weak clickjacking/XSS posture.
- **Solution:** Reuse `@rukny/forms-shared` `apply-security-headers` in each app's middleware so all apps get CSP + `X-Frame-Options: DENY` + `nosniff` + HSTS.

### M9 — Redis password on the process command line and healthcheck args
- **Location:** `docker-compose.yml:33` (`redis-server --requirepass ${REDIS_PASSWORD}`) and `:41` (`redis-cli -a ${REDIS_PASSWORD} ping`); same in dev/test compose files.
- **Why:** Password appears in container argv (`docker inspect`, `docker compose config`, in-container `ps`) and in health logs.
- **Solution:** Mount a `redis.conf` carrying `requirepass`; for the healthcheck use `REDISCLI_AUTH`: `test: ["CMD-SHELL", "REDISCLI_AUTH=$REDIS_PASSWORD redis-cli ping"]`.

---

## 6. 🔵 LOW findings (hardening / hygiene)

| ID | Finding | Location | Fix |
|----|---------|----------|-----|
| L1 | JWT algorithm not pinned on verify (HS/RS confusion defense-in-depth) | `token.service.ts`, `jwt.strategy.ts:60-67`, `quicksign.service.ts` | Pass `algorithms: ['HS256']` on all `verify` calls |
| L2 | `|| 'default-secret'` fallback + non-constant-time signature compare for signed Drive URLs | `integrations/google-drive/google-drive.service.ts:601,630,637` | Remove fallback (fail closed); use `crypto.timingSafeEqual` |
| L3 | 2FA decrypt silently returns legacy plaintext base32 if not in `iv:tag:ct` form | `two-factor.service.ts:104-113` | Migrate legacy secrets, remove plaintext fallback |
| L4 | Modulo-biased OTP generator | `order-tracking.service.ts:479-483` | Use `crypto.randomInt` |
| L5 | `SanitizePipe` regex "SQLi protection" corrupts legitimate input, gives no real protection | `core/common/pipes/sanitize.pipe.ts:225-243` | Remove the regex stripping; rely on Prisma parameterization (raw queries reviewed — all use bind params) |
| L6 | Meta webhook needs `rawBody` but app isn't created with `rawBody: true` | `main.ts:60-74` vs `meta-webhook.controller.ts:61-65` | Enable `rawBody: true` so the (correct) signature check actually runs; currently fails closed = webhook broken |
| L7 | Verbose logging of PII/tokens/webhook bodies | `qaseh-payment.controller.ts:121`, `quicksign.service.ts`, `sanitize.pipe.ts:134-155` | Redact; client-facing disclosure is already handled well by `http-exception.filter.ts:73-77` |
| L8 | `images.remotePatterns` allows any `**.amazonaws.com` (limited image-proxy SSRF) | `apps/*/next.config.ts` | Pin to the specific bucket host |
| L9 | `:latest`/floating image tags for pgadmin, nginx, cloudflared | `docker-compose.yml:341,363,388` (+dev/test) | Pin to specific versions/digests |
| L10 | No resource limits (`mem_limit`/`cpus`) on any container → self-DoS risk (e.g. ffmpeg) | `docker-compose.yml` (all services) | Add per-service limits |
| L11 | Duplicate CI (`ci.yml` ≡ `ci-cd.yml`), no `permissions:` block, `@v4` tag pins, PR-triggered E2E secrets, root `npm ci` with no root `package.json`, `deploy.sh` `export $(...)` secret spill, stale `fix_dockerfiles.ps1`/`update_compose.py`, root `.dockerignore` misses `.env`/`nginx/ssl` | `.github/workflows/*`, `deploy.sh:21`, `.dockerignore:31-32` | Delete duplicate workflow; add `permissions: contents: read`; scope E2E secrets to a reviewed Environment; pin actions to SHAs; use `--env-file`; delete stale scripts; extend `.dockerignore` |

Also flagged during infra review, worth rotating: **partially-masked TikTok credentials** in `apps/api/.env.example:124-125` (`aw-------q7l-t` / `O-ECQ-------DKxF2w-Ad72`) look like hand-masked real values, unlike the `your-...` placeholders elsewhere. Rotate the TikTok app secret and replace with proper placeholders. Add `server_tokens off;` to `nginx/nginx.conf` (M-ish hardening), and prefer `restart: unless-stopped` over `always` for production services.

---

## 7. Verified NOT vulnerable (do not "fix" these)

During verification, several items that look dangerous — including two the automated pass initially flagged as HIGH — were confirmed **already mitigated** in the current code:

- **Qaseh payment endpoints are NOT unauthenticated / IDOR-able.** Both `POST initiate/:orderId` (`qaseh-payment.controller.ts:83-101`) and `GET status/:orderId` (`:327-354`) are guarded by `CheckoutSessionGuard` **and** call `assertOrderOwnership(order, req.checkoutSession)` (`:59-77`), which enforces `userId` or normalized-phone match and throws `ForbiddenException` otherwise. Order IDOR is properly closed.
- **SSRF in the URL-metadata fetcher is mitigated.** `url-metadata.service.ts:29,59` calls `assertUrlSafe` + `safeFetch` from a real, thorough `ssrf-guard.ts` that blocks non-http(s), embedded credentials, `localhost`/`.internal`/`.local`, resolves DNS and rejects private/loopback/link-local/reserved IPv4 **and** IPv6 (including `169.254.169.254` and `::ffff:` mapped), and **re-validates every redirect hop** manually. This is a correct implementation.
- **`hq`/`forms` middleware verify JWT signatures** with `jwtVerify(JWT_SECRET)` and check `exp` (not just decode) — `apps/hq/lib/middleware-auth.ts:60`. (The separate fallback-secret issue is H4, not a decode-only bug.)
- **`dangerouslySetInnerHTML` usages are safe** — the code-snippet highlighter escapes HTML before applying spans (`apps/forms/components/integrations/code-snippet-card.tsx:15-48`); no user-controlled HTML/markdown is rendered.
- **No secrets leaked to client bundles**; `JWT_SECRET` appears only in server-only middleware files; no committed `.env` except `.example` files.
- **Cookies** are `httpOnly` + `Secure` (prod) + `SameSite=Lax` + `.rukny.io` domain with `__Host-`/`__Secure-` prefixes; CSRF uses origin/referer + double-submit with `timingSafeEqual`.
- **Raw SQL is parameterized** — `$queryRawUnsafe` calls in `admin/*` use `$1/$2` bind params; `backup.service.ts` validates table names against an allowlist and isn't user-reachable.
- **Containers run as non-root** — all 8 Dockerfiles create a uid-1001 user and set `USER` before `CMD`.

---

## 8. Remediation roadmap (priority order)

**Do now (Critical, hours):**
1. **C1** — revoke/rotate the committed TLS key; remove from tree; purge from git history; extend `.gitignore`.
2. **C2** — remove `db.rukny.io` pgAdmin block; re-enable its CSRF flags; access via SSH tunnel / Cloudflare Access.

**This week (High):**
3. **H1** — bind api/hq to `127.0.0.1` (or drop host ports).
4. **H3** — remove Nginx host ports 80/443 (tunnel-only ingress) and tighten `set_real_ip_from`.
5. **H2** — strip `JWT_SECRET` from build args + `forms` Dockerfile; then rotate `JWT_SECRET`.
6. **H4** — fail closed on missing `JWT_SECRET` in `hq`/`forms` middleware.
7. **H5** — block protocol-relative `next=` redirects.
8. Rotate the **TikTok** secret; sanitize `.env.example`.

**Next (Medium):** M1 (crypto OTP), M2 (S3 delete scoping), M3 (wire env validation + `INTERNAL_API_SECRET`), M4 (Qaseh webhook signature), M5 (Facebook auto-link), M6/M7 (accounts middleware verify + server guard), M8 (CSP for hq/app/workspace), M9 (Redis secret handling).

**Backlog (Low):** L1–L11 hardening — algorithm pinning, remove SanitizePipe regex, enable `rawBody` for Meta webhook, pin image tags, add resource limits, dedupe CI + add `permissions:`, scope E2E secrets, harden `deploy.sh`, extend `.dockerignore`, `server_tokens off`, `restart: unless-stopped`.

---

## 9. Appendix — methodology & caveats

- Findings were produced by systematic review across four domains (API, frontends, infrastructure, shared packages) and then **every High/Critical was re-read at the source line** to eliminate false positives. Two initially-flagged HIGH items (Qaseh IDOR, metadata SSRF) were downgraded to "not vulnerable" on that basis — see §7.
- `git` is not installed on this machine, so tracking/history could not be queried directly. Committed-file findings (C1, TikTok creds) are based on the working tree plus `.gitignore` pattern analysis; confirm with `git ls-files` and `git log` on a machine that has git.
- Not exhaustively traced: a full controller-by-controller IDOR sweep across every domain service (forms/stores/events/social). Spot checks (form submissions scoped by `formId`, the `OwnerGuard`/`@CheckOwnership` pattern) were clean, but a systematic sweep for services doing `findUnique({ where: { id } })` without an owner filter is the highest-value follow-up.
- Line numbers reflect the tree as of the audit date and may drift as the code changes.
