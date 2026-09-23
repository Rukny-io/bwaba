import { MailMessageFolder } from '@prisma/client';
import {
  classifyInboundMail,
  classifySuspiciousForQuarantine,
} from './mail-message-classifier';

describe('classifyInboundMail', () => {
  it('routes failed SES spam and virus verdicts to Spam', () => {
    expect(
      classifyInboundMail({
        fromAddress: 'sender@example.com',
        spamVerdict: { status: 'FAIL' },
      }),
    ).toBe(MailMessageFolder.SPAM);
    expect(
      classifyInboundMail({
        fromAddress: 'sender@example.com',
        virusVerdict: { status: 'FAIL' },
      }),
    ).toBe(MailMessageFolder.SPAM);
  });

  it('routes fully failed authentication to Spam', () => {
    expect(
      classifyInboundMail({
        fromAddress: 'spoof@example.com',
        spfVerdict: { status: 'FAIL' },
        dkimVerdict: { status: 'FAIL' },
        dmarcVerdict: { status: 'FAIL' },
      }),
    ).toBe(MailMessageFolder.SPAM);
  });

  it('routes known social senders to Social', () => {
    expect(
      classifyInboundMail({
        fromAddress: 'notifications@updates.linkedin.com',
      }),
    ).toBe(MailMessageFolder.SOCIAL);
  });

  it('routes mailing lists and bulk mail to Promotions', () => {
    expect(
      classifyInboundMail({
        fromAddress: 'offers@shop.example',
        listUnsubscribe: '<mailto:unsubscribe@shop.example>',
      }),
    ).toBe(MailMessageFolder.PROMOTIONS);
  });

  it('keeps ordinary authenticated messages in Inbox', () => {
    expect(
      classifyInboundMail({
        fromAddress: 'person@example.com',
        spamVerdict: { status: 'PASS' },
        spfVerdict: { status: 'PASS' },
        dkimVerdict: { status: 'PASS' },
        dmarcVerdict: { status: 'PASS' },
      }),
    ).toBe(MailMessageFolder.INBOX);
  });
});

describe('classifySuspiciousForQuarantine', () => {
  it('quarantines gray SES verdicts', () => {
    expect(
      classifySuspiciousForQuarantine({
        fromAddress: 'sender@example.com',
        spamVerdict: { status: 'GRAY' },
      }),
    ).toBe(MailMessageFolder.QUARANTINE);
  });

  it('quarantines partial authentication failures', () => {
    expect(
      classifySuspiciousForQuarantine({
        fromAddress: 'sender@example.com',
        spfVerdict: { status: 'FAIL' },
        dkimVerdict: { status: 'PASS' },
        dmarcVerdict: { status: 'PASS' },
      }),
    ).toBe(MailMessageFolder.QUARANTINE);
  });

  it('returns null for clean messages', () => {
    expect(
      classifySuspiciousForQuarantine({
        fromAddress: 'sender@example.com',
        spamVerdict: { status: 'PASS' },
        spfVerdict: { status: 'PASS' },
        dkimVerdict: { status: 'PASS' },
        dmarcVerdict: { status: 'PASS' },
      }),
    ).toBeNull();
  });

  it('does not quarantine DMARC-none alone when the setting is enabled', () => {
    expect(
      classifySuspiciousForQuarantine(
        {
          fromAddress: 'news@vendor.com',
          dmarcVerdict: { status: 'NONE' },
          spfVerdict: { status: 'PASS' },
          dkimVerdict: { status: 'PASS' },
        },
        { quarantineNewSendersWithoutDmarc: true },
      ),
    ).toBeNull();
  });

  it('quarantines DMARC-none with a failed SPF when the setting is enabled', () => {
    expect(
      classifySuspiciousForQuarantine(
        {
          fromAddress: 'news@vendor.com',
          dmarcVerdict: { status: 'NONE' },
          spfVerdict: { status: 'FAIL' },
          dkimVerdict: { status: 'PASS' },
        },
        { quarantineNewSendersWithoutDmarc: true },
      ),
    ).toBe(MailMessageFolder.QUARANTINE);
  });
});
