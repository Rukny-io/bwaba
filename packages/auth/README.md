# @rukny/auth

Shared authentication utilities for **all Rukny frontends** (developers, forms, hq, accounts, …).

## What lives here

| Export | Purpose |
|--------|---------|
| `@rukny/auth` | Config (cookies, token expiry), hooks (`useAuth`), middleware helpers |
| `@rukny/auth/server` | SSR helpers — persist refreshed auth cookies to the browser |
| `@rukny/auth/client/session-keepalive` | Proactive token refresh before 30-minute access expiry |

## Usage in an app

```json
"@rukny/auth": "file:../../packages/auth"
```

```ts
import { mergeAuthSetCookies, persistAuthSetCookies } from '@rukny/auth/server';
import { SessionKeepAlive } from '@rukny/auth/client/session-keepalive';
import { refreshOnce } from '@/lib/api-client';

<SessionKeepAlive pathPrefix="/app" refresh={refreshOnce} />
```

## Related packages

- `packages/forms-shared` — forms-specific shared code (CSP, conditional logic, pricing)
- `packages/types` — shared TypeScript types

Each app under `apps/*` may also have its own `packages/` folder for **local UI components** (HeroUI copies) — that is separate from this monorepo root `packages/`.
