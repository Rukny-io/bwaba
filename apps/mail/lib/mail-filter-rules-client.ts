import { sessionFetch } from "@/lib/api-client";

export type MailFilterRuleType = "BLOCKLIST" | "ALLOWLIST" | "FILTER";
export type MailFilterMatchField =
  | "SENDER"
  | "DOMAIN"
  | "SUBJECT"
  | "RECIPIENT"
  | "SENDER_REGEX"
  | "SUBJECT_REGEX";
export type MailFilterAction =
  | "SPAM"
  | "QUARANTINE"
  | "INBOX"
  | "PROMOTIONS"
  | "SOCIAL"
  | "DELETE";

export type MailFilterRuleView = {
  id: string;
  mailboxId: string | null;
  mailboxAddress: string | null;
  ruleType: MailFilterRuleType;
  matchField: MailFilterMatchField;
  pattern: string;
  action: MailFilterAction;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MailFilterRuleListResponse = {
  domain: string | null;
  limit: number;
  used: number;
  rules: MailFilterRuleView[];
};

export type MailSecuritySettingsView = {
  quarantineSuspicious: boolean;
  notifyOnQuarantine: boolean;
  quarantineRetentionDays: number;
  quarantineNewSendersWithoutDmarc: boolean;
};

async function readJson<T>(
  response: Response,
): Promise<T & { message?: string | string[]; error?: string }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
    error?: string;
  };
}

function errorMessage(
  data: { message?: string | string[]; error?: string },
  fallback: string,
) {
  const raw = data.message ?? data.error;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

function appBase(appId: string) {
  return `/api/v1/mail/apps/${encodeURIComponent(appId)}`;
}

export async function listMailFilterRules(
  appId: string,
  ruleType?: MailFilterRuleType,
): Promise<MailFilterRuleListResponse> {
  const query = ruleType
    ? `?ruleType=${encodeURIComponent(ruleType)}`
    : "";
  const response = await sessionFetch(`${appBase(appId)}/filter-rules${query}`);
  const data = await readJson<MailFilterRuleListResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load filter rules."));
  }
  return {
    domain: data.domain ?? null,
    limit: Number(data.limit) || 0,
    used: Number(data.used) || 0,
    rules: data.rules ?? [],
  };
}

export async function createMailFilterRule(
  appId: string,
  input: {
    mailboxId?: string;
    ruleType: MailFilterRuleType;
    matchField: MailFilterMatchField;
    pattern: string;
    action: MailFilterAction;
    priority?: number;
  },
): Promise<MailFilterRuleView> {
  const response = await sessionFetch(`${appBase(appId)}/filter-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ rule?: MailFilterRuleView }>(response);
  if (!response.ok || !data.rule) {
    throw new Error(errorMessage(data, "Could not create filter rule."));
  }
  return data.rule;
}

export async function updateMailFilterRule(
  appId: string,
  ruleId: string,
  input: {
    mailboxId?: string | null;
    matchField?: MailFilterMatchField;
    pattern?: string;
    action?: MailFilterAction;
    priority?: number;
    enabled?: boolean;
  },
): Promise<MailFilterRuleView> {
  const response = await sessionFetch(
    `${appBase(appId)}/filter-rules/${encodeURIComponent(ruleId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await readJson<{ rule?: MailFilterRuleView }>(response);
  if (!response.ok || !data.rule) {
    throw new Error(errorMessage(data, "Could not update filter rule."));
  }
  return data.rule;
}

export async function deleteMailFilterRule(
  appId: string,
  ruleId: string,
): Promise<void> {
  const response = await sessionFetch(
    `${appBase(appId)}/filter-rules/${encodeURIComponent(ruleId)}`,
    { method: "DELETE" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not delete filter rule."));
  }
}

export async function getMailSecuritySettings(
  appId: string,
): Promise<MailSecuritySettingsView> {
  const response = await sessionFetch(`${appBase(appId)}/security-settings`);
  const data = await readJson<MailSecuritySettingsView>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load security settings."));
  }
  return {
    quarantineSuspicious: data.quarantineSuspicious ?? true,
    notifyOnQuarantine: data.notifyOnQuarantine ?? false,
    quarantineRetentionDays: Number(data.quarantineRetentionDays) || 30,
    quarantineNewSendersWithoutDmarc:
      data.quarantineNewSendersWithoutDmarc ?? false,
  };
}

export async function updateMailSecuritySettings(
  appId: string,
  input: Partial<MailSecuritySettingsView>,
): Promise<MailSecuritySettingsView> {
  const response = await sessionFetch(`${appBase(appId)}/security-settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<MailSecuritySettingsView>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not update security settings."));
  }
  return data;
}
