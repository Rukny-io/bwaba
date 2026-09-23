---
name: Premium plan updates
overview: "Update Mail Premium: extra mailbox 4,000 IQD/mo, console team 10 seats, included outbound 60,000/month. Packs stay flat 800 IQD/1K.\""
todos:
  - id: premium-config
    content: Set PREMIUM extra mailbox 4000, console 10, outbound 60K in API + mail-plans
    status: completed
  - id: premium-marketing
    content: Update marketing compare rows for Premium
    status: completed
  - id: premium-verify
    content: Verify Premium seat/outbound math; Starter/Standard unchanged
    status: completed
isProject: false
---

# Premium plan updates

## Decisions

| Item | Before | After |
|------|--------|-------|
| Base price (5 mailboxes) | 10,000 IQD/mo | Unchanged |
| Extra mailbox | 2,000 IQD/mo | **4,000 IQD/mo** |
| Console team seats | 15 | **10** |
| Included outbound | 100,000 / month | **60,000 / month** |
| Usage packs | 800 IQD / 1,000 | Unchanged (all plans) |

Example: 5 seats = 10,000; 6th mailbox = **14,000** IQD/mo.

**Margin note:** Full use of 60K outbound ≈ SES $6 ≈ **7,800 IQD** vs 10,000 base → still positive on send COGS (~22% after SES alone) before packs/other costs. Better than prior 100K included.

---

## Implementation

### 1) Config

[`apps/api/src/domain/mail/mail-plan-limits.config.ts`](apps/api/src/domain/mail/mail-plan-limits.config.ts):

- `MAIL_PLAN_LIMITS.PREMIUM.consoleMembersIncluded = 10`
- `MAIL_PLAN_DEFINITIONS.PREMIUM.priceExtraMailbox = 4_000`
- `MAIL_INCLUDED_OUTBOUND[PREMIUM] = 60_000`

[`apps/mail/lib/mail-plans.ts`](apps/mail/lib/mail-plans.ts):

- Same on `premium` limits + `priceExtraMailbox`
- `MAIL_INCLUDED_OUTBOUND.premium = 60_000` (feeds estimate catalog)

No Prisma migration.

### 2) Marketing

[`mail-pricing-marketing-page.tsx`](apps/mail/components/marketing/mail-pricing-marketing-page.tsx) compare rows:

- Extra mailbox Premium: **4,000 IQD/mo**
- Console members Premium: **10**
- Outbound included Premium: **60,000**

### 3) Checks

- `mailMonthlyTotal(PREMIUM, 6) === 14000`
- `MAIL_INCLUDED_OUTBOUND.PREMIUM === 60000`
- `consoleMembersIncluded === 10`
- Starter/Standard unchanged (extra 2,000 / 3,000; outbound 5K / 25K)

---

## Out of scope

- Base Premium price, storage, unlimited aliases/filters
- Pack price (already 800 flat)
