# Rukny Workspace — Implementation Roadmap (Phases)

> **Last updated:** 2026-06-21  
> **AWS Region (fixed):** `us-east-1` (N. Virginia)  
> **Product:** Multi-tenant business email for **every** Rukny subscriber — not Rukny’s domain only  
> **App:** `workspace.rukny.io` · **API:** `apps/api/src/workspace/`  
> **Related:** [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md) · [WORKSPACE_SES_SETUP.md](./WORKSPACE_SES_SETUP.md) · [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md)

---

## Product model (read first)

Rukny Workspace is a **multi-tenant SaaS email platform**:

- **Any paying Rukny user** can connect **their own domain** (e.g. `mystore.com`, `clinic.iq`).
- They create **mailboxes** on that domain (`support@`, `orders@`, `info@`).
- They **send and receive** email through the Workspace web app.
- Later phases add **team members**, **shared mailboxes**, and **role-based access** — multiple employees on the same inbox.

Rukny operates the infrastructure (Amazon SES, S3, API). Each tenant’s data is isolated by `userId` / `domainId` / `mailboxId`.

```
Rukny Platform
└── Tenant A (merchant)     → mystore.com    → support@, orders@
└── Tenant B (clinic)       → clinic.iq      → info@, appointments@
└── Tenant C (events)       → events.co      → events@
```

**Separate from platform mail:** `notifications@rukny.io` (Resend) stays for OTP, security, and system alerts — not customer Workspace mail.

---

## Phase overview

| Phase | Name | Duration | Status |
|-------|------|----------|--------|
| **0** | AWS SES & production access                | 1–3 weeks | ⏳ Not started |
| **1** | AWS inbound/outbound plumbing              | 2 weeks   | ⏳             |
| **2** | Database & domain/mailbox API              | 2 weeks   | ⏳             |
| **3** | Outbound email (send)                      | 2 weeks   | ⏳             |
| **4** | Inbound email (receive)                    | 2 weeks   | ⏳             |
| **5** | Frontend MVP (Inbox + Compose)             | 2–3 weeks | 🟡 Shell only  |
| **6** | Team & shared mailboxes                    | 3–4 weeks | ⏳             |
| **7** | Rukny cross-product integration            | 3–4 weeks | ⏳             |
| **8** | Automation & productivity                  | 4 weeks | ⏳ |
| **9** | Growth & monetization extras               | 4+ weeks | ⏳ |
| **10** | Enterprise scale                          | Ongoing | ⏳ |

**MVP launch = Phases 0–5 complete** (~10–12 weeks from backend start).

---

## Phase 0 — AWS SES & production access

### Goal

Unlock real-world email sending before building product code. SES new accounts start in **Sandbox** (200 emails/day, verified recipients only). Production access is required for any Rukny customer to email real clients.

### Duration

1–3 weeks (AWS review can take 24 hours to several weeks).

### What you do (no application code)

1. Activate AWS billing — **Region fixed to `us-east-1`** (do not split resources across Regions).
2. Open **Amazon SES** in **us-east-1** (N. Virginia).
3. Create a **verified identity** for `rukny.io` (or `mail.rukny.io`) with Easy DKIM — add DNS records at your registrar.
4. Submit **Request production access** with a detailed use case (see [WORKSPACE_SES_SETUP.md](./WORKSPACE_SES_SETUP.md) §4).
5. While waiting: test in Sandbox with your personal verified email and SES simulators (`success@simulator.amazonses.com`, etc.).

### Deliverables

| Item | Description |
|------|-------------|
| SES Production enabled | `ProductionAccessEnabled: true` |
| Platform domain verified | DKIM passing for `rukny.io` |
| IAM user/role | Least-privilege credentials for API/Lambda |
| Support case documented | Copy of approved request for audit |

### Success criteria

- [ ] Can send to **any** valid recipient (not only verified addresses)
- [ ] Daily quota ≥ platform needs for first 100 tenants (~2,000/day initial ask)
- [ ] Bounce/complaint monitoring plan documented

### Risks

