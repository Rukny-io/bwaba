# @rukny/email

Official Node.js client for the [Rukny Email API](https://developers.rukny.io/documentation/email-api).

**Server-side only** — never use this package in a browser or expose your API key to clients.

## Install

```bash
npm install @rukny/email
```

## Quickstart

```ts
import { RuknyEmail } from '@rukny/email';

const email = new RuknyEmail({
  apiKey: process.env.RUKNY_API_KEY!,
});

const result = await email.messages.send(
  {
    from: 'noreply@yourdomain.com',
    to: 'user@example.com',
    subject: 'Welcome',
    bodyText: 'Hello from Rukny!',
    bodyHtml: '<p>Hello from Rukny!</p>',
  },
  { idempotencyKey: 'welcome_user_001' },
);

console.log(result.id, result.status);
```

## Methods

| Method | Description |
|--------|-------------|
| `messages.send(input, { idempotencyKey })` | Send one transactional email |
| `messages.getStatus(id)` | Read delivery status |

Verify domains and authorize senders in the [developer portal](https://developers.rukny.io) before sending.

## Docs

- Public documentation: https://developers.rukny.io/documentation/email-api
- Developer portal: https://developers.rukny.io
