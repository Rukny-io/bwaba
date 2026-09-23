import {
  MailFilterAction,
  MailFilterMatchField,
  MailFilterRuleType,
  MailMessageFolder,
} from '@prisma/client';

export type MailFilterRuleRow = {
  id: string;
  mailAppId: string;
  mailboxId: string | null;
  ruleType: MailFilterRuleType;
  matchField: MailFilterMatchField;
  pattern: string;
  action: MailFilterAction;
  priority: number;
  enabled: boolean;
};

export type MailFilterEvaluateInput = {
  fromAddress: string;
  senderDomain: string;
  subject: string;
  recipientAddresses: string[];
};

export type MailFilterEvaluateResult = {
  reject?: boolean;
  folder?: MailMessageFolder;
  matchedRuleId?: string;
  reason?: string;
};

const REGEX_MAX_LENGTH = 200;

export function normalizeFilterPattern(
  matchField: MailFilterMatchField,
  pattern: string,
): string {
  const trimmed = pattern.trim();
  if (
    matchField === MailFilterMatchField.SUBJECT ||
    matchField === MailFilterMatchField.SUBJECT_REGEX
  ) {
    return trimmed.toLowerCase();
  }
  if (
    matchField === MailFilterMatchField.SENDER_REGEX ||
    matchField === MailFilterMatchField.RECIPIENT
  ) {
    return trimmed.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export function senderDomainFromAddress(address: string): string {
  const normalized = address.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at === normalized.length - 1) return '';
  return normalized.slice(at + 1);
}

export function isPremiumRegexField(matchField: MailFilterMatchField): boolean {
  return (
    matchField === MailFilterMatchField.SENDER_REGEX ||
    matchField === MailFilterMatchField.SUBJECT_REGEX
  );
}

export function compileSafeRegex(pattern: string): RegExp | null {
  if (!pattern || pattern.length > REGEX_MAX_LENGTH) return null;
  if (/(\([^)]*[+*][^)]*\))[+*{]/.test(pattern)) return null;
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return null;
  }
}

function matchesRule(
  rule: MailFilterRuleRow,
  input: MailFilterEvaluateInput,
): boolean {
  const from = input.fromAddress.trim().toLowerCase();
  const domain = input.senderDomain.trim().toLowerCase();
  const subject = input.subject.trim().toLowerCase();
  const pattern = rule.pattern;
  const recipients = input.recipientAddresses.map((address) =>
    address.trim().toLowerCase(),
  );

  switch (rule.matchField) {
    case MailFilterMatchField.SENDER:
      return from === pattern;
    case MailFilterMatchField.DOMAIN:
      return domain === pattern || domain.endsWith(`.${pattern}`);
    case MailFilterMatchField.SUBJECT:
      return subject.includes(pattern);
    case MailFilterMatchField.RECIPIENT:
      return recipients.some(
        (recipient) =>
          recipient === pattern || recipient.endsWith(`@${pattern}`),
      );
    case MailFilterMatchField.SENDER_REGEX: {
      const regex = compileSafeRegex(pattern);
      return regex ? regex.test(from) : false;
    }
    case MailFilterMatchField.SUBJECT_REGEX: {
      const regex = compileSafeRegex(pattern);
      return regex ? regex.test(subject) : false;
    }
    default:
      return false;
  }
}

function actionToFolder(action: MailFilterAction): MailMessageFolder | null {
  switch (action) {
    case MailFilterAction.SPAM:
      return MailMessageFolder.SPAM;
    case MailFilterAction.QUARANTINE:
      return MailMessageFolder.QUARANTINE;
    case MailFilterAction.INBOX:
      return MailMessageFolder.INBOX;
    case MailFilterAction.PROMOTIONS:
      return MailMessageFolder.PROMOTIONS;
    case MailFilterAction.SOCIAL:
      return MailMessageFolder.SOCIAL;
    case MailFilterAction.DELETE:
      return null;
    default:
      return null;
  }
}

function byPriority(a: MailFilterRuleRow, b: MailFilterRuleRow) {
  return a.priority - b.priority || a.id.localeCompare(b.id);
}

export function evaluateMailFilterRules(
  rules: MailFilterRuleRow[],
  input: MailFilterEvaluateInput,
): MailFilterEvaluateResult | null {
  const active = rules.filter((rule) => rule.enabled);

  // Phase 1: allowlist — all rules, any match wins (priority ignored by design).
  const allowlist = active.filter(
    (rule) => rule.ruleType === MailFilterRuleType.ALLOWLIST,
  );
  for (const rule of allowlist) {
    if (matchesRule(rule, input)) {
      return {
        folder: MailMessageFolder.INBOX,
        matchedRuleId: rule.id,
        reason: `allowlist:${rule.id}`,
      };
    }
  }

  // Phase 2: blocklist — sorted by priority ascending, first match wins.
  const blocklist = active
    .filter((rule) => rule.ruleType === MailFilterRuleType.BLOCKLIST)
    .sort(byPriority);
  for (const rule of blocklist) {
    if (!matchesRule(rule, input)) continue;
    if (rule.action === MailFilterAction.DELETE) {
      return {
        reject: true,
        matchedRuleId: rule.id,
        reason: `blocklist_delete:${rule.id}`,
      };
    }
    const folder = actionToFolder(rule.action) ?? MailMessageFolder.SPAM;
    return {
      folder,
      matchedRuleId: rule.id,
      reason: `blocklist:${rule.id}`,
    };
  }

  // Phase 3: custom filters — sorted by priority ascending.
  const filters = active
    .filter((rule) => rule.ruleType === MailFilterRuleType.FILTER)
    .sort(byPriority);
  for (const rule of filters) {
    if (!matchesRule(rule, input)) continue;
    if (rule.action === MailFilterAction.DELETE) {
      return {
        reject: true,
        matchedRuleId: rule.id,
        reason: `filter_delete:${rule.id}`,
      };
    }
    const folder = actionToFolder(rule.action);
    if (!folder) continue;
    return {
      folder,
      matchedRuleId: rule.id,
      reason: `filter:${rule.id}`,
    };
  }

  return null;
}

export function assertValidRuleAction(
  ruleType: MailFilterRuleType,
  action: MailFilterAction,
): void {
  if (ruleType === MailFilterRuleType.ALLOWLIST && action !== MailFilterAction.INBOX) {
    throw new Error('Allowlist rules must use the INBOX action.');
  }
  if (
    ruleType === MailFilterRuleType.BLOCKLIST &&
    action !== MailFilterAction.SPAM &&
    action !== MailFilterAction.DELETE
  ) {
    throw new Error('Blocklist rules must use SPAM or DELETE.');
  }
}
