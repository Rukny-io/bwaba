import { resolveApiBaseUrl } from "@rukny/auth/client/env-urls";
import { sessionFetch } from "@/lib/api-client";
import type { MailTeamRole } from "@/lib/mail-team-client";

export type MailSsoSettings = {
  quickLinkEnabled: boolean;
  autoAcceptOnLink: boolean;
  skipMailboxPasswordForAssigned: boolean;
  linkTtlHours: number;
  allowedEmailDomains: string[];
};

export type MailSsoLinkStatus = "sent" | "used" | "expired" | "revoked";

export type MailSsoLinkView = {
  id: string;
  email: string;
  mailboxId: string | null;
  status: MailSsoLinkStatus;
  expiresAt: string;
  usedAt: string | null;
  lastSentAt: string;
  createdAt: string;
  url?: string;
};

export type MailSsoPerson = {
  key: string;
  kind: "owner" | "member" | "email_invite";
  id: string;
  userId: string | null;
  email: string;
  name: string | null;
  role: "OWNER" | MailTeamRole;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
  joinedAt: string | null;
  mailboxes: { id: string; address: string; pending: boolean }[];
  link: MailSsoLinkView | null;
};

export type MailSsoMailbox = {
  id: string;
  address: string;
  displayName: string | null;
  assignedUserId: string | null;
  pendingAssigneeEmail: string | null;
};

export type MailIdentityProviderPreset =
  | "GOOGLE_WORKSPACE"
  | "MICROSOFT_ENTRA"
  | "CUSTOM";

export type MailIdentityProviderSummary = {
  id: string;
  preset: MailIdentityProviderPreset;
  enabled: boolean;
  emailDomain: string;
  enforceSso: boolean;
  lastTestedAt: string | null;
  lastTestError: string | null;
};

export type MailSsoOverview = {
  canManage: boolean;
  isOwner: boolean;
  consoleMembersIncluded: number;
  consoleMembersUsed: number;
  settings: MailSsoSettings;
  workspace: {
    appId: string;
    name: string;
    primaryDomain: string | null;
    domainActive: boolean;
  };
  mailboxes: MailSsoMailbox[];
  people: MailSsoPerson[];
  identityProvider: MailIdentityProviderSummary | null;
};

export type MailSsoProvisionInput = {
  email: string;
  role: MailTeamRole;
  mailboxId?: string;
  newLocalPart?: string;
  displayName?: string;
};

export type MailSsoProvisionResult = {
  email: string;
  kind: "member" | "email_invite";
  needsSignup: boolean;
  alreadyMember: boolean;
  mailbox: { id: string; address: string } | null;
  link: MailSsoLinkView & { url: string };
};

export type MailSsoBulkResult = {
  results: {
    email: string;
    ok: boolean;
    error?: string;
    code?: string;
    result?: MailSsoProvisionResult;
  }[];
  succeeded: number;
  failed: number;
};

export type MailSsoLinkPreview = {
  email: string;
  expiresAt: string;
  autoAccept: boolean;
  workspace: { appId: string; name: string; primaryDomain: string | null };
  mailbox: { address: string } | null;
};

export type MailSsoConsumeResult =
  | { needsConfirmation: true; workspace: { appId: string; name: string } }
  | {
      needsConfirmation: false;
      workspace: { appId: string; name: string; slotIndex: number };
      mailbox: { id: string; address: string } | null;
      mailboxOpened: boolean;
    };

export class MailSsoError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

type ErrorBody = { message?: string | string[]; error?: string; code?: string };

async function readJson<T>(response: Response): Promise<T & ErrorBody> {
  return (await response.json().catch(() => ({}))) as T & ErrorBody;
}

function toError(response: Response, data: ErrorBody, fallback: string) {
  const raw = data.message ?? data.error;
  const message = Array.isArray(raw) ? raw[0] || fallback : raw || fallback;
  return new MailSsoError(message, data.code, response.status);
}

function appBase(appId: string) {
  return `/api/v1/mail/apps/${encodeURIComponent(appId)}/sso`;
}

async function jsonRequest<T>(
  url: string,
  init: RequestInit,
  fallback: string,
): Promise<T> {
  const response = await sessionFetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const data = await readJson<T>(response);
  if (!response.ok) throw toError(response, data, fallback);
  return data;
}

export async function getMailSsoOverview(appId: string): Promise<MailSsoOverview> {
  const response = await sessionFetch(appBase(appId));
  const data = await readJson<MailSsoOverview>(response);
  if (!response.ok) throw toError(response, data, "Could not load SSO.");
  return data;
}

export async function updateMailSsoSettings(
  appId: string,
  patch: Partial<MailSsoSettings>,
): Promise<MailSsoSettings> {
  const data = await jsonRequest<{ settings: MailSsoSettings }>(
    `${appBase(appId)}/settings`,
    { method: "PATCH", body: JSON.stringify(patch) },
    "Could not save settings.",
  );
  return data.settings;
}

export function provisionMailSso(
  appId: string,
  input: MailSsoProvisionInput,
): Promise<MailSsoProvisionResult> {
  return jsonRequest<MailSsoProvisionResult>(
    `${appBase(appId)}/provision`,
    { method: "POST", body: JSON.stringify(input) },
    "Could not add teammate.",
  );
}

