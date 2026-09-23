# Rukny Checkout — Product Vision & Full Specification

> **App name:** `checkout`  
> **Domain:** `checkout.rukny.io`  
> **Tagline:** Buy in minutes — verified phone, trusted address, secure card.  
> **Date:** 2026-09-21  
> **Status:** Draft for build

---

## 1. Executive summary

Rukny Checkout is a dedicated React (Next.js) app that owns the full guest purchase journey:

1. Cart / product entry from a store  
2. **Phone verification** (WhatsApp OTP, email fallback)  
3. **Shipping address** (create, reuse, validate)  
4. Order review + coupon  
5. **Card payment** via Al-Qaseh hosted page  
6. Success / failure / pending confirmation  

It replaces fragmented checkout UI scattered across storefronts with one fast, Arabic-first, mobile-first experience — while reusing the existing Rukny API (`auth/checkout`, `checkout/addresses`, `checkout/orders`, `payments/qaseh`).

---

## 2. Why a separate `checkout` app

| Reason | Detail |
|--------|--------|
| Focus | Checkout must be extremely fast; storefront marketing UI must not slow it down |
| Trust | Phone + address + payment need one coherent trust surface |
| Reuse | Same flow later for digital products, mail plans, wallets |
| Brand | `checkout.rukny.io` signals a serious payment product |
| Ops | Redirect/callback landing pages live in one place |

**Naming decision:** Use **`checkout`** (not `pay`) because the product is the full purchase funnel, not only the payment result page.

---

## 3. Goals & non-goals

### Goals
- Guest can complete a purchase without a full Rukny account  
- Phone is verified before payment can start  
- Address is captured, saved, and reusable by phone  
- Card payment via Al-Qaseh with webhook-confirmed status  
- Smart UX that reduces drop-off and fraud  
- Works on mobile (majority of Iraq traffic)

### Non-goals (v1)
- Full accounts SSO for every shopper (optional later: “continue with Rukny”)  
- PCI card fields on our domain (cards stay on Al-Qaseh hosted page)  
- Multi-currency beyond IQD in v1  
- Marketplace split payouts in v1  

---

## 4. Personas

| Persona | Need |
|---------|------|
| Guest shopper | Fast buy with phone + address + card |
| Returning guest | Remember addresses & last phone; skip re-typing |
| Store owner | Higher conversion, fewer fake orders, clear paid status |
| Support | Trace order by phone / order number / payment id |
| Platform ops | Rate limits, webhook health, fraud signals |

---

## 5. End-to-end user journey

```text
Store (rukny.io / storefront)
        │  "Buy" / "Checkout"
        ▼
┌─────────────────────────────────────┐
│  checkout.rukny.io                  │
│  1. Session / cart hydrate          │
│  2. Phone OTP verify                │
│  3. Address select / add            │
│  4. Review + coupon + method        │
│  5. Create order (API)              │
│  6. Redirect → Al-Qaseh pay page    │
└─────────────────────────────────────┘
        │
        ▼
 Al-Qaseh hosted payment
        │
        ├── Redirect → API callback → checkout success/failed
        └── Webhook  → API marks PAID / FAILED
```

### Step detail

#### Step A — Entry
- Query params: `store`, `cartToken` or `items`, optional `coupon`  
- If no verified session → start at **Phone**  
- If verified session still valid (< 2h) → jump to **Address** or **Review**

#### Step B — Phone verification
1. User enters Iraqi / international phone (E.164)  
2. Optional email (for fallback + receipts)  
3. `POST /auth/checkout/otp/request` → WhatsApp OTP  
4. User enters 6-digit code  
5. `POST /auth/checkout/otp/verify` → JWT checkout session (`verified: true`)  
6. Session stored securely (httpOnly cookie or memory + Authorization header)

**Rules**
- Unverified session cannot create paid orders or initiate Qaseh  
- Rate limits: per phone, per IP, global OTP cap (already in API)  
- Resend with cooldown  
- Email fallback if WhatsApp fails or user prefers email  

#### Step C — Address (عنوان السكن / التوصيل)
1. Load saved addresses: `GET /checkout/addresses?phoneNumber=...`  
2. User picks existing **or** adds new:
   - Full name  
   - Phone (prefilled, editable for receiver)  
   - Governorate / city / district  
   - Street / landmark / building / floor / apartment  
   - Optional map pin (lat/lng) — smart feature  
   - Delivery notes  