| Risk | Mitigation |
|------|------------|
| Request rejected | Resubmit with SPF/DKIM/DMARC details, lower volume ask (500/day) |
| Wrong Region | All Workspace AWS resources must stay in **`us-east-1`** — SES identities are per-Region |
| Delay blocks MVP | Start this **before** backend development |

### Out of scope

- Customer domains, mailboxes, UI, Lambda — later phases.

---

## Phase 1 — AWS inbound/outbound plumbing

### Goal

Prepare shared AWS resources that **all tenants** will use. One Rukny AWS account; per-tenant isolation is logical (database + SES identities), not separate AWS accounts per customer.

### Duration

~2 weeks (after Phase 0 approval).

### Architecture

```
OUTBOUND:
  NestJS API → SES API v2 SendEmail → recipient
              → Configuration Set → SNS (bounce/complaint/delivery)

INBOUND:
  Internet → MX (customer domain) → SES Receiving
          → S3 (raw MIME) → SNS → Lambda → PostgreSQL
```

### Deliverables

| Resource | Purpose |
|----------|---------|
| S3 `rukny-workspace-emails-raw` | Raw inbound MIME from SES |
| S3 `rukny-workspace-attachments` | Outbound/inbound attachment blobs |
| SNS topic `workspace-inbound` | Triggers Lambda on new mail |
| SNS topic `workspace-ses-events` | Bounce, complaint, delivery |
| SES **Configuration Set** `rukny-workspace` | Links sends to event tracking |
| SES **Receipt rule set** | Active rule: S3 store + SNS notify |
| Lambda `workspace-inbound-processor` | Parse MIME, stub insert (wired in Phase 4) |
| KMS key (optional Phase 1) | Encrypt sensitive mailbox content |

### Environment variables (API)

```env
AWS_REGION=us-east-1
WORKSPACE_SES_CONFIGURATION_SET=rukny-workspace
WORKSPACE_S3_BUCKET_RAW=rukny-workspace-emails-raw
WORKSPACE_S3_BUCKET_ATTACHMENTS=rukny-workspace-attachments
WORKSPACE_SNS_TOPIC_INBOUND=arn:aws:sns:...
WORKSPACE_SNS_TOPIC_BOUNCE=arn:aws:sns:...
```

### Success criteria

- [ ] Test inbound mail to a verified domain lands in S3 within 60 seconds
- [ ] SNS → Lambda invocation succeeds (log-only OK for this phase)
- [ ] Test outbound send via SES API with Configuration Set attached
- [ ] Bounce simulator updates SNS → webhook endpoint (stub OK)

### Out of scope

- Per-customer domain onboarding UI, Prisma models, full Lambda → DB write.

---

## Phase 2 — Database & domain/mailbox API

### Goal

Persist tenants, domains, and mailboxes. Enforce **subscription limits** per Rukny plan (see [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md)).

### Duration

~2 weeks.

### Multi-tenant rules

| Rule | Implementation |
|------|----------------|
| One Rukny `userId` owns domains | `WorkspaceDomain.userId` |
| Domain names globally unique on platform | `@@unique([domain])` |
| Mailbox `localPart` unique per domain | `@@unique([domainId, localPart])` |
| Plan limits | Service layer: `WORKSPACE_LIMITS[plan]` |

### Prisma models

Full schema: [WORKSPACE_DATABASE_SCHEMA.md](./WORKSPACE_DATABASE_SCHEMA.md)

Core entities: `WorkspaceDomain`, `WorkspaceMailbox`, `WorkspaceEmail`, `WorkspaceAttachment`, `WorkspaceSuppression`.

### API endpoints

```
POST   /workspace/domains              Add domain (returns DNS records)
GET    /workspace/domains              List user's domains
GET    /workspace/domains/:id          Status + DNS checklist
POST   /workspace/domains/:id/verify   Re-check MX/SPF/DKIM/DMARC
DELETE /workspace/domains/:id          Remove domain (soft-delete mailboxes)

POST   /workspace/mailboxes            Create mailbox on verified domain
GET    /workspace/mailboxes            List mailboxes
PATCH  /workspace/mailboxes/:id        Signature, display name
DELETE /workspace/mailboxes/:id        Delete mailbox
```

### Per-tenant DNS flow

