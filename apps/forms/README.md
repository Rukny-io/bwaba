# Forms app (creator dashboard)

Next.js dashboard for building and managing Rukny forms — port **3007**.

## Local stack (docker-compose.rukny-dev.yml)

| Service | Port |
|---------|------|
| API | 3001 |
| Public forms (`/f/{slug}`) | 3006 |
| Forms dashboard | 3007 |

## Tests

```bash
# Unit tests (forms + packages/forms-shared)
npm run test

# E2E — once: install Chromium
npm run test:e2e:install

# E2E — requires API + public + forms running
npm run test:e2e
```

E2E seeds **local Postgres** (`127.0.0.1:5433`) when `DB_PASSWORD` is in `.env.dev` — same DB as the Docker API. For native API on Neon: `E2E_USE_NEON=true npm run test:e2e`.

## Plan tiers (analytics)

| Tier | Plans |
|------|-------|
| Basic | FREE, PRO |
| Advanced (funnel, NPS, maps) | WHALE+ |
| Full (CSV export) | BUSINESS |

## CI

Workflow `.github/workflows/forms-e2e.yml` runs unit tests on every PR. Full Playwright E2E on PR requires repository secrets:

- `E2E_DATABASE_URL` — Postgres URL reachable from GitHub Actions
- `E2E_JWT_SECRET` — must match running API

Optional vars: `E2E_FORMS_URL`, `E2E_PUBLIC_APP_URL`.