3. Validate required fields before continue  
4. Soft-validate: duplicate address detection, incomplete landmark warnings  

#### Step D — Review
- Line items, quantities, stock warnings  
- Shipping estimate (if available)  
- Coupon apply  
- Payment method: `QASEH_CARD` (primary), optionally `CASH` / `BANK_TRANSFER` if store allows  
- Identity strip: verified phone badge + selected address summary  

#### Step E — Pay
1. `POST /checkout/orders` with `paymentMethod: QASEH_CARD` + `shippingAddressId`  
2. API creates order + Qaseh payment → returns `paymentUrl`  
3. Browser redirects to `https://pay.alqaseh.com/pay/:token` (or test host)  
4. After pay:
   - Redirect URL (via API callback) → `checkout.rukny.io/success` or `/failed`  
   - Webhook updates authoritative status  
5. Success page polls status once if still `PENDING`

---

## 6. Screen map (apps/checkout)

| Route | Purpose |
|-------|---------|
| `/` | Smart entry / resume session |
| `/phone` | Enter phone + request OTP |
| `/phone/verify` | Enter OTP code |
| `/address` | List / add / edit address |
| `/address/new` | New address form |
| `/review` | Cart review + coupon + pay CTA |
| `/redirecting` | “Opening secure payment…” interstitial |
| `/success` | Paid confirmation + order number |
| `/failed` | Failure + retry |
| `/pending` | Waiting for webhook confirmation |
| `/orders/track` | Track by phone + OTP (existing API) |

---

## 7. Phone verification — product rules

### Must-have
- E.164 normalization (Iraq `+964` default helper)  
- WhatsApp-first OTP  
- Email fallback  
- Clear “verified” badge after success  
- Session expiry messaging  
- Block payment until `verified === true`

### UX copy (AR examples)
- أدخل رقم هاتفك لإرسال رمز التحقق عبر واتساب  
- لم يصلك الرمز؟ أعد الإرسال بعد 30 ثانية  
- تم التحقق — يمكنك الآن إكمال الطلب  

### Abuse controls (platform)
- Max OTP requests per phone / IP / day  
- Max verify attempts per OTP  
- Fail closed when Redis rate-limit backend is down  
- Never log full OTP codes in production  

---

## 8. Address — product rules

### Required fields (v1)
| Field | Required |
|-------|----------|
| Recipient name | Yes |
| Phone | Yes (default = verified phone) |
| Governorate | Yes |
| City | Yes |
| Street / area | Yes |
| Landmark | Strongly recommended |
| Building / floor / apt | Optional |
| Notes | Optional |
| Lat / lng | Optional (smart) |

### Behaviors
- Addresses keyed by verified phone (guest identity)  
- Default address remembered  
- Edit / delete with confirmation  
- “Deliver to someone else” → different receiver phone without losing verified buyer phone  
- Iraq governorate dropdown (canonical list)  

### Validation intelligence
- Warn if landmark empty in dense cities (Baghdad, Basra, Erbil…)  
- Detect near-duplicate addresses (“نفس العنوان تقريباً”)  
- Suggest last used address as default  
- Optional: reverse-geocode map pin → fill city fields  

---

## 9. Payment — Al-Qaseh

| Item | Value |
|------|-------|
| Provider | Al-Qaseh |
| Method code | `QASEH_CARD` |
| Create | `POST /egw/payments/create` |
| Customer pay page | Hosted by Al-Qaseh |
| Redirect (ours) | `https://api.rukny.io/api/v1/payments/qaseh/callback` |
| Webhook (ours) | `https://api.rukny.io/api/v1/payments/qaseh/webhook` |
| UI result | `checkout.rukny.io/success\|failed\|pending` |

**Truth rule:** UI query params are hints only. Order paid state comes from API after webhook or status re-fetch.

