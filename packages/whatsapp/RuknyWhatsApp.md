# RuknyWhatsApp — Integration Guide

Official step-by-step guide for the [`@rukny/whatsapp`](https://www.npmjs.com/package/@rukny/whatsapp) Node.js SDK.

| Resource | Link |
|----------|------|
| **npm package** | https://www.npmjs.com/package/@rukny/whatsapp |
| **Developer portal** | https://developers.rukny.io |
| **REST API base URL** | https://api.rukny.io/api/v1 |
| **OpenAPI spec (in package)** | `node_modules/@rukny/whatsapp/openapi/public-v1.yaml` |
| **Rukny website** | https://rukny.io |

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Install the SDK](#2-install-the-sdk)
3. [Create an app and API key](#3-create-an-app-and-api-key)
4. [Connect WhatsApp Business](#4-connect-whatsapp-business)
5. [Create and approve templates](#5-create-and-approve-templates)
6. [Send your first message](#6-send-your-first-message)
7. [Send OTP (authentication templates)](#7-send-otp-authentication-templates)
8. [List templates from code](#8-list-templates-from-code)
9. [Idempotent sends](#9-idempotent-sends)
10. [Receive webhooks](#10-receive-webhooks)
11. [Environment variables](#11-environment-variables)
12. [Security checklist](#12-security-checklist)
13. [API reference (SDK)](#13-api-reference-sdk)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

- **Node.js 18+** on your server (not in the browser)
- A [Rukny developer account](https://developers.rukny.io)
- A **developer app** with the WhatsApp product enabled
- Wallet balance for outbound messages (billing is usage-based)

---

## 2. Install the SDK

In your backend project:

```bash
npm install @rukny/whatsapp
```

After install, you will find:

- Compiled SDK: `node_modules/@rukny/whatsapp/dist/`
- This guide: `node_modules/@rukny/whatsapp/RuknyWhatsApp.md`
- OpenAPI: `node_modules/@rukny/whatsapp/openapi/public-v1.yaml`

**Requirements:** server-side only. The constructor throws if used in a browser.

---

## 3. Create an app and API key

1. Open the [developer portal](https://developers.rukny.io) and sign in.
2. Create or select an **app**.
3. Go to **API Keys** → **Create key**.
4. For development, choose **Test** (`rk_test_…`).
5. For production, choose **Live** (`rk_live_…`) and restrict:
   - **Scopes** — e.g. `whatsapp:send`, `whatsapp:read`, `templates:read`
   - **IP allowlist** (recommended for live keys)
   - **Expiration** (optional)

Store the full key once — it is shown only at creation time.

```env
RUKNY_API_KEY=rk_test_your_key_here
```

Portal path (replace `{appId}` with your 16-digit public app id):

- API keys: `https://developers.rukny.io/apps/{appId}/api-keys`
- WhatsApp API docs: `https://developers.rukny.io/apps/{appId}/whatsapp-api`

---

## 4. Connect WhatsApp Business

Before sending messages, link a WhatsApp Business Account (WABA) to your app:

1. In the portal: **WhatsApp Business** → connect via Embedded Signup.
2. Add and register a **phone number**.
3. Ensure account status is **Active**.

Portal path:

- Overview: `https://developers.rukny.io/apps/{appId}/whatsapp`
- Phone numbers: `https://developers.rukny.io/apps/{appId}/whatsapp/phone-numbers`

---

## 5. Create and approve templates

Template messages (including OTP) **must** be created in the portal and **approved by Meta** before you can send them by name.

1. Go to **WhatsApp Business** → **Templates**.
2. Click **Create template** (or **Sync** from Meta).
3. For OTP, use category **AUTHENTICATION**.
4. Wait until status is **APPROVED** (not `PENDING` or `REJECTED`).
5. Note the exact **name** and **language** (e.g. `otp_verify`, `ar`).

Portal path:

- Templates: `https://developers.rukny.io/apps/{appId}/whatsapp/templates`

The API rejects sends if the template is missing or not approved for your app.

---

## 6. Send your first message

```ts
import { RuknyWhatsApp } from '@rukny/whatsapp';

const wa = new RuknyWhatsApp({
  apiKey: process.env.RUKNY_API_KEY!,
});

const result = await wa.messages.sendText({
  to: '+9647xxxxxxxxx', // E.164 format
  body: 'Hello from Rukny!',
});

console.log(result.id, result.status);
```

**What happens:**

1. SDK validates the phone number format.
2. Request goes to `POST https://api.rukny.io/api/v1/whatsapp/messages` with header `X-API-Key`.
3. Rukny checks quota, wallet, WABA, and permissions.
4. Message is sent via Meta; you get back `{ id, status, meta_message_id }`.

---

## 7. Send OTP (authentication templates)

Use a template you created with category **AUTHENTICATION**:

```ts
await wa.messages.sendOtp({
  to: '+9647xxxxxxxxx',
  code: '483920',
  template: 'otp_verify', // your approved template name
  language: 'ar',
});
```

Optional defaults via environment:

```env
RUKNY_OTP_TEMPLATE=otp_verify
RUKNY_OTP_LANGUAGE=ar
```

OTP sends are rate-limited per recipient and per account on the API side.

---

## 8. List templates from code

```ts
const templates = await wa.templates.list();

for (const t of templates) {
  console.log(t.name, t.language, t.status);
}
```

Or fetch one template:

```ts
const t = await wa.templates.get('order_confirmation');
```

Sync from Meta (portal or API):

```ts
await wa.templates.sync();
```

---

## 9. Idempotent sends

Prevent duplicate messages when your code retries after a network error:

```ts
await wa.messages.sendText(
  {
    to: '+9647xxxxxxxxx',
    body: 'Order #123 confirmed',
  },
  {
    idempotencyKey: 'order-123-confirmation',
  },
);
```

The same key within 24 hours returns the original result instead of sending again.

---

## 10. Receive webhooks

The SDK does **not** open a server for you. You register an HTTPS URL in the portal; Rukny delivers events to it.

### 10.1 Register a webhook

1. Portal → **WhatsApp Business** → **Webhooks**.
2. Add your **HTTPS** endpoint URL.
3. Select events (e.g. `message.delivered`, `message.received`).
4. Copy the **signing secret** (`whsec_…`) — shown once.

Portal path:

- Webhooks: `https://developers.rukny.io/apps/{appId}/whatsapp/webhooks`

### 10.2 Verify events in your handler

Example (Express-style):

```ts
import {
  verifyWebhookSignature,
  assertWebhookDeliveryNotReplayed,
} from '@rukny/whatsapp';

const seenDeliveries = new Set<string>();

app.post('/webhooks/rukny', express.raw({ type: 'application/json' }), (req, res) => {
  const deliveryId = req.headers['x-rukny-delivery'] as string | undefined;

  if (!assertWebhookDeliveryNotReplayed(deliveryId, seenDeliveries)) {
    return res.status(409).end();
  }

  const valid = verifyWebhookSignature({
    rawBody: req.body,
    signatureHeader: req.headers['x-rukny-signature'] as string,
    secret: process.env.RUKNY_WEBHOOK_SECRET!,
    timestampHeader: req.headers['x-rukny-timestamp'] as string,
  });

  if (!valid) {
    return res.status(401).end();
  }

  const event = JSON.parse(req.body.toString());
  // handle event.type, event.data …

  res.status(200).end();
});
```

**Headers from Rukny:**

| Header | Purpose |
|--------|---------|
| `X-Rukny-Signature` | `sha256=` HMAC of raw body |
| `X-Rukny-Event` | Event name, e.g. `message.delivered` |
| `X-Rukny-Delivery` | Unique delivery id — dedupe replays |
| `X-Rukny-Timestamp` | Unix seconds — reject if older than ~5 minutes |

---

## 11. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RUKNY_API_KEY` | Yes | `rk_test_…` or `rk_live_…` from the portal |
| `RUKNY_WEBHOOK_SECRET` | For webhooks | `whsec_…` from webhook setup |
| `RUKNY_OTP_TEMPLATE` | No | Default template name for `sendOtp()` |
| `RUKNY_OTP_LANGUAGE` | No | Default language code for `sendOtp()` |

Optional client config:

```ts
const wa = new RuknyWhatsApp({
  apiKey: process.env.RUKNY_API_KEY!,
  baseUrl: 'https://api.rukny.io/api/v1', // default
  timeoutMs: 30_000, // default
});
```

---

## 12. Security checklist

- Run `RuknyWhatsApp` **only on your server** — never in frontend code.
- Use **`rk_test_`** keys in development; **Try it** in the portal accepts test keys only.
- Restrict **live** keys with scopes and IP allowlists.
- Create templates in the portal; only send **approved** template names.
- Always **verify webhook signatures** and timestamps.
- Use **idempotency keys** for critical sends.
- Rotate API keys and webhook secrets if compromised.

Docs in portal:

- Auth & scopes: `https://developers.rukny.io/apps/{appId}/whatsapp-api/auth`
- Webhooks: `https://developers.rukny.io/apps/{appId}/whatsapp-api/webhooks`
- SDKs: `https://developers.rukny.io/apps/{appId}/whatsapp-api/sdks`

---

## 13. API reference (SDK)

### `RuknyWhatsApp`

| Property / method | Description |
|-------------------|-------------|
| `messages` | Send and track messages |
| `templates` | List, get, sync templates |

### `messages`

| Method | Description |
|--------|-------------|
| `sendText(input, options?)` | Plain text message |
| `sendTemplate(input, options?)` | Approved template with variables |
| `sendOtp(input, options?)` | OTP via AUTHENTICATION template |
| `send(payload, options?)` | Raw API payload |
| `getStatus(messageId)` | Delivery/read status |

### `templates`

| Method | Description |
|--------|-------------|
| `list()` | All templates for the app |
| `get(name)` | Single template by name |
| `sync(accountId?)` | Sync from Meta |

### Webhook helpers

| Export | Description |
|--------|-------------|
| `verifyWebhookSignature(input)` | Validate HMAC + optional timestamp |
| `assertWebhookDeliveryNotReplayed(id, seen)` | Dedupe by delivery id |

### Errors

Failed API calls throw `RuknyWhatsAppError` with:

- `message` — human-readable text
- `status` — HTTP status code
- `body` — parsed API error body

---

## 14. Troubleshooting

| Issue | What to check |
|-------|----------------|
| `Invalid or expired API key` | Key revoked, wrong environment, or expired |
| `Template not found or not approved` | Create/sync template in portal; wait for `APPROVED` |
| `No active WhatsApp Business Account` | Complete WABA connection for this app |
| `Rate limit exceeded` | Slow down; upgrade plan for higher limits |
| `OTP rate limit exceeded` | Too many OTPs to same number; wait and retry |
| `RuknyWhatsApp must run server-side` | Move code off the browser |
| Webhook `401` | Wrong secret, altered body, or stale timestamp |
| Webhook `409` | Duplicate `X-Rukny-Delivery` id |

For interactive testing without exposing live keys, use **Try it** in the portal (test keys only):

`https://developers.rukny.io/apps/{appId}/whatsapp-api/try`

---

## Quick links

- [Install on npm](https://www.npmjs.com/package/@rukny/whatsapp)
- [Developer portal](https://developers.rukny.io)
- [API base](https://api.rukny.io/api/v1)
- [Rukny](https://rukny.io)

---

*Package version: see `package.json` in this directory.*
