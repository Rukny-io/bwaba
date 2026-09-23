# Rukny Checkout — Technical Implementation Plan

> Companion to [01-checkout-product-spec.md](./01-checkout-product-spec.md)  
> **App:** `apps/checkout` · **API:** existing Nest checkout + Qaseh modules  
> **Date:** 2026-09-21

---

## 1. Architecture

```text
┌──────────────────┐     ┌──────────────────────────────┐
│  Storefronts     │────▶│  apps/checkout (Next.js)     │
│  (deep link)     │     │  phone → address → review    │
└──────────────────┘     └──────────────┬───────────────┘
                                        │ Bearer / cookie
                                        ▼
                         ┌──────────────────────────────┐
                         │  apps/api                    │
                         │  /auth/checkout/*            │
                         │  /checkout/addresses         │
                         │  /checkout/orders            │
                         │  /payments/qaseh/*           │
                         └──────────────┬───────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              PostgreSQL             Redis              Al-Qaseh
              (orders,               (OTP rate          (hosted pay)
               addresses)             limits)
```

### Frontend stack (align with monorepo)
- Next.js App Router (same generation as `mail` / `accounts`)  
- Shared UI packages where practical (`@heroui/*` if used by sibling apps)  
- RTL Arabic default  
- No card PAN fields — redirect only  

### Backend (reuse first)
| Module | Status |
|--------|--------|
| `CheckoutAuthService` | Exists |
| `CheckoutAddressesController` | Exists |
| `CheckoutOrdersController` | Exists |
| `QasehPaymentModule` | Exists |
| Callback → `FRONTEND_URL` | Update to `checkout.rukny.io` |

---

## 2. Environment

### Checkout app
```bash
NEXT_PUBLIC_API_URL=https://api.rukny.io/api/v1
NEXT_PUBLIC_CHECKOUT_ORIGIN=https://checkout.rukny.io
```

### API (production)
```bash
FRONTEND_URL=https://checkout.rukny.io
QASEH_API_URL=https://api.alqaseh.com/v1
QASEH_CLIENT_ID=...
QASEH_CLIENT_SECRET=...
QASEH_REDIRECT_URL=https://api.rukny.io/api/v1/payments/qaseh/callback
QASEH_WEBHOOK_URL=https://api.rukny.io/api/v1/payments/qaseh/webhook
QASEH_WEBHOOK_SECRET=...
```

### DNS / deploy
- `checkout.rukny.io` → checkout app  
- CORS allow `https://checkout.rukny.io`  
- Cookie domain strategy if using httpOnly cookies  

---

## 3. Phased engineering plan

Legend: **P** priority · **E** effort (S/M/L) · **DoD** definition of done

### Phase 0 — Payment rails ready (Ops + API)
| ID | Task | P | E | DoD |
|----|------|---|---|-----|
| T0-01 | Configure Al-Qaseh Live keys | P0 | S | Create payment succeeds |
| T0-02 | Register redirect + webhook URLs | P0 | S | Confirmed by provider |
| T0-03 | Set `QASEH_WEBHOOK_SECRET` | P0 | S | Invalid signature rejected |
| T0-04 | Point `FRONTEND_URL` to checkout domain (or temporary) | P0 | S | Callback lands correctly |
| T0-05 | Smoke test Live pay (small amount) | P0 | S | Order → PAID |

### Phase 1 — Scaffold app
| ID | Task | P | E | DoD |
|----|------|---|---|-----|
| T1-01 | Create `apps/checkout` in monorepo | P0 | M | Builds locally |
| T1-02 | Layout RTL + base theme tokens | P0 | M | Mobile shell OK |
| T1-03 | API client + auth header/cookie helper | P0 | M | Authenticated calls work |
| T1-04 | Routes stubs for all screens | P0 | S | Navigable empty flows |
| T1-05 | Docker + staging domain | P0 | M | Staging URL live |

### Phase 2 — Phone verification UI
| ID | Task | P | E | DoD |
|----|------|---|---|-----|
| T2-01 | Phone input + IQ default `+964` | P0 | M | E.164 sent to API |
| T2-02 | Request OTP screen | P0 | M | WhatsApp/email path works |
| T2-03 | Verify OTP screen + attempts UX | P0 | M | Session `verified:true` |
| T2-04 | Resend cooldown UI | P0 | S | Matches API limits |
| T2-05 | Session resume / expiry handling | P0 | M | Expired → back to phone |
| T2-06 | Gate: block address/pay if unverified | P0 | S | Guard in client + server |

### Phase 3 — Address UI
| ID | Task | P | E | DoD |
|----|------|---|---|-----|
| T3-01 | List addresses for phone | P0 | M | Select default |
| T3-02 | Create address form | P0 | L | Required validation |
| T3-03 | Governorate / city cascading data | P0 | M | Iraq list shipped |
| T3-04 | Edit / delete address | P0 | M | CRUD complete |
| T3-05 | Landmark nudge + duplicate warn | P1 | M | Soft warnings only |
| T3-06 | Optional map pin | P1 | L | Lat/lng saved |
| T3-07 | Receiver ≠ buyer toggle | P1 | S | Separate receiver phone |

### Phase 4 — Review + order + pay
| ID | Task | P | E | DoD |
|----|------|---|---|-----|
| T4-01 | Review cart / line items | P0 | M | Matches store cart |
| T4-02 | Coupon apply | P1 | M | Errors surfaced |
| T4-03 | Revalidate stock/price | P0 | M | Soft fail before pay |
| T4-04 | Create order `QASEH_CARD` | P0 | M | Returns `paymentUrl` |
| T4-05 | Redirect interstitial | P0 | S | Opens Al-Qaseh |
| T4-06 | Success / failed / pending pages | P0 | M | Status from API |
| T4-07 | Retry failed payment | P1 | M | Uses initiate/retry |
| T4-08 | Update callback redirects to checkout routes | P0 | S | Query params preserved |

