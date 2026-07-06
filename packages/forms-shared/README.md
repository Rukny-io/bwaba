# @rukny/forms-shared

Shared utilities for **apps/forms** and **apps/public**:

- `conditional-logic-eval` — field visibility / rule evaluation
- `public-form-utils` — respondent form helpers
- `security-headers` — CSP + security header builders
- `apply-security-headers` — middleware helper (nonce per request in production)

Tests run via `apps/forms`: `npm run test` (includes `packages/forms-shared/**/*.test.ts`).
