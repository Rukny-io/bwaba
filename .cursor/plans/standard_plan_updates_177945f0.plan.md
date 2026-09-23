---
name: Standard plan updates
overview: Update Standard seats/team, and set a flat outbound pack price of 800 IQD per 1,000 emails for all plans (Starter/Standard/Premium). Users buy packs when Usage is exhausted.
todos:
  - id: standard-config
    content: Set STANDARD priceExtraMailbox 4000 and consoleMembersIncluded 4 in API + mail-plans
    status: completed
  - id: usage-pack-800
    content: Set flat 800 IQD/1K outbound packs for STARTER, STANDARD, PREMIUM; enable buy on Usage UI
    status: completed
  - id: standard-marketing
    content: Update marketing compare for Standard seats/team and pack price 800 IQD/1K all plans
    status: completed
  - id: standard-verify
    content: Verify Standard seat math, pack totals, and Starter pack price now 800
    status: completed
isProject: false
---

# Standard plan updates + flat Usage packs

## Decisions (Standard)

| Item | Before | After |
|------|--------|-------|
| Extra mailbox | 2,000 IQD/mo | **4,000 IQD/mo** |
| Base price (3 mailboxes) | 6,000 IQD/mo | Unchanged |
| Console team seats | 5 | **4** (Team supported) |
| Included outbound | 25,000 / month | Unchanged |

Example: 3 seats = 6,000; 4th mailbox = **10,000** IQD/mo.

## Decisions (Usage packs — all plans)

| Item | Before | After |
|------|--------|-------|
| Pack unit | 1,000 outbound emails | Unchanged |
| Pack price | Starter 1,500; others none | **800 IQD / 1,000** for **Starter, Standard, and Premium** |
| When to buy | Starter only after quota | **Any plan** — user buys when Usage remaining hits 0 |

Same usage math as today:

```
allowance = includedOutbound + packCredits
reserve recipients on send; block at 0 remaining → buy packs
```

Included quotas stay: Starter 5K · Standard 25K · Premium 100K.

**Margin (pack):** SES ~130 IQD / 1K → sell at **800 IQD** ≈ **~670 IQD contribution (~84%)** after SES outbound (before AI/payments/hosting).

---

## Implementation

### 1) Standard seat / team config

In [`mail-plan-limits.config.ts`](apps/api/src/domain/mail/mail-plan-limits.config.ts) and [`mail-plans.ts`](apps/mail/lib/mail-plans.ts):

- `STANDARD.priceExtraMailbox = 4_000`
- `STANDARD.consoleMembersIncluded = 4`

### 2) Flat pack price for all plans

In API config:

```ts
MAIL_OUTBOUND_PACK_PRICE_IQD: {
  STARTER: 800,
  STANDARD: 800,
  PREMIUM: 800,
}
```

Mirror in [`apps/mail/lib/mail-plans.ts`](apps/mail/lib/mail-plans.ts) (`MAIL_OUTBOUND_PACK_PRICE_IQD`).

Checkout/credit path already works for any plan with a pack price (`createOutboundPackCheckoutSession` / `packsAvailable`). No new schema.

Update UI copy that still says “Starter only” or “1,500 IQD”:

- [`mail-usage-section.tsx`](apps/mail/components/billing/mail-usage-section.tsx)
- [`mail-pricing-marketing-page.tsx`](apps/mail/components/marketing/mail-pricing-marketing-page.tsx) (extra outbound row for all plans)
- Estimate catalog first bracket if still showing 1,500 — align display to **800** where it represents pack rate

### 3) Marketing Standard rows

- Extra mailbox: **4,000 IQD/mo**
- Console members: **4**
- Extra outbound: **800 IQD / 1,000** (all plans)

### 4) Checks

- `mailMonthlyTotal(STANDARD, 4) === 10000`
- `mailOutboundPackTotalIqd(STANDARD, 3) === 2400` (+3,000 credits)
- Starter pack unit also **800** (was 1,500)
- Team visible for Standard; invite cap 4

---

## Out of scope

- Changing included outbound (5K / 25K / 100K)
- Premium seat/team limits (review later)
- Auto top-up
