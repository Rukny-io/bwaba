import { sessionFetch } from "@/lib/api-client";

export type MailAliasView = {
  id: string;
  localPart: string;
  domain: string;
  address: string;
  mailboxId: string;
  mailboxAddress: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MailAliasListResponse = {
  domain: string | null;
  limit: number;
  used: number;
  aliases: MailAliasView[];
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

function aliasBase(appId: string) {
  return `/api/v1/mail/apps/${encodeURIComponent(appId)}/aliases`;
}

export async function listMailAliases(
  appId: string,
): Promise<MailAliasListResponse> {
  const response = await sessionFetch(aliasBase(appId));
  const data = await readJson<MailAliasListResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load aliases."));
  }
  return {
    domain: data.domain ?? null,
    limit: Number(data.limit) || 0,
    used: Number(data.used) || 0,
    aliases: data.aliases ?? [],
  };
}

export async function createMailAlias(
  appId: string,
  input: { localPart: string; mailboxId: string },
): Promise<MailAliasView> {
  const response = await sessionFetch(aliasBase(appId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ alias?: MailAliasView }>(response);
  if (!response.ok || !data.alias) {
    throw new Error(errorMessage(data, "Could not create alias."));
  }
  return data.alias;
}

export async function updateMailAlias(
  appId: string,
  aliasId: string,
  input: { enabled?: boolean; mailboxId?: string },
): Promise<MailAliasView> {
  const response = await sessionFetch(
    `${aliasBase(appId)}/${encodeURIComponent(aliasId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await readJson<{ alias?: MailAliasView }>(response);
  if (!response.ok || !data.alias) {
    throw new Error(errorMessage(data, "Could not update alias."));
  }
  return data.alias;
}

export async function deleteMailAlias(
  appId: string,
  aliasId: string,
): Promise<void> {
  const response = await sessionFetch(
    `${aliasBase(appId)}/${encodeURIComponent(aliasId)}`,
    { method: "DELETE" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not delete alias."));
  }
}
