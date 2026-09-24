# Rukny Email API — Node SDK

Package: `@rukny/email`

## Prerequisites

1. A [Rukny developer account](https://developers.rukny.io)
2. Email API installed on your app
3. A verified domain and authorized sender (Domains UI in the portal)
4. An API key with `email:send` (add `email:read` to check status)

## Authentication

Pass your key as `apiKey`. The client sends `X-API-Key` on every request.

- Live keys: `rk_live_…`
- Test keys: `rk_test_…` (can only send to your account email)

## Send

Every live send requires an `Idempotency-Key` (8–128 chars: alphanumeric, hyphen, underscore).

```ts
import { RuknyEmail } from '@rukny/email';

const email = new RuknyEmail({ apiKey: process.env.RUKNY_API_KEY! });

await email.messages.send(
  {
    from: 'noreply@yourdomain.com',
    fromName: 'Your App',
    to: 'user@example.com',
    subject: 'Welcome',
    bodyText: 'Hello!',
    bodyHtml: '<p>Hello!</p>',
  },
  { idempotencyKey: 'welcome_user_001' },
);
```

## Status

```ts
const status = await email.messages.getStatus('em_…');
```

## Errors

Failed HTTP calls throw `RuknyEmailError` with `status` and `body`.

## SMTP (alternative to REST)

Use any SMTP client with the same API key and `email:send` scope:

| Setting | Value |
|---------|-------|
| Host | `smtp.rukny.io` |
| Port | `587` (STARTTLS) or `465` (SMTPS) |
| Username | `rukny` |
| Password | Your API key (`rk_live_…`) |

Idempotency uses the email `Message-ID` header when present. One recipient per message.

## Links

- Documentation: https://developers.rukny.io/documentation/email-api
- Sending examples: https://developers.rukny.io/documentation/email-api/send
- Portal: https://developers.rukny.io
