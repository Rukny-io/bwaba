# Mail application boundaries

`apps/mail` is the Next.js presentation application and a small server-side BFF. `apps/api` is the owner of identity, workspaces, mail domains, mailboxes, billing, quotas, and provider state.

## Responsibilities

- `apps/mail/app` renders pages and coordinates user interactions.
- `apps/mail/app/api` forwards authenticated requests and owns only browser concerns such as same-origin checks, cookie handling, and response shaping.
- `apps/mail/lib` contains typed API clients, route helpers, and UI session helpers. It must not become a second domain layer.
- `apps/api/src/domain/mail` owns mail use cases, authorization, persistence, quotas, and state transitions.
- `apps/api/src/integrations` owns SES, DNS, storage, and payment adapters. Provider credentials never belong in browser code.

Domain setup, DNS verification, mailbox creation, subscription changes, and quota decisions must be initiated through API application services. Next route handlers may proxy these operations but must not become the source of truth.

## Request path

```text
Browser → Mail page/client → Next BFF route → API endpoint → application service → repository/provider adapter
```

The BFF forwards the session cookie and correlation/security headers, applies same-origin checks to state-changing requests, and uses bounded timeouts. It does not accept a client-supplied user or workspace identity as authorization.

## Frontend boundaries

Organize UI by feature (`auth`, `domains`, `mailboxes`, `billing`, `security`, `developers`) and keep shared components in `components/`. Feature code calls the typed API client; it does not fetch provider APIs or read server secrets.

## Security baseline

- Use HttpOnly, Secure, SameSite cookies for sessions.
- Require CSRF tokens and same-origin requests for mutations.
- Validate app/domain ownership in the API on every operation; middleware routing is not authorization.
- Do not log cookies, access tokens, email bodies, DNS credentials, or SES responses containing sensitive identifiers.
- Add timeouts and no-store caching to server-to-API calls.