When user adds `mystore.com`:

1. API creates `WorkspaceDomain` with status `PENDING_DNS`.
2. API registers domain identity in **SES** (CreateEmailIdentity).
3. API returns DNS records for user to add at their registrar:
   - **MX** → SES inbound endpoint
   - **TXT SPF** → `v=spf1 include:amazonses.com ~all`
   - **CNAME** × 3 → DKIM tokens from SES
   - **TXT DMARC** → `v=DMARC1; p=none; rua=mailto:...`
4. Cron or manual `verify` checks records → status `ACTIVE`.

### Success criteria

- [ ] User on **Pro** plan can add 1 domain, reject 2nd with upgrade message
- [ ] User can create 3 mailboxes, reject 4th
- [ ] DNS verification reflects real DNS lookup results
- [ ] SES identity status synced with `WorkspaceDomain`

### Out of scope

- Sending/receiving messages, team members, frontend beyond placeholders.

---

## Phase 3 — Outbound email (send)

### Goal

Any tenant mailbox can **send** email through SES from `localPart@customer-domain.com`.

### Duration

~2 weeks.

### Flow

```
POST /workspace/mail/send
  → Auth: user owns mailbox
  → Validate: domain ACTIVE, quota not exceeded, recipient not suppressed
  → Insert WorkspaceEmail (OUTBOUND, QUEUED)
  → Upload attachments to S3
  → SES SendEmail / SendRawEmail (DKIM signed by SES)
  → Update status SENT, folder SENT
  → On SNS bounce/complaint → update status, add WorkspaceSuppression
```

### Features in this phase

| Feature | Included |
|---------|----------|
| New message (Compose) | ✅ |
| Reply (In-Reply-To, References) | ✅ |
| HTML + plain text body | ✅ |
| Attachments ≤ 10 MB (MVP) | ✅ |
| Per-mailbox HTML signature | ✅ |
| Reply all / Forward | ❌ Phase 8 |
| Drafts autosave | Basic |

### Abuse prevention (platform-wide reputation)

- Per-mailbox daily send cap (plan-based monthly ÷ 30)
- Rate limit: max N sends/minute per user
- Block if bounce rate on tenant > threshold
- Admin suspend domain on complaint spike

### Success criteria

- [ ] Email from `support@mystore.com` arrives in Gmail inbox (not spam) with valid DKIM
- [ ] Reply stays in same `threadId`
- [ ] Bounce to invalid address recorded; address suppressed for future sends
- [ ] Attachment downloadable by recipient

### Out of scope

- Inbound/receive, Inbox list UI (Phase 4–5).

---

## Phase 4 — Inbound email (receive)

### Goal

Email sent **to** any tenant mailbox on a verified domain appears in the database and (later) in Inbox UI.

### Duration

~2 weeks.

### Flow

```
External sender → MX on customer domain → SES Receiving
  → S3 raw object
  → SNS → Lambda workspace-inbound-processor
      → Parse headers (From, To, Subject, Message-ID, In-Reply-To)
      → Resolve mailbox by recipient address
      → Extract body (text/html) + attachments → S3
      → INSERT WorkspaceEmail (INBOUND, INBOX)
      → Match threadId via In-Reply-To / References / Subject
      → (Optional) Socket.IO notify domain owner
```

### Lambda responsibilities

1. **Idempotency** — dedupe by `Message-ID`.
2. **Tenant resolution** — `support@mystore.com` → `mailboxId` + `userId`.
3. **Spam** — rely on SES spam verdict; flag or drop per policy.
4. **Size limits** — reject oversized raw mail.
5. **Error handling** — DLQ for failed parses.

### Webhook

```
POST /workspace/webhooks/ses   (SNS subscription confirmation + notifications)
```

Handles: inbound fan-out (if not fully Lambda), bounce, complaint, delivery.

### Success criteria

- [ ] Mail from Gmail to `support@tenant-domain.com` appears in DB within 60s
- [ ] Threading groups replies with original conversation
- [ ] Attachments stored and linked to `WorkspaceAttachment`
- [ ] Unknown recipient (no mailbox) handled gracefully (drop or catch-all later)

