# Rukny Checkout — Documentation Index

> **Product:** Unified guest checkout for Rukny stores and future paid products  
> **App:** `apps/checkout` · **Domain:** `checkout.rukny.io`  
> **Payment:** Al-Qaseh · **OTP:** WhatsApp Business (+ Email fallback)  
> **Last updated:** 2026-09-21 · **Status:** Planning

## Documents

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Product vision & full specification](./01-checkout-product-spec.md) | Complete product, UX, API, smart features, and delivery plan |
| 02 | [Technical implementation plan](./02-technical-implementation-plan.md) | Architecture, phases, DoD, and engineering tasks |
| 03 | [Security & fraud controls](./03-security-and-fraud.md) | Phone/address trust, OTP abuse, payment integrity |

## App status

- **Scaffold:** `apps/checkout` (Next.js, HeroUI UI wrappers, Thmanyah)
- **Local:** `npm run dev` → http://localhost:3010
- **Domain target:** `checkout.rukny.io`

## Quick links (existing code)

| Area | Location |
|------|----------|
| Checkout app | `apps/checkout` |
| Checkout OTP | `apps/api/src/domain/stores/checkout-auth.*` |
| Addresses | `apps/api/src/domain/stores/checkout-addresses.controller.ts` |
| Orders | `apps/api/src/domain/stores/checkout-orders.controller.ts` |
| Al-Qaseh | `apps/api/src/integrations/qaseh-payment/` |
