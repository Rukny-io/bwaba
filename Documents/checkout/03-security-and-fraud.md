# Rukny Checkout — Security & Fraud Controls

> Companion to [01-checkout-product-spec.md](./01-checkout-product-spec.md)  
> **Date:** 2026-09-21

---

## 1. Trust model

| Layer | Trust signal | Used for |
|-------|--------------|----------|
| Phone OTP | WhatsApp / email proof of possession | Identity for guest checkout |
| Checkout JWT | Server-signed session (`verified`) | Authorize address/order/pay |
| Address ownership | Bound to verified phone / userId | Delivery target |
| Payment | Al-Qaseh + webhook re-fetch | Money movement truth |

**Rule:** Client never decides “paid”. Only API after Qaseh context / webhook.

---

## 2. Phone verification controls

Already largely implemented in `CheckoutAuthService`:

| Control | Policy |
|---------|--------|
| OTP length | 6 digits |
| Verify attempts / OTP | Max 5 |
| Requests / phone | Max 5 / 15 min |
| Requests / IP | Max 3 / hour |
| Verify attempts / IP | Max 15 / 15 min |
| Global daily OTP sends | Cap 10_000 (circuit breaker) |
| Redis failure mode | Fail closed |
| Unverified session | Cart only — cannot pay |

### Additional requirements for `apps/checkout`
- Do not persist OTP in `localStorage`  
- Mask phone in UI after send (`+964***1234`)  
- Disable paste-spam on verify with sensible UX (allow paste once)  
- Show generic errors (don’t reveal whether phone exists beyond what’s needed)

---

## 3. Address controls

| Risk | Control |
|------|---------|
| IDOR on address id | Guard + phone/user ownership check on every mutation |
| Polluted address book | Soft duplicate detection; limit addresses per phone (e.g. 20) |
| Fake delivery addresses | Landmark nudge; optional map; merchant can reject |
| Receiver phone abuse | Still require buyer verified; log receiver separately |

---

## 4. Payment controls

| Risk | Control |
|------|---------|
| Forged webhook | HMAC `QASEH_WEBHOOK_SECRET` required in production |
| Trusting redirect query | Re-fetch payment context from Qaseh before updating order |
| Order IDOR on initiate/status | `CheckoutSessionGuard` + `assertOrderOwnership` |
| Double pay | Only allow initiate when `UNPAID` / `FAILED` |
| Card data on our servers | Never — hosted Al-Qaseh page only |
| Replay | Idempotent status updates; ignore obsolete transitions |

---

## 5. Fraud signals (smart layer)

| Signal | Action |
|--------|--------|
| Many OTP requests, never verify | Temporary phone/IP block |
| Many declined cards same phone | Cool-down 30–120 min |
| High-value first order + new phone | Flag for merchant review (optional hold) |
| Address in governorate X, IP country Y mismatch | Soft risk score (log) |
| Rapid multi-store checkout same phone | Velocity alert |

Start with **logging + rate limits**; auto-hold only after false-positive review.

---

## 6. Secrets & config

| Secret | Storage |
|--------|---------|
| `QASEH_CLIENT_SECRET` | Server env only |
| `QASEH_WEBHOOK_SECRET` | Server env only |
| Checkout JWT secret | Existing API JWT config |
| WhatsApp tokens | Server env only |

Never commit secrets. Rotate if exposed in chat, tickets, or git history.

---

## 7. Privacy

- Minimize logs: no full OTP, no card data, truncate phone where possible  
- Addresses are personal data — access only with verified session  
- Retention: follow org policy; support access via HQ tools with audit  

---

## 8. Launch security checklist

- [ ] Webhook signature enforced when secret set  
- [ ] Production uses Live Qaseh URL (not `api-test`)  
- [ ] CORS limited to checkout (+ known storefronts)  
- [ ] Unverified cannot call pay initiate  
- [ ] Status/initiate ownership tests green  
- [ ] Rate-limit load test on OTP endpoints  
- [ ] No secrets in frontend bundle  

---

## 9. Incident playbooks (short)

### OTP outage (WhatsApp down)
1. Confirm Meta/WhatsApp status  
2. Force email fallback messaging in UI  
3. If both down — pause checkout entry with banner  

### Webhook failures
1. Check API logs + Qaseh dashboard  
2. Reconcile via `GET /egw/payments/:id` job  
3. Manually confirm orders only with dual control  

### Suspected card testing
1. Enable stricter velocity limits  
2. Block offending phones/IPs  
3. Notify Al-Qaseh if patterns persist  