export function provisionMailSsoBulk(
  appId: string,
  rows: MailSsoProvisionInput[],
): Promise<MailSsoBulkResult> {
  return jsonRequest<MailSsoBulkResult>(
    `${appBase(appId)}/provision/bulk`,
    { method: "POST", body: JSON.stringify({ rows }) },
    "Could not add teammates.",
  );
}

export async function resendMailSsoLink(
  appId: string,
  linkId: string,
  opts: { deliver: boolean },
): Promise<MailSsoLinkView & { url: string }> {
  const data = await jsonRequest<{ link: MailSsoLinkView & { url: string } }>(
    `${appBase(appId)}/links/${encodeURIComponent(linkId)}/resend`,
    { method: "POST", body: JSON.stringify({ deliver: opts.deliver }) },
    "Could not send link.",
  );
  return data.link;
}

export async function revokeMailSsoLink(appId: string, linkId: string): Promise<void> {
  const response = await sessionFetch(
    `${appBase(appId)}/links/${encodeURIComponent(linkId)}`,
    { method: "DELETE" },
  );
  const data = await readJson(response);
  if (!response.ok) throw toError(response, data, "Could not revoke link.");
}

export async function previewMailSsoLink(token: string): Promise<MailSsoLinkPreview> {
  const response = await fetch(`/api/v1/mail/sso/links/${encodeURIComponent(token)}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await readJson<MailSsoLinkPreview>(response);
  if (!response.ok) throw toError(response, data, "This sign-in link is not valid.");
  return data;
}

/** Goes through the BFF so the mailbox session cookie is set on the Mail origin. */
export async function consumeMailSsoLink(
  token: string,
  opts: { confirm?: boolean } = {},
): Promise<MailSsoConsumeResult> {
  return jsonRequest<MailSsoConsumeResult>(
    "/api/mail/sso/consume",
    { method: "POST", body: JSON.stringify({ token, confirm: Boolean(opts.confirm) }) },
    "Could not open your mailbox.",
  );
}

export type MailIdentityProviderConfig = MailIdentityProviderSummary & {
  issuer: string;
  clientId: string;
  hasClientSecret: boolean;
  jitProvisioning: boolean;
  defaultRole: MailSsoProvisionInput["role"];
  autoMapMailboxByLocalPart: boolean;
};

export type MailIdentityProviderInput = {
  preset: MailIdentityProviderPreset;
  issuer: string;
  clientId: string;
  clientSecret?: string;
  enabled?: boolean;
  jitProvisioning?: boolean;
  defaultRole?: MailSsoProvisionInput["role"];
  enforceSso?: boolean;
  autoMapMailboxByLocalPart?: boolean;
};

export type MailIdentityProviderResponse = {
  identityProvider: MailIdentityProviderConfig | null;
  redirectUri: string;
};

export async function getMailIdentityProvider(
  appId: string,
): Promise<MailIdentityProviderResponse> {
  const response = await sessionFetch(`${appBase(appId)}/identity-provider`);
  const data = await readJson<MailIdentityProviderResponse>(response);
  if (!response.ok) throw toError(response, data, "Could not load the identity provider.");
  return data;
}

export function saveMailIdentityProvider(
  appId: string,
  input: MailIdentityProviderInput,
): Promise<MailIdentityProviderResponse> {
  return jsonRequest<MailIdentityProviderResponse>(
    `${appBase(appId)}/identity-provider`,
    { method: "PUT", body: JSON.stringify(input) },
    "Could not save the identity provider.",
  );
}

export function testMailIdentityProvider(appId: string): Promise<{
  ok: boolean;
  error: string | null;
  identityProvider: MailIdentityProviderConfig;
}> {
  return jsonRequest(
    `${appBase(appId)}/identity-provider/test`,
    { method: "POST", body: "{}" },
    "Could not test the connection.",
  );
}

export async function deleteMailIdentityProvider(appId: string): Promise<void> {
  const response = await sessionFetch(`${appBase(appId)}/identity-provider`, {
    method: "DELETE",
  });
  const data = await readJson(response);
  if (!response.ok) throw toError(response, data, "Could not disconnect.");
}

export async function discoverMailSso(
  email: string,
): Promise<{ sso: boolean; preset: MailIdentityProviderPreset | null; enforced: boolean }> {
  const response = await fetch(
    `/api/v1/mail/sso/oidc/discover?email=${encodeURIComponent(email)}`,
    { headers: { Accept: "application/json" } },
  );
  const data = await readJson<{
    sso: boolean;
    preset: MailIdentityProviderPreset | null;
    enforced: boolean;
  }>(response);
  if (!response.ok) throw toError(response, data, "Could not check SSO.");
  return data;
}

/** Full-page navigation target; the API redirects to the identity provider. */
export function mailSsoStartUrl(email: string): string {
  return `${resolveApiBaseUrl()}/mail/sso/oidc/start?email=${encodeURIComponent(email)}`;
}

/** Parse `email,mailbox,role` CSV (header optional). Mailbox may be a local part or full address. */
export function parseMailSsoCsv(text: string): {
  email: string;
  mailbox: string;
  role: string;
}[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length && /^email\s*[,;]/i.test(lines[0])) lines.shift();
  return lines.map((line) => {
    const [email = "", mailbox = "", role = ""] = line
      .split(/[,;\t]/)
      .map((cell) => cell.trim().replace(/^"|"$/g, ""));
    return { email, mailbox, role };
  });
}
