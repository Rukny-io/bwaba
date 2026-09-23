import {
  MailFilterAction,
  MailFilterMatchField,
  MailFilterRuleType,
  MailMessageFolder,
} from '@prisma/client';
import {
  evaluateMailFilterRules,
  type MailFilterRuleRow,
} from './mail-filter-rules.util';

function rule(
  partial: Partial<MailFilterRuleRow> & Pick<MailFilterRuleRow, 'id' | 'ruleType'>,
): MailFilterRuleRow {
  return {
    mailAppId: 'app-1',
    mailboxId: null,
    matchField: MailFilterMatchField.SENDER,
    pattern: 'bad@spam.com',
    action: MailFilterAction.SPAM,
    priority: 100,
    enabled: true,
    ...partial,
  };
}

describe('evaluateMailFilterRules', () => {
  it('prioritizes allowlist over blocklist and filters', () => {
    const rules: MailFilterRuleRow[] = [
      rule({
        id: 'block-1',
        ruleType: MailFilterRuleType.BLOCKLIST,
        pattern: 'trusted@partner.com',
        action: MailFilterAction.SPAM,
      }),
      rule({
        id: 'allow-1',
        ruleType: MailFilterRuleType.ALLOWLIST,
        pattern: 'trusted@partner.com',
        action: MailFilterAction.INBOX,
      }),
      rule({
        id: 'filter-1',
        ruleType: MailFilterRuleType.FILTER,
        matchField: MailFilterMatchField.SUBJECT,
        pattern: 'invoice',
        action: MailFilterAction.QUARANTINE,
        priority: 10,
      }),
    ];

    const result = evaluateMailFilterRules(rules, {
      fromAddress: 'trusted@partner.com',
      senderDomain: 'partner.com',
      subject: 'invoice due',
      recipientAddresses: ['team@example.com'],
    });

    expect(result).toEqual({
      folder: MailMessageFolder.INBOX,
      matchedRuleId: 'allow-1',
      reason: 'allowlist:allow-1',
    });
  });

  it('matches sender, domain, and subject patterns', () => {
    expect(
      evaluateMailFilterRules(
        [
          rule({
            id: 'domain-1',
            ruleType: MailFilterRuleType.FILTER,
            matchField: MailFilterMatchField.DOMAIN,
            pattern: 'partner.com',
            action: MailFilterAction.QUARANTINE,
          }),
        ],
        {
          fromAddress: 'sales@mail.partner.com',
          senderDomain: 'mail.partner.com',
          subject: 'hello',
          recipientAddresses: ['team@example.com'],
        },
      )?.folder,
    ).toBe(MailMessageFolder.QUARANTINE);

    expect(
      evaluateMailFilterRules(
        [
          rule({
            id: 'subject-1',
            ruleType: MailFilterRuleType.FILTER,
            matchField: MailFilterMatchField.SUBJECT,
            pattern: 'password reset',
            action: MailFilterAction.SPAM,
          }),
        ],
        {
          fromAddress: 'x@example.com',
          senderDomain: 'example.com',
          subject: 'Urgent password reset request',
          recipientAddresses: ['team@example.com'],
        },
      )?.folder,
    ).toBe(MailMessageFolder.SPAM);
  });

  it('rejects on DELETE action', () => {
    const result = evaluateMailFilterRules(
      [
        rule({
          id: 'delete-1',
          ruleType: MailFilterRuleType.BLOCKLIST,
          pattern: 'junk@bad.net',
          action: MailFilterAction.DELETE,
        }),
      ],
      {
        fromAddress: 'junk@bad.net',
        senderDomain: 'bad.net',
        subject: 'test',
        recipientAddresses: ['team@example.com'],
      },
    );

    expect(result).toEqual({
      reject: true,
      matchedRuleId: 'delete-1',
      reason: 'blocklist_delete:delete-1',
    });
  });

  it('checks allowlist before a higher-priority blocklist rule', () => {
    const result = evaluateMailFilterRules(
      [
        rule({
          id: 'block-priority',
          ruleType: MailFilterRuleType.BLOCKLIST,
          pattern: 'vip@client.com',
          priority: 1,
        }),
        rule({
          id: 'allow-vip',
          ruleType: MailFilterRuleType.ALLOWLIST,
          pattern: 'vip@client.com',
          priority: 999,
        }),
      ],
      {
        fromAddress: 'vip@client.com',
        senderDomain: 'client.com',
        subject: 'hello',
        recipientAddresses: ['team@example.com'],
      },
    );

    expect(result?.folder).toBe(MailMessageFolder.INBOX);
    expect(result?.matchedRuleId).toBe('allow-vip');
  });

  it('matches recipient addresses for catch-all style delivery', () => {
    const result = evaluateMailFilterRules(
      [
        rule({
          id: 'recipient-1',
          ruleType: MailFilterRuleType.FILTER,
          matchField: MailFilterMatchField.RECIPIENT,
          pattern: 'catchall@example.com',
          action: MailFilterAction.QUARANTINE,
        }),
      ],
      {
        fromAddress: 'sender@outside.com',
        senderDomain: 'outside.com',
        subject: 'test',
        recipientAddresses: ['catchall@example.com'],
      },
    );

    expect(result?.folder).toBe(MailMessageFolder.QUARANTINE);
  });
});
