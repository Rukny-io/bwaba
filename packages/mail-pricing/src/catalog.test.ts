import { describe, expect, it } from 'vitest';
import {
  MailPlanId,
  mailMonthlyTotal,
  MAIL_PLANS,
} from './catalog';

describe('mail-pricing catalog', () => {
  it('starter pricing matches product spec', () => {
    const starter = MAIL_PLANS[MailPlanId.STARTER];
    expect(starter.priceMonthlyIqd).toBe(3_000);
    expect(starter.limits.mailboxesIncluded).toBe(3);
    expect(starter.domainsIncluded).toBe(3);
  });

  it('professional pricing matches product spec', () => {
    const pro = MAIL_PLANS[MailPlanId.PROFESSIONAL];
    expect(pro.priceMonthlyIqd).toBe(8_000);
    expect(pro.limits.mailboxesIncluded).toBe(5);
    expect(pro.domainsIncluded).toBe(5);
  });

  it('charges extra mailboxes above included seats', () => {
    expect(mailMonthlyTotal(MailPlanId.STARTER, 3)).toBe(3_000);
    expect(mailMonthlyTotal(MailPlanId.STARTER, 4)).toBe(5_000);
  });
});
