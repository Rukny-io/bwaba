import {
  buildDnsRecords as buildDnsRecordsCore,
  buildOwnershipTxtValue,
  OWNERSHIP_TXT_HOST,
} from "@rukny/domain-verification/records";
import { MAIL_SES } from "@/lib/ses";

export type MailDomainStatus =
  | "PENDING_DNS"
  | "VERIFYING"
  | "ACTIVE"
  | "FAILED";

export type DnsRecordStatus = "pending" | "checking" | "verified" | "failed";

export type MailDnsRecord = {
  id: string;
  purpose:
    | "MX"
    | "SPF"
    | "DKIM"
    | "DMARC"
    | "BIMI"
    | "MAIL_FROM_MX"
    | "MAIL_FROM_SPF"
    | "RUKNY_OWNERSHIP";
  type: "MX" | "TXT" | "CNAME";
  host: string;
  value: string;
  priority?: number;
  status: DnsRecordStatus;
  hint: string;
};

export type MailBimiSetupStatus = {
  domain: string;
  selector: "default";
  host: "default._bimi";
  logoUploaded: boolean;
  logoUrl: string;
  previewUrl: string;
  certificateUploaded: boolean;
  authorityUrl: string | null;
  dmarc: {
    status: "ENFORCED" | "NOT_ENFORCED" | "MISSING";
    policy: string | null;
    percentage: number | null;
    record: string | null;
    required: string;
  };
  bimi: {
    status: "VERIFIED" | "MISMATCH" | "INVALID" | "MISSING";
    expectedRecord: string;
    observedRecord: string | null;
    authorityUrl: string | null;
  };
  ready: boolean;
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
  if (
    !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      domain,
    )
  ) {
    return "Use a valid domain such as example.com.";
  }
  return null;
}

const sesDnsConfig = {
  region: MAIL_SES.region,
  inboundMx: MAIL_SES.inboundMx,
  mailFromMx: MAIL_SES.mailFromMx,
  dkimTargetSuffix: MAIL_SES.dkimTargetSuffix,
  spfInclude: MAIL_SES.spfInclude,
};

export function buildDnsRecords(
  domain: string,
  dkimTokens: string[] = [],
  ownershipToken?: string,
): MailDnsRecord[] {
  return buildDnsRecordsCore(
    domain,
    dkimTokens,
    ownershipToken,
    sesDnsConfig,
  ).map((record) => ({
    ...record,
    purpose: record.purpose as MailDnsRecord["purpose"],
    hint:
      record.purpose === "RUKNY_OWNERSHIP"
        ? "Required for ownership. Proves you control this domain for your workspace."
        : record.hint,
  }));
}

export { OWNERSHIP_TXT_HOST, buildOwnershipTxtValue };

export function createMailDomainSetup(
  domain: string,
  dkimTokens: string[] = [],
  ownershipToken?: string,
): MailDomainSetup {
  return {
    domain,
    mailFromHost: `mail.${domain}`,
    status: "PENDING_DNS",
    records: buildDnsRecords(domain, dkimTokens, ownershipToken),
    dkimTokens,
    lastCheckedAt: null,
    createdAt: new Date().toISOString(),
  };
}

/** Keep stored setups aligned with the latest DNS template (e.g. DMARC row). */
export function syncMailDomainRecords(setup: MailDomainSetup): MailDomainSetup {
  const fromRecords = setup.records
    .filter(
      (record) =>
        record.purpose === "DKIM" && record.host.includes("._domainkey"),
    )
    .map((record) => record.host.replace(/\._domainkey$/i, ""))
    .filter(Boolean);
  const tokens = (
    setup.dkimTokens?.length ? setup.dkimTokens : fromRecords
  ).filter(Boolean);
  const ownershipToken = setup.records
    .find((record) => record.purpose === "RUKNY_OWNERSHIP")
    ?.value.replace(/^rukny-domain-verification=/i, "");
  const template = buildDnsRecords(setup.domain, tokens, ownershipToken);
  const previous = new Map(setup.records.map((record) => [record.id, record]));
  return {
    ...setup,
    mailFromHost: `mail.${setup.domain}`,
    dkimTokens: tokens,
    records: template.map((record) => {
      const existing = previous.get(record.id);
      return existing
        ? {
            ...record,
            status: existing.status,
          }
        : record;
    }),
  };
}

/** Recommended DMARC when ready for BIMI / stronger protection. */
export function dmarcEnforcementValue() {
  return "v=DMARC1; p=quarantine; pct=100;";
}

export function buildBimiDnsRecord(
  logoUrl: string,
  authorityUrl?: string | null,
): MailDnsRecord {
  const authority = authorityUrl?.trim();
  return {
    id: "bimi",
    purpose: "BIMI",
    type: "TXT",
    host: "default._bimi",
    value: `v=BIMI1; l=${logoUrl};${authority ? ` a=${authority};` : ""}`,
    status: "pending",
    hint: "Publish only after DMARC enforces quarantine or reject at pct=100.",
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
  return record.priority != null
    ? `${record.priority} ${record.value}`
    : record.value;
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
export function recordsAsZoneFile(
  domain: string,
  records: MailDnsRecord[],
): string {
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