### Out of scope

- Full-text search (PostgreSQL `ILIKE` only in MVP), team visibility, mobile push.

---

## Phase 5 — Frontend MVP (Inbox + Compose)

### Goal

Complete **self-service** experience for **each tenant**: connect domain, create mailboxes, read and send mail — Arabic RTL, SSO via `accounts.rukny.io`.

### Duration

~2–3 weeks (shell partially done).

### Pages

| Route | Function |
|-------|----------|
| `/app` | Dashboard overview |
| `/app/domains` | Add domain, DNS instructions, verification status |
| `/app/mailboxes` | CRUD mailboxes, signatures |
| `/app/mail` | Inbox list (threaded), read/unread |
| `/app/mail/[threadId]` | Conversation view + reply |
| `/app/mail/compose` | New message |
| `/app/settings` | Billing link, quotas |

### Auth

- Reuse Forms pattern: `lib/dal.ts`, cookies, `/api/auth` BFF proxy.
- Login redirect to `accounts.rukny.io` with `return_to`.

### Success criteria

- [ ] End-to-end: add domain → verify DNS → create mailbox → receive → reply → lands in recipient inbox
- [ ] Mobile dock + desktop sidebar
- [ ] Plan limit errors shown in Arabic with upgrade CTA
- [ ] E2E test: golden path (Playwright)

### MVP launch definition

**Phases 0–5 = public beta** for Pro+ subscribers in Iraq/region.

---

## Phase 6 — Team & shared mailboxes

### Goal

A business is not one person: **owner invites employees**, assigns roles, shares `support@` across multiple Rukny users.

### Duration

~3–4 weeks.

### Concepts

| Concept | Description |
|---------|-------------|
| **Workspace organization** | Optional wrapper: one billing owner, many members |
| **Mailbox member** | Rukny user granted access to a mailbox |
| **Roles** | `OWNER`, `ADMIN`, `AGENT` (reply), `VIEWER` (read-only) |
| **Shared mailbox** | Multiple members see same Inbox for `support@domain.com` |
| **Assignment** | Agent claims a thread |
| **Internal notes** | Comment visible to team, not sent to customer |
| **Collision warning** | Two agents replying simultaneously |

### New models (draft)

```prisma
WorkspaceMember      // orgId, userId, role
WorkspaceMailboxMember  // mailboxId, userId, role
WorkspaceEmailNote   // emailId, authorId, body (internal)
```

### API (examples)

```
POST   /workspace/members/invite
GET    /workspace/mailboxes/:id/members
POST   /workspace/mail/:threadId/assign
POST   /workspace/mail/:threadId/notes
```

### Plan gating

| Feature | Pro | Whale | Business |
|---------|-----|-------|----------|
| Owner only | ✅ | ✅ | ✅ |
| Shared mailbox | ❌ | ✅ | ✅ |
| Max team members | 1 | 5 | Unlimited |

### Success criteria

- [ ] Owner invites colleague; colleague sees shared Inbox after accept
- [ ] Viewer cannot send
- [ ] Internal note never appears in outbound MIME

---

## Phase 7 — Rukny cross-product integration

### Goal

Workspace is not isolated — it powers email across **Stores**, **Forms**, and **Events**.

### Duration

~3–4 weeks.

### Integrations

| Product | Integration |
|---------|-------------|
| **Stores** | Order confirmations from `orders@store-domain.com`; inbound order questions in Inbox |
| **Forms** | Form submission copies to mailbox; auto-reply from tenant domain |
| **Events** | Ticket/invitation emails from `events@domain.com` |
| **Notifications** | In-app + WebSocket bell when new mail arrives |
| **Accounts** | Workspace usage on billing page; plan enforcement unified |

### Technical approach

- Store/Form/Event modules call `WorkspaceSendService` instead of generic `EmailService` when tenant has active domain + mailbox.
- Fallback to `notifications@rukny.io` if Workspace not configured.

### Success criteria

- [ ] Merchant with Workspace sends order email from own domain
- [ ] Form reply appears in tenant Inbox
- [ ] Single SSO session across forms.rukny.io and workspace.rukny.io

---