Env (production):
```bash
QASEH_API_URL=https://api.alqaseh.com/v1
QASEH_CLIENT_ID=...
QASEH_CLIENT_SECRET=...
QASEH_REDIRECT_URL=https://api.rukny.io/api/v1/payments/qaseh/callback
QASEH_WEBHOOK_URL=https://api.rukny.io/api/v1/payments/qaseh/webhook
QASEH_WEBHOOK_SECRET=...
FRONTEND_URL=https://checkout.rukny.io
```

---

## 10. Smart & powerful features

Features are prioritized. **P0** ships in first release.

### 10.1 Trust & conversion (P0)
| ID | Feature | Why |
|----|---------|-----|
| SF-01 | Verified phone badge in review/pay | Trust + fewer fake COD/card attempts |
| SF-02 | One-tap resume (valid session) | Skip OTP if token still valid |
| SF-03 | Saved addresses by phone | Returning guests convert faster |
| SF-04 | Payment pending polling | Webhook lag should not confuse users |
| SF-05 | Clear failure reasons + retry | Recover declined/expired payments |
| SF-06 | Stock/price revalidation before pay | Avoid paying for unavailable items |

### 10.2 Address intelligence (P0–P1)
| ID | Feature | Why |
|----|---------|-----|
| SF-10 | Iraq governorate/city cascading selects | Fewer bad addresses |
| SF-11 | Landmark nudge | Delivery success |
| SF-12 | Duplicate address detect | Cleaner address book |
| SF-13 | Map pin + optional reverse geocode | Power users / ambiguous areas |
| SF-14 | “Receiver ≠ buyer” mode | Gifts / family delivery |

### 10.3 Checkout intelligence (P1)
| ID | Feature | Why |
|----|---------|-----|
| SF-20 | Smart coupon suggestions | AOV |
| SF-21 | Delivery ETA estimate by governorate | Expectation setting |
| SF-22 | Abandoned checkout reminder via WhatsApp | Recovery (opt-in) |
| SF-23 | Express checkout for returning verified phone | 2-tap buy |
| SF-24 | Multi-item cart conflict resolver | Partial OOS handling |

### 10.4 Fraud & risk (P1–P2)
| ID | Feature | Why |
|----|---------|-----|
| SF-30 | Device / IP risk score soft-block | OTP & card abuse |
| SF-31 | Velocity: many failed pays → cool-down | Card testing |
| SF-32 | Phone reputation (too many unpaid cancels) | Store protection |
| SF-33 | Amount anomaly alerts for merchants | Ops |
| SF-34 | Webhook signature required in prod | Payment integrity |

### 10.5 Delight & brand (P2)
| ID | Feature | Why |
|----|---------|-----|
| SF-40 | Bilingual AR/EN toggle | Broader audience |
| SF-41 | Order share card (WhatsApp) | Social proof / support |
| SF-42 | Subtle motion on success | Premium feel |
| SF-43 | Accessibility: large tap targets, screen readers | Inclusion |
| SF-44 | Dark-friendly store theming token passthrough | Brand match |

### 10.6 Platform expansion (later)
| ID | Feature | Why |
|----|---------|-----|
| SF-50 | Same checkout for Mail plan upgrades | One payment UX |
| SF-51 | Developer wallet top-up | Reuse rails |
| SF-52 | “Continue with Rukny account” | Link guest → account |
| SF-53 | Saved cards via gateway if Al-Qaseh supports | Faster repurchase |

---

## 11. Information architecture & API surface

### Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/checkout/otp/request` | Send OTP |
| POST | `/auth/checkout/otp/verify` | Issue verified session |
| POST | `/auth/checkout/otp/resend` | Resend |
| POST | `/auth/checkout/quick-login` | Cart-only unverified token |

### Addresses
| Method | Path |
|--------|------|
| GET | `/checkout/addresses` |
| POST | `/checkout/addresses` |
| PATCH | `/checkout/addresses/:id` |
| DELETE | `/checkout/addresses/:id` |

### Orders & pay
| Method | Path |
|--------|------|
| POST | `/checkout/orders` |
| POST | `/payments/qaseh/initiate/:orderId` |
| GET | `/payments/qaseh/status/:orderId` |
| POST | `/payments/qaseh/webhook` |
| GET | `/payments/qaseh/callback` |

All mutating checkout routes require `CheckoutSessionGuard` + ownership checks.

---

## 12. Data model (logical)

