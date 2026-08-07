# Rukny Workspace — Complete SendGrid Work Plan (English)

> **Last updated:** 2026-08-06  
> **Provider (official launch):** Twilio SendGrid **Essentials 50K** — **$19.95/mo**, 50,000 emails included, overage **$0.00133/email**  
> **Upgrade path:** Essentials 100K — $34.95/mo when platform volume sustains **>~50–70k** emails/month  
> **Related docs:**  
> - [WORKSPACE_SENDGRID_SETUP.md](./WORKSPACE_SENDGRID_SETUP.md)  
> - [RUKNY_PROFIT_MODEL.md](./RUKNY_PROFIT_MODEL.md)  
> - [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md)  
> - [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md)  
> - [WORKSPACE_DATABASE_SCHEMA.md](./WORKSPACE_DATABASE_SCHEMA.md)  
> - Platform plans: [../21/SUBSCRIPTION_PLANS.md](../21/SUBSCRIPTION_PLANS.md)

---

## 0) Goal (Definition of Done)

A paying Rukny user (Professional+) can:

1. Authenticate **their own domain** through our UI (not manual SendGrid Console per customer).  
2. Create mailboxes (`support@customer.com`, …) within plan limits.  
3. **Send** mail from that address to any recipient (Gmail/Outlook) with passing SPF/DKIM.  
4. **Receive** mail into Rukny Inbox via SendGrid **Inbound Parse**.  
5. Reply in-thread with correct `In-Reply-To` / `References`.  
6. Have bounces/spam reports drive **suppressions** and delivery status in our DB.

SSO, billing, and team gates remain on existing Rukny platform systems.

---

## 1) Official SendGrid integration review (source of truth)

Reviewed against Twilio SendGrid docs (Domain Authentication API, Mail Send, Inbound Parse, Event Webhook security).

### 1.1 Sending — Mail Send API (preferred) or SMTP

| Item | Official guidance | Rukny choice |
|------|-------------------|--------------|
| Primary send path | [Mail Send API](https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send) `POST /v3/mail/send` | **API (v3)** for compose/reply |
| Alternate | SMTP `smtp.sendgrid.net:587`, username `apikey`, password = API key | Optional fallback only |
| Auth | API key with **Mail Send** | Store in `apps/api` secrets |
| From address | Must match an **authenticated domain** (multi-tenant) | Per customer domain, never unverified From |

### 1.2 Domain Authentication (whitelabel domains)

| Item | Official guidance | Rukny choice |
|------|-------------------|--------------|
| Create | `POST /v3/whitelabel/domains` | On user “Add domain” |
| Validate | `POST /v3/whitelabel/domains/{id}/validate` | On user “Verify DNS” + cron re-check |
| Automatic Security `true` | Returns **3 CNAME** records (mail + 2 DKIM) | See **§1.4 conflict** |
| Automatic Security `false` | Returns **TXT/MX** style records | Prefer for domains that also **receive** |
| Matching | SendGrid picks auth domain matching **From** domain | Store `sendgridDomainId` on our `workspace_domains` |
| Default domain | Optional account default | Do **not** set customer domains as account default |