### Phase 5 — Smart features batch
| ID | Task | Maps to | P | E |
|----|------|---------|---|---|
| T5-01 | Verified badge + address summary strip | SF-01 | P0 | S |
| T5-02 | Express path for returning session | SF-02/23 | P1 | M |
| T5-03 | Pending poller (3–5 tries) | SF-04 | P0 | S |
| T5-04 | Abandoned checkout WhatsApp (opt-in) | SF-22 | P2 | L |
| T5-05 | Delivery ETA by governorate | SF-21 | P1 | M |
| T5-06 | Risk velocity cool-down | SF-31 | P1 | M |

### Phase 6 — Hardening & launch
| ID | Task | P | E | DoD |
|----|------|---|---|-----|
| T6-01 | Security review (OTP, IDOR, webhook) | P0 | M | Checklist pass |
| T6-02 | Observability: pay create/fail/webhook metrics | P0 | M | Dashboard |
| T6-03 | UAT script (phone → pay → PAID) | P0 | M | Signed off |
| T6-04 | Prod deploy + DNS | P0 | M | Public |
| T6-05 | Support FAQ + runbook | P0 | S | Published |
| T6-06 | Post-launch 48h watch | P0 | S | No Sev-1 |

### Phase 7 — Platform expansion
| ID | Task | P | E |
|----|------|---|---|
| T7-01 | Abstract PaymentIntent for non-store products | P1 | L |
| T7-02 | Mail billing via checkout | P1 | L |
| T7-03 | Developer wallet top-up | P2 | M |
| T7-04 | Link guest phone → Rukny account | P2 | L |

---

## 4. Suggested folder structure

```text
apps/checkout/
  app/
    layout.tsx
    page.tsx                 # entry / resume
    phone/page.tsx
    phone/verify/page.tsx
    address/page.tsx
    address/new/page.tsx
    review/page.tsx
    redirecting/page.tsx
    success/page.tsx
    failed/page.tsx
    pending/page.tsx
    orders/track/page.tsx
  components/
    phone-form.tsx
    otp-form.tsx
    address-card.tsx
    address-form.tsx
    order-summary.tsx
    verified-badge.tsx
    pay-cta.tsx
  lib/
    api.ts
    session.ts
    phone.ts
    iraq-regions.ts
    payment-status.ts
  data/
    iraq-governorates.json
```

---

## 5. API client contracts (frontend)

### Request OTP
```ts
POST /auth/checkout/otp/request
{ phoneNumber: string; email?: string; preferEmail?: boolean }
→ { otpId: string; sentVia: 'WHATSAPP' | 'EMAIL'; expiresIn: number }
```

### Verify OTP
```ts
POST /auth/checkout/otp/verify
{ phoneNumber: string; code: string; otpId: string }
→ { accessToken: string; verified: true; userId: string }
```

### Create order
```ts
POST /checkout/orders
Authorization: Bearer <checkoutToken>
{
  shippingAddressId: string;
  paymentMethod: 'QASEH_CARD' | 'CASH' | 'BANK_TRANSFER';
  items: { productId: string; quantity: number; variantId?: string }[];
  notes?: string;
  couponCode?: string;
}
→ { orders; payment?: { paymentUrl; paymentId; token } }
```

### Payment status
```ts
GET /payments/qaseh/status/:orderId
→ { paymentStatus; qasehStatus?; amount; currency }
```

---

## 6. Callback URL mapping

After API processes Qaseh redirect, send users to:

| Result | Destination |
|--------|-------------|
| Success | `https://checkout.rukny.io/success?orders=...&store=...&paid=1` |
| Failed | `https://checkout.rukny.io/failed?order=...&status=...` |
| Error | `https://checkout.rukny.io/failed?error=...` |
| Pending | `https://checkout.rukny.io/pending?order=...` |

Update `qaseh-payment.controller.ts` callback redirects accordingly (`FRONTEND_URL`).

---

## 7. Testing matrix

| Case | Expected |
|------|----------|
| OTP WhatsApp happy path | Verified session |
| OTP wrong code ×5 | Locked / new OTP required |
| OTP rate limit | 429 / clear message |
| Address missing landmark | Warning, allow continue |
| Pay success + webhook | Order PAID + CONFIRMED |
| Pay success, webhook slow | Pending → success after poll |
| Pay declined | Failed + retry |
| Unverified initiate pay | 403 |
| Order IDOR other session | 403 |
| Invalid webhook signature | 403 |

---

## 8. Observability

Log/metric events (no PII/PAN):
- `checkout.otp.requested` / `.verified` / `.failed`  
- `checkout.address.created`  
- `checkout.order.created`  
- `checkout.payment.initiated`  
- `checkout.payment.webhook` (status)  
- `checkout.payment.callback`  

Alerts:
- Webhook error rate > 5% / 5m  
- Payment initiate failures spike  
- OTP global daily cap approaching  

---

## 9. Timeline estimate

| Phase | Calendar |
|-------|----------|
| 0 | 1–2 days |
| 1 | 2–3 days |
| 2 | 2–3 days |
| 3 | 3–5 days |
| 4 | 3–5 days |
| 5 | 3–5 days |
| 6 | 2–3 days |
| **v1 launch** | **~3–4 weeks** |
| 7 | ongoing |

---

## 10. Immediate next actions

1. Confirm Al-Qaseh URLs + Live keys (ops)  
2. Approve this plan  
3. Scaffold `apps/checkout`  
4. Wire phone → address → review against existing API  
5. Point Qaseh callback frontend to checkout success/failed  