## Phase 8 — Automation & productivity

### Goal

Reduce manual work for high-volume support and sales inboxes.

### Duration

~4 weeks.

### Features

| Feature | Description |
|---------|-------------|
| **Labels** | Color tags on threads |
| **Filters / rules** | IF sender/subject → label, assign, forward |
| **Templates** | Canned replies |
| **Auto-responder** | Out-of-office by schedule |
| **Forward / Reply all** | Standard mail client behavior |
| **Archive** | Beyond trash |
| **Search** | PostgreSQL FTS → optional OpenSearch upgrade |
| **Contacts** | Simple CRM from frequent correspondents |

### Success criteria

- [ ] Rule auto-labels `billing@` messages within 1 minute of receipt
- [ ] Template inserts into compose with variables `{customer_name}`

---

## Phase 9 — Growth & monetization extras

### Goal

Acquire more tenants and increase ARPU.

### Duration

4+ weeks (parallel work possible).

### Features

| Feature | Description |
|---------|-------------|
| **Freemium address** | `username@mail.rukny.io` — 500 sends/mo, convert to custom domain |
| **Domain purchase** | Reseller API (Namecheap / Route 53) — buy inside Workspace |
| **Add-ons** | Extra mailbox, +5 GB storage, +10k sends |
| **Email marketing** | Campaigns to opted-in lists (Business plan) |
| **Unsubscribe** | List-Unsubscribe header, suppression lists |
| **Referral** | Credit for inviting businesses |

### Compliance

- CAN-SPAM, GDPR-style consent for marketing
- Marketing only on Business+ with explicit opt-in tools

---

## Phase 10 — Enterprise scale

### Goal

Large tenants, high volume, advanced ops — without breaking shared tenant isolation.

### Duration

Ongoing.

### Features

| Feature | When |
|---------|------|
| **Dedicated IP** | >50k sends/day or deliverability issues |
| **IP warming automation** | New dedicated IPs |
| **Virtual Deliverability Manager (VDM)** | AWS SES addon |
| **QuickSight / analytics** | Response time, agent performance |
| **Bedrock AI** | Summarize threads, suggest replies, classify |
| **SLA 99.9%** | Business contract |
| **Audit log export** | Compliance |
| **IMAP/SMTP bridge** | Optional — Outlook/Apple Mail (major effort) |
| **Website hosting (CloudFront)** | Domain also hosts store landing page |

---

## Dependency graph

```
Phase 0 (SES Production)
    ↓
Phase 1 (AWS plumbing)
    ↓
Phase 2 (DB + domains/mailboxes API)
    ↓
    ├── Phase 3 (Send) ───┐
    └── Phase 4 (Receive) ┘
              ↓
         Phase 5 (Frontend MVP)  ←── LAUNCH
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
Phase 6   Phase 7   Phase 8
(Team)    (Integrations) (Automation)
    └─────────┼─────────┘
              ↓
         Phase 9 (Growth)
              ↓
         Phase 10 (Enterprise)
```

---

## Current status snapshot

| Phase | Status | Notes |
|-------|--------|-------|
| 0 | ⏳ Not started | Submit SES production request |
| 1 | ⏳ | — |
| 2 | ⏳ | Schema documented only |
| 3 | ⏳ | — |
| 4 | ⏳ | — |
| 5 | 🟡 Partial | Dashboard shell + placeholder pages |
| 6–10 | ⏳ | Planned |

---

## Document maintenance

When a phase completes:

1. Update the status table above.
2. Check off items in [WORKSPACE_MVP_SCOPE.md](./WORKSPACE_MVP_SCOPE.md) §4 (Phases 0–5).
3. Update [WORKSPACE_SES_SETUP.md](./WORKSPACE_SES_SETUP.md) §10 for Phase 0.
4. Add `WORKSPACE_AUDIT_AND_PLAN.md` (Forms-style audit) after Phase 5 launch.

---

*This document is the authoritative phase breakdown. Pricing limits: [WORKSPACE_PRICING.md](./WORKSPACE_PRICING.md). Technical AWS detail: [aws_workspace_strategy.md](./aws_workspace_strategy.md).*