Reference: [Authenticate a domain](https://www.twilio.com/docs/sendgrid/api-reference/domain-authentication/authenticate-a-domain)

### 1.3 Inbound Parse (receive → webhook)

| Item | Official guidance | Rukny choice |
|------|-------------------|--------------|
| Mechanism | MX for receiving hostname → `mx.sendgrid.net` | Customer DNS MX for mailboxes |
| Console/API | Settings → Inbound Parse / `POST` parse settings | Automate via [Parse Settings API](https://docs.sendgrid.com/api-reference/settings-inbound-parse/create-a-parse-setting) when possible |
| Hostname | Must belong to an **authenticated** domain on the account | Same customer domain (or receive subdomain — see §1.4) |
| Payload | `multipart/form-data` POST to our URL; optional `send_raw` | Prefer `send_raw=true` for MIME fidelity + store in S3 |
| Limits | Total attachments ~**30MB** class constraints; process quickly | Persist immediately; Essentials activity history is only **3 days** |
| Docs | [Setting up Inbound Parse](https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/setting-up-the-inbound-parse-webhook) | Required reading for implementers |

**Critical SendGrid warning:** Do not casually change MX if the customer still uses Google/Microsoft for that apex. For Workspace, connecting mail means **Rukny becomes their MX** for that domain (or a dedicated mail subdomain product decision — MVP = full domain mail).

### 1.4 Critical architecture conflict: Automatic Security + same-host Inbound Parse

From SendGrid Inbound Parse docs:

> If the receiving domain is the **same** as the authenticated domain and **Automatic Security is ON**, mail can enter an **infinite loop** between CNAME and MX.

**Rukny decision (MVP):**

| Option | Description | Decision |
|--------|-------------|----------|
| **A (chosen)** | Authenticate customer domain with `automatic_security: false` when Inbound Parse is on the **same** hostname as mailboxes | ✅ Default for Workspace domains |
| B | Send from authenticated subdomain (`em.customer.com`) + receive on apex | ❌ Worse branding / DMARC friction for MVP |
| C | Receive only on `parse.customer.com` | ❌ Breaks `support@customer.com` inbox product |

Also collect **DMARC** TXT guidance (`p=none` initially) in UI even if SendGrid does not create it for you.

### 1.5 Event Webhook (delivery / bounce / spam)

| Item | Official guidance | Rukny choice |
|------|-------------------|--------------|
| Endpoint | HTTPS POST, JSON **array** of events | `POST /workspace/webhooks/sendgrid/events` |
| Security | Signed Event Webhook (ECDSA); headers `X-Twilio-Email-Event-Webhook-Signature` + `Timestamp` | **Mandatory**; verify on **raw body** |
| Events (min) | `processed`, `delivered`, `bounce`, `dropped`, `deferred`, `spamreport`, `unsubscribe` | Subscribe all delivery-critical |
| Plan | Essentials includes event webhooks (limited count vs higher tiers) | 1 production webhook endpoint |
| Docs | [Event Webhook security](https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features) | |

### 1.6 Essentials plan constraints (product impact)

| Constraint | Impact |
|------------|--------|
| No **Subusers** | Tenant isolation is **logical** (our DB) — one SendGrid account |
| No dedicated IP | Shared IP reputation — enforce hard send caps + suppressions |
| 3-day activity history | Rukny DB/S3 is the system of record |
| 50k included | Platform-wide meter + upgrade to 100K when needed |
| API key scope | Least privilege: Mail Send + whitelabel domains + inbound parse + webhook read as needed |

---

## 2) Target architecture

```
                    ┌─────────────────────────────┐
  Customer DNS      │ SPF/DKIM (auth) + MX         │
                    │ MX → mx.sendgrid.net         │
                    └─────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
  SendGrid Auth Domain     SendGrid Inbound Parse    SendGrid Event Webhook
  (whitelabel)             (multipart / raw MIME)    (signed JSON batch)
         │                        │                        │
         │                        ▼                        ▼
         │               POST /workspace/webhooks/sendgrid/inbound
         │                        │
         │                        ▼
         │               API: store raw S3 → parse → thread/mailbox DB
         │
         ▼
  App: Compose/Reply ──► POST /v3/mail/send ──► Internet recipients
         ▲
         │
  SSO accounts.rukny.io · plan limits · team (Pro+)
```

**No SES/Lambda required for launch.** Optional S3 still used for raw MIME + attachments inside Rukny infra.

---

## 3) Work phases (complete plan)

### Phase 0 — Account, compliance, secrets (Week 0–1)

**Owner:** Ops + Backend lead  

| Task | Done when |
|------|-----------|
| Subscribe **Essentials 50K** | Invoice / plan visible |
| Complete SendGrid account verification / sender identity as required | Can create API keys |
| Create production API key (restricted scopes) + staging key | Stored in secrets manager / env |
| Enable **Signed Event Webhook**; save public verification key | Key in env |
| Authenticate staging domain e.g. `mail-staging.rukny.io` | DNS valid |
| Smoke: Mail Send to personal inbox + sandbox recipients | Delivered |
| Document env vars (see §5) | Checked into setup doc |

**Exit criteria:** Staging send works; webhook signature verification prototype green.

---

### Phase 1 — Data model & provider abstraction (Week 1–2)

**Owner:** Backend  

| Task | Done when |
|------|-----------|
| Prisma: domains, mailboxes, threads, messages, suppressions, provider IDs | Migration applied |
| Fields: `sendgridDomainId`, `dnsRecords` JSON, `verifiedAt`, `inboundHostname` | Schema merged |
| `WorkspaceMailProvider` interface (`authenticateDomain`, `validateDomain`, `send`, `parseInbound`, …) | SendGrid impl + fake for tests |
| Enforce `WORKSPACE_LIMITS` from plan (domains/mailboxes/sendMonthly) | Unit tests |
| Team gate: Form/workspace team from Pro+ (2/5/10) unchanged | Limits wired |

**Exit criteria:** Domain + mailbox CRUD persists without SendGrid live calls (mocked).

---

### Phase 2 — Domains API + DNS UX (Week 2–4)

**Owner:** Backend + Frontend  

| Task | Done when |
|------|-----------|
| `POST /workspace/domains` → `POST /v3/whitelabel/domains` with `automatic_security: false` (MVP receive) | DNS records returned to UI |
| UI shows copyable DNS table (SPF/DKIM/MX/DMARC instructions) | RTL Arabic UI |
| `POST /workspace/domains/:id/verify` → SendGrid validate | Status ✅/❌ |
| Cron: re-validate pending domains every 15–60 min | Auto flip to verified |
| Create Inbound Parse setting for hostname after auth | Parse hostname registered |
| Block mailbox create until domain `valid` | API 400 + copy |

**Official mapping**

```
User adds example.com
  → POST /v3/whitelabel/domains { domain, subdomain?, automatic_security: false, default: false }
  → Persist dns[] for UI
  → User adds DNS at registrar
  → POST /v3/whitelabel/domains/{id}/validate
  → On success: create Inbound Parse { hostname: "example.com", url: "https://api…/inbound", send_raw: true }
  → Instruct MX → mx.sendgrid.net (priority 10)
```

**Exit criteria:** One real test domain verified end-to-end from UI.

---

### Phase 3 — Send path (Week 3–5)

**Owner:** Backend  

| Task | Done when |
|------|-----------|
| `POST /workspace/mail/send` builds MIME / personalizations | Sends via `/v3/mail/send` |
| Attachments via S3 upload then SendGrid attachments | ≤ plan attachment size |
| Custom args / headers: `mailboxId`, `threadId`, `messageId` | Round-trip in Event Webhook |
| Plan send counters + hard stop at limit | 429 / friendly error |
| Suppression check before send | Blocked addresses skipped |
| Store Sent copy in DB regardless of webhook lag | Sent folder works offline of events |

**Exit criteria:** Mail from `support@verified-domain` lands in Gmail; DKIM pass.

---

### Phase 4 — Inbound Parse + Inbox persistence (Week 4–6)

**Owner:** Backend  

| Task | Done when |
|------|-----------|
| `POST /workspace/webhooks/sendgrid/inbound` accepts multipart | Fast 2xx (<10s) |
| Verify request (shared secret query token or IP allowlist + HTTPS) | Reject unauthorized |
| Store raw MIME to object storage | Retrievable |
| Resolve mailbox by `To` / envelope recipients | Unknown → drop/log |
| Threading by `Message-ID` / `In-Reply-To` / `References` | Correct thread |
| Attachment extract + virus-size limits | Safe defaults |
| Realtime optional: Socket.IO / poll | Inbox updates |

**Exit criteria:** External Gmail → customer mailbox appears in DB ≤ 60s.

---

### Phase 5 — Event Webhook + suppressions (Week 5–7)

**Owner:** Backend  

| Task | Done when |
|------|-----------|
| Signed verification on raw body | Invalid sig → 401 |
| Map events to message delivery state | UI shows delivered/bounced |
| Bounce + spamreport → `suppressions` table | Future sends blocked |
| Alerts when account bounce/spam rates spike | Ops notified |
| Meter monthly platform sends vs 50k | Dashboard internal |

**Exit criteria:** Bounce to invalid address creates suppression automatically.

---

### Phase 6 — Frontend product shell (Week 6–9)

**Owner:** Frontend  

| Route | Scope |
|-------|--------|
| `/app/domains` | Add / DNS / verify status |
| `/app/mailboxes` | CRUD within limits + signature |
| `/app/mail` | Inbox list / filters |
| `/app/mail/compose` | New message |
| `/app/mail/[threadId]` | Thread + reply |
| `/app/settings` | Quotas, plan upsell |

Reuse Forms shell patterns (sidebar, mobile dock, SSO BFF).

**Exit criteria:** Click-path story: add domain → verify → mailbox → send → receive → reply.

---

### Phase 7 — Soft launch hardening (Week 9–10)

| Task | Done when |
|------|-----------|
| Deliverability checklist (DMARC p=none → quarantine later) | Written runbook |
| Load test inbound webhook | No timeouts / duplicates handled |
| Idempotency keys on inbound (Message-ID) | No double insert |
| Support macros for DNS failure | Help desk ready |
| Profit guards: hard caps + overage alerts | Aligned with `RUKNY_PROFIT_MODEL.md` |
| Decision: stay 50K vs upgrade 100K | Based on real volume |

**Exit criteria:** Closed beta with ≥5 Professional tenants sending/receiving daily.

---

## 4) Engineering backlog (checklist)

### Backend (`apps/api`)

- [ ] `SendGridMailProvider` module  
- [ ] Domain auth + validate clients  
- [ ] Inbound parse + events controllers (raw body middleware)  
- [ ] Suppression service  
- [ ] Usage metering / plan enforcement  
- [ ] Attachment pipeline (S3)  

### Frontend (`apps/workspace`)

- [ ] Domains UI + DNS copy states  
- [ ] Mailboxes UI  
- [ ] Inbox / Compose / Reply  
- [ ] Plan limit empty-states → upgrade  

### Ops

- [ ] Essentials 50K subscription  
- [ ] Secrets + rotation policy  
- [ ] Staging vs prod SendGrid subaccounts **not** available on Essentials → use separate SendGrid accounts or separate API keys + careful env separation  
- [ ] Monitoring: send volume, bounce %, webhook error rate  

---

## 5) Environment variables

```env
WORKSPACE_MAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG....
SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY=...   # ECDSA verify key from Signed Event Webhook
SENDGRID_INBOUND_WEBHOOK_SECRET=...     # query/header shared secret for parse URL
WORKSPACE_PUBLIC_API_BASE=https://api.rukny.io
WORKSPACE_S3_BUCKET_RAW=rukny-workspace-emails-raw
WORKSPACE_S3_BUCKET_ATTACHMENTS=rukny-workspace-attachments
```

Webhook URLs:

```
https://api.rukny.io/workspace/webhooks/sendgrid/events
https://api.rukny.io/workspace/webhooks/sendgrid/inbound?token=...
```

---

## 6) API surface (Rukny) — aligned to MVP

```
POST   /workspace/domains
GET    /workspace/domains
GET    /workspace/domains/:id
POST   /workspace/domains/:id/verify
DELETE /workspace/domains/:id

POST   /workspace/mailboxes
GET    /workspace/mailboxes
PATCH  /workspace/mailboxes/:id
DELETE /workspace/mailboxes/:id

GET    /workspace/mail
GET    /workspace/mail/:threadId
POST   /workspace/mail/send
POST   /workspace/mail/draft
DELETE /workspace/mail/:id

POST   /workspace/webhooks/sendgrid/inbound
POST   /workspace/webhooks/sendgrid/events
```

Replace previous SES webhook path with SendGrid paths above.

---

## 7) DNS records the customer must add (MVP message)

Exactly what UI should explain (generated per domain from SendGrid + our MX instruction):

1. **Domain Authentication records** returned by SendGrid (`automatic_security: false` → typically SPF/DKIM TXT + related).  
2. **MX** for the receiving hostname: `10 mx.sendgrid.net.`  
3. **DMARC** (Rukny-recommended): `_dmarc.customer.com` TXT `v=DMARC1; p=none; rua=mailto:dmarc@rukny.io` (tune later).  

Never instruct customers to keep Google Workspace MX **and** full-domain Inbound Parse on the same hostname without a split-domain design.

---

## 8) Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Automatic Security + Inbound on same host loops | `automatic_security: false` for Workspace domains (§1.4) |
| Shared IP poor reputation | Hard caps, suppressions, gradual ramp, no bought lists |
| Essentials 50k exhaustion | Metering + upgrade to 100K + priced send packs |
| No Subusers | Strict tenant filters on every query; mailbox ownership checks |
| Webhook retries / duplicates | Idempotent Message-ID upserts |
| Customer DNS delays | Clear pending states + cron validate + help articles |
| Legal abuse | Per-plan limits, rate limits, abuse review for Business 100k cap |

---

## 9) Success metrics

| Metric | Target (soft launch) |
|--------|----------------------|
| Domain verify success ≤ 48h after DNS | ≥ 80% |
| Send → Gmail inbox (not spam) on warmed domains | Qualitatively OK on first tenants |
| Inbound → DB latency | ≤ 60 seconds p95 |
| Bounce rate | < 5% |
| Spam report rate | < 0.1% |
| Mail cost vs MRR | Covered by ≥ ~2 Professional subs (see profit model) |

---

## 10) Official documentation index (bookmark these)

| Topic | URL |
|-------|-----|
| Domain Authentication API | https://www.twilio.com/docs/sendgrid/api-reference/domain-authentication/authenticate-a-domain |
| Validate domain | https://www.twilio.com/docs/sendgrid/api-reference/domain-authentication/validate-a-domain |
| Mail Send | https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send |
| Inbound Parse setup | https://www.twilio.com/docs/sendgrid/for-developers/parsing-email/setting-up-the-inbound-parse-webhook |
| Create parse setting | https://docs.sendgrid.com/api-reference/settings-inbound-parse/create-a-parse-setting |
| Event Webhook security | https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features |
| SMTP (optional) | https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp |

---

## 11) Phase timeline (summary)

| Weeks | Phase | Outcome |
|------:|-------|---------|
| 0–1 | 0 Account & smoke | Keys, signed webhooks, staging send |
| 1–2 | 1 Data + provider | Prisma + SendGrid adapter |
| 2–4 | 2 Domains | Self-serve auth + validate + parse setup |
| 3–5 | 3 Send | Compose/reply live |
| 4–6 | 4 Inbound | Inbox populated from Internet |
| 5–7 | 5 Events | Suppressions + statuses |
| 6–9 | 6 Frontend | Full Workspace UX |
| 9–10 | 7 Hardening | Closed beta ready |

Parallelize FE shell (Phase 6) with Phases 3–5 using mocks where needed.

---

## 12) Changelog

| Date | Change |
|------|--------|
| 2026-08-06 | Initial English work plan; SendGrid-reviewed domain / parse / webhook architecture; Automatic Security conflict decision |

---

*Implementation starts at Phase 0. Do not build SES receiving for launch. Keep SES docs as a future cost-optimization path only.*
