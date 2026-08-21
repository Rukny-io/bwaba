import { MAIL_SES } from "@/lib/ses";

export type MailDomainStatus = "PENDING_DNS" | "VERIFYING" | "ACTIVE" | "FAILED";

export type DnsRecordStatus = "pending" | "checking" | "verified" | "failed";

export type MailDnsRecord = {
  id: string;
  purpose: "MX" | "SPF" | "DKIM" | "DMARC" | "MAIL_FROM_MX" | "MAIL_FROM_SPF";
  type: "MX" | "TXT" | "CNAME";
  host: string;
  value: string;
  priority?: number;
  status: DnsRecordStatus;
  hint: string;
};

export type MailDomainSetup = {
  domain: string;
  mailFromHost: string;
  status: MailDomainStatus;
  records: MailDnsRecord[];
  dkimTokens: string[];
  lastCheckedAt: string | null;
  createdAt: string;
};

export function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/\.$/, "");
}

export function validateDomain(domain: string): string | null {
  if (!domain) return "Enter a domain you own.";
  if (domain.length > 253) return "Domain is too long.";
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
    return "Use a valid domain such as example.com.";
  }
  if (domain.endsWith(".rukny.io") || domain === "rukny.io") {
    return "Use your own domain, not a Rukny hostname.";
  }
  return null;
}

export function buildDnsRecords(domain: string, dkimTokens: string[] = []): MailDnsRecord[] {
  const tokens = dkimTokens.filter(Boolean);

  return [
    {
      id: "mx",
      purpose: "MX",
      type: "MX",
      host: "@",
      value: MAIL_SES.inboundMx,
      priority: 10,
      status: "pending",
      hint: "Receiving. Keep DNS only (not proxied) at Cloudflare.",
    },
    {
      id: "spf",
      purpose: "SPF",
      type: "TXT",
      host: "@",
      value: `v=spf1 include:${MAIL_SES.spfInclude} ~all`,
      status: "pending",
      hint: "Merge with an existing SPF record instead of adding a second TXT SPF.",
    },
    ...tokens.map((token, index) => ({
      id: `dkim-${index + 1}`,
      purpose: "DKIM" as const,
      type: "CNAME" as const,
      host: `${token}._domainkey`,
      value: `${token}.${MAIL_SES.dkimTargetSuffix}`,
      status: "pending" as const,
      hint: "Easy DKIM for SES in Stockholm. DNS only, not proxied.",
    })),
    {
      id: "dmarc",
      purpose: "DMARC",
      type: "TXT",
      host: "_dmarc",
      value: "v=DMARC1; p=none; rua=mailto:dmarc@rukny.io",
      status: "pending",
      hint: "Start with p=none, then tighten after mail is stable.",
    },
    {
      id: "mail-from-mx",
      purpose: "MAIL_FROM_MX",
      type: "MX",
      host: "mail",
      value: MAIL_SES.mailFromMx,
      priority: 10,
      status: "pending",
      hint: "Custom MAIL FROM so SPF aligns with your domain.",
    },
    {
      id: "mail-from-spf",
      purpose: "MAIL_FROM_SPF",
      type: "TXT",
      host: "mail",
      value: `v=spf1 include:${MAIL_SES.spfInclude} ~all`,
      status: "pending",
      hint: "SPF for the MAIL FROM subdomain.",
    },
  ];
}

export function createMailDomainSetup(domain: string, dkimTokens: string[] = []): MailDomainSetup {
  return {
    domain,
    mailFromHost: `mail.${domain}`,
    status: "PENDING_DNS",
    records: buildDnsRecords(domain, dkimTokens),
    dkimTokens,
    lastCheckedAt: null,
    createdAt: new Date().toISOString(),
  };
}

export function applyDnsCheckResults(
  setup: MailDomainSetup,
  results: { id: string; status: DnsRecordStatus }[],
  verified: boolean,
  waiting = false,
): MailDomainSetup {
  const byId = new Map(results.map((item) => [item.id, item.status]));
  return {
    ...setup,
    status: verified ? "ACTIVE" : waiting ? "PENDING_DNS" : "FAILED",
    lastCheckedAt: new Date().toISOString(),
    records: setup.records.map((record) => ({
      ...record,
      status: byId.get(record.id) ?? "failed",
    })),
    dkimTokens: setup.dkimTokens ?? [],
  };
}

export function recordContent(record: MailDnsRecord): string {
  return record.priority != null ? `${record.priority} ${record.value}` : record.value;
}

export function recordsAsPlainText(records: MailDnsRecord[]): string {
  const header = "Type\tHost\tPriority\tValue";
  const rows = records.map((record) =>
    [record.type, record.host, record.priority ?? "", record.value].join("\t"),
  );
  return [header, ...rows].join("\n");
}

function fqdnName(host: string, domain: string): string {
  if (host === "@") return `${domain}.`;
  if (host.endsWith(".")) return host;
  return `${host}.${domain}.`;
}

function fqdnTarget(value: string): string {
  return value.endsWith(".") ? value : `${value}.`;
}

/** BIND zone file for Cloudflare DNS → Import and Export (not CSV). */
export function recordsAsZoneFile(domain: string, records: MailDnsRecord[]): string {
  const lines = records.map((record) => {
    const name = fqdnName(record.host, domain);
    if (record.type === "MX") {
      return `${name} 3600 IN MX ${record.priority ?? 10} ${fqdnTarget(record.value)}`;
    }
    if (record.type === "CNAME") {
      return `${name} 3600 IN CNAME ${fqdnTarget(record.value)}`;
    }
    return `${name} 3600 IN TXT "${record.value}"`;
  });
  return `${lines.join("\n")}\n`;
}
