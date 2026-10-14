# Rukny API architecture

This API remains a modular monolith while the product and data boundaries are being made explicit. A modular monolith keeps checkout, invoices, subscriptions, stores, forms, and developer APIs in one deployable unit, while preventing accidental coupling through module contracts.

## Target domains

- **Identity**: `domain/auth`, `domain/users`, `domain/profiles`, and `domain/rukny-otp`. Owns authentication, sessions, roles, and user identity.
- **Workspace**: `domain/workspace`. Owns tenants, memberships, invitations, and workspace access policy.
- **Commerce**: `domain/stores` and `domain/checkout`. Owns products, orders, order items, inventory, fulfillment, invoices, and checkout orchestration.
- **Billing**: `domain/subscriptions`. Owns plans, subscriptions, renewals, entitlements, and billing state transitions.
- **Payments**: payment use cases belong to the commerce/billing domains; provider code under `integrations/` is an adapter and never owns order or subscription state.
- **Forms**: `domain/forms` and its submission/event consumers. Owns form definitions, submission validation, and delivery policies.
- **Developer platform**: `domain/developer`, `domain/email-api`, and provider-facing APIs. Owns API keys, scopes, quotas, and public contract versioning.
- **Communications**: `domain/mail`, `domain/notifications`, and provider adapters. Owns templates, delivery records, and retry policy.
- **Operations**: `domain/admin`, analytics, support, and read models. These modules may query published application views, but do not become owners of commerce or identity tables.
- **Platform**: `core/`, `shared/`, `infrastructure/`, and `integrations/` provide technical capabilities only: configuration, persistence, queues, security, observability, storage, and external adapters.

## Module shape

Each domain is migrated toward this internal shape:

```text
<domain>/
  <domain>.module.ts
  interfaces/       # HTTP/controllers, DTOs, serializers
  application/      # use cases and transaction orchestration
  domain/           # invariants, value objects, domain events
  infrastructure/   # Prisma repositories and provider implementations
```

Controllers validate input and call application use cases. They do not access Prisma directly. Application services own transactions and authorization decisions. Domain code contains invariants and cannot import Nest, Prisma, or an external provider. Integration adapters translate provider protocols into domain results.

## Dependency rules

1. `domain/*` may depend on `core/*` contracts and `shared/*` technical services, but one domain must not import another domain's Prisma models or infrastructure classes.
2. Cross-domain work goes through an application port or a durable event (`core/events` / queue). Consumers must be idempotent.
3. `integrations/*` may be imported by an owning domain through an interface token. Provider credentials and response formats never leak into controllers or database models.
4. `admin`, analytics, and support use read models or application queries. They do not mutate another domain's tables directly.
5. Authentication, tenant authorization, rate limits, audit logging, and request correlation are platform policies applied at the edge and repeated in sensitive use cases.

## Security baseline

- Validate and reject unknown request fields globally; use explicit DTOs for every public endpoint.
- Treat tenant/workspace and resource ownership checks as mandatory application-level invariants.
- Require idempotency for payment creation, order finalization, subscription changes, and webhook processing.
- Persist audit events for authentication, privilege changes, payment state changes, refunds, and API-key operations.
- Verify webhook signatures against the raw body, then re-fetch authoritative provider state before changing local state.
- Keep secrets in configuration/secret storage; never expose provider tokens or raw payment credentials in logs or API responses.
- Apply bounded request bodies, provider timeouts, queue retries with backoff, and correlation IDs.

## Migration sequence

1. Establish contracts and shared security primitives while keeping the current module paths stable.
2. Extract application use cases from the largest controllers (`stores`, `checkout`, `subscriptions`, `developer`).
3. Move Prisma access behind repositories and publish cross-domain events for payment, order, subscription, and mail transitions.
4. Add contract tests for public API versions and integration tests for authorization, idempotency, and webhook replay.
5. Only split deployables after domain ownership, event delivery, and operational boundaries are proven in the monolith.