```text
CheckoutSession
  - userId (guest user row)
  - phoneNumber (verified)
  - email?
  - verified: boolean
  - exp

Address
  - phoneNumber (owner key)
  - recipientName, receiverPhone
  - governorate, city, district
  - street, landmark, building, floor, apartment
  - lat, lng?
  - isDefault

Order
  - orderNumber, storeId, userId
  - shippingAddressId
  - paymentMethod, paymentStatus, paymentId, paymentToken
  - totals, currency (IQD)

Payment (Qaseh)
  - payment_id, token, status
```

---

## 13. UX principles

1. **One job per screen** — phone, then address, then review  
2. **Mobile first** — thumb-reach CTAs, minimal typing  
3. **Arabic first** — RTL default; EN optional  
4. **No fake progress** — never say “Paid” until API confirms  
5. **Recoverable errors** — always a next action  
6. **Trust signals** — verified phone, secure payment, order number copy  
7. **Brand coherent** with Rukny, but quieter than marketing pages  

---

## 14. Success metrics

| Metric | Target (90 days) |
|--------|------------------|
| Checkout start → OTP verified | ≥ 75% |
| Verified → address complete | ≥ 90% |
| Address → payment start | ≥ 80% |
| Payment start → PAID | ≥ 70% (gateway dependent) |
| Address delivery fail rate | ↓ vs baseline |
| Support tickets “where is my payment?” | ↓ 40% |
| Median time to paid | < 3 minutes |

---

## 15. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| WhatsApp OTP delivery failures | Email fallback + status page |
| Webhook delayed | Pending page + status poll + manual reconcile job |
| Wrong addresses | Landmark nudge + map + governorate lists |
| Card declines | Clear failed page + retry + alternate method |
| OTP abuse | Existing Redis rate limits + global cap |
| Secrets leak | Env-only keys; never commit; rotate on expose |

---

## 16. Delivery phases (summary)

| Phase | Scope | Outcome |
|-------|-------|---------|
| 0 | Qaseh live keys + redirect/webhook | Payments work end-to-end in API |
| 1 | Scaffold `apps/checkout` | App live on staging domain |
| 2 | Phone + address + review UI | Guest can reach pay CTA |
| 3 | Qaseh redirect + result pages | Full card purchase |
| 4 | Smart features P0/P1 | Conversion & trust upgrades |
| 5 | Hardening + UAT + prod | Public launch |
| 6 | Expand to Mail / wallet | Platform checkout |

Details: [02-technical-implementation-plan.md](./02-technical-implementation-plan.md)

---

## 17. Open decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Session storage | httpOnly cookie vs Bearer header | httpOnly cookie on `checkout.rukny.io` + API CORS |
| Map provider | None / OSM / Google | OSM first (cost) |
| Cash on delivery | Keep / hide for card-first stores | Store setting |
| Guest → account link | Later | Phase 6 |
| App folder name | `checkout` | **Confirmed** |

---

## 18. Stakeholders & ownership

| Role | Owns |
|------|------|
| Product | Journey, copy, metrics |
| Frontend | `apps/checkout` |
| Backend | Checkout auth, addresses, orders, Qaseh |
| Ops | Keys, webhooks, monitoring |
| Support | Playbooks for failed pays / OTP |

---

## 19. Definition of done (v1 launch)

- [ ] Phone OTP works (WhatsApp + email fallback)  
- [ ] Address CRUD works for verified phone  
- [ ] Card pay via Al-Qaseh succeeds on Live  
- [ ] Webhook marks order `PAID` / `FAILED` reliably  
- [ ] Success/failed/pending pages correct  
- [ ] Unverified session cannot pay  
- [ ] Rate limits verified under abuse test  
- [ ] Staging UAT signed off  
- [ ] Prod keys + webhook secret set  
- [ ] Support FAQ published  

---

## 20. Appendix — message to Al-Qaseh (URLs)

**Redirect URL**  
`https://api.rukny.io/api/v1/payments/qaseh/callback`  
→ sends customer back after payment  

**Webhook URL**  
`https://api.rukny.io/api/v1/payments/qaseh/webhook`  
→ notifies our server of payment result  

Frontend result pages: `https://checkout.rukny.io/success` and `/failed`
