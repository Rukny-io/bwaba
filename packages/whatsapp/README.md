# @rukny/whatsapp

Official **server-side** Node.js client for the [Rukny WhatsApp API](https://api.rukny.io/api/v1).

📘 **Full integration guide:** [RuknyWhatsApp.md](./RuknyWhatsApp.md) (included in the npm package after install)

| Link | URL |
|------|-----|
| npm | https://www.npmjs.com/package/@rukny/whatsapp |
| Developer portal | https://developers.rukny.io |
| REST API | https://api.rukny.io/api/v1 |

## Install

```bash
npm install @rukny/whatsapp
```

## Usage

```ts
import {
  RuknyWhatsApp,
  verifyWebhookSignature,
  assertWebhookDeliveryNotReplayed,
} from '@rukny/whatsapp';

const wa = new RuknyWhatsApp({
  apiKey: process.env.RUKNY_API_KEY!,
});

await wa.messages.sendText({
  to: '+9647xxxxxxxxx',
  body: 'Hello!',
});

await wa.messages.sendOtp({
  to: '+9647xxxxxxxxx',
  code: '483920',
  template: 'your_approved_otp_template',
  language: 'ar',
});

// Idempotent send (matches API Idempotency-Key header)
await wa.messages.sendText(
  { to: '+9647xxxxxxxxx', body: 'Hello again' },
  { idempotencyKey: 'order-123-msg-1' },
);

const templates = await wa.templates.list();
```

## Webhook verification

```ts
const seen = new Set<string>();
if (!assertWebhookDeliveryNotReplayed(req.headers['x-rukny-delivery'], seen)) {
  return res.status(409).end();
}

const valid = verifyWebhookSignature({
  rawBody: req.rawBody,
  signatureHeader: req.headers['x-rukny-signature'],
  secret: process.env.RUKNY_WEBHOOK_SECRET!,
  timestampHeader: req.headers['x-rukny-timestamp'],
});
```

## Security

- **Do not** instantiate `RuknyWhatsApp` in the browser.
- Create and approve message templates in the developer portal before sending.
- Use `rk_test_` keys in development; restrict live keys with scopes and IP allowlists.

## Environment defaults for OTP

- `RUKNY_OTP_TEMPLATE` — default template name for `sendOtp()`
- `RUKNY_OTP_LANGUAGE` — default language code (e.g. `ar`)

## OpenAPI

See `openapi/public-v1.yaml` for the public REST surface.

## Development

```bash
npm run build
npm test
```
