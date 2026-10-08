import {
  OWNERSHIP_TXT_HOST,
  buildOwnershipTxtValue,
} from "./ownership";
import type { DnsRecord, SesDnsConfig } from "./types";

export const DEFAULT_SES_DNS_CONFIG: SesDnsConfig = {
  region: "eu-north-1",
  inboundMx: "inbound-smtp.eu-north-1.amazonaws.com",
  mailFromMx: "feedback-smtp.eu-north-1.amazonses.com",
  dkimTargetSuffix: "dkim.amazonses.com",
  spfInclude: "amazonses.com",
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

export function buildDnsRecords(
  domain: string,
  dkimTokens: string[] = [],
  ownershipToken?: string,
  sesConfig: SesDnsConfig = DEFAULT_SES_DNS_CONFIG,
): DnsRecord[] {
  const tokens = dkimTokens.filter(Boolean);
  const records: DnsRecord[] = [];

  if (ownershipToken) {
    records.push({
      id: "rukny-ownership",
      purpose: "RUKNY_OWNERSHIP",
      type: "TXT",
      host: OWNERSHIP_TXT_HOST,
      value: buildOwnershipTxtValue(ownershipToken),
      status: "pending",
      hint: "Proves you control this domain for your workspace. Required before activation.",
    });
  }

  records.push(
    {
      id: "mx",
      purpose: "MX",
      type: "MX",
      host: "@",
      value: sesConfig.inboundMx,
      priority: 10,
      status: "pending",
      hint: "Receiving. Keep DNS only (not proxied) at Cloudflare.",
    },
    {
      id: "spf",
      purpose: "SPF",
      type: "TXT",
      host: "@",
      value: `v=spf1 include:${sesConfig.spfInclude} ~all`,
      status: "pending",
      hint: "Merge with an existing SPF record instead of adding a second TXT SPF.",
    },
    ...tokens.map((token, index) => ({
      id: `dkim-${index + 1}`,
      purpose: "DKIM" as const,
      type: "CNAME" as const,
      host: `${token}._domainkey`,
      value: `${token}.${sesConfig.dkimTargetSuffix}`,
      status: "pending" as const,
      hint: "Easy DKIM for SES. DNS only, not proxied.",
    })),
    {
      id: "dmarc",
      purpose: "DMARC",
      type: "TXT",
      host: "_dmarc",
      value: "v=DMARC1; p=none;",
      status: "pending",
      hint: "Start with p=none. For BIMI, later raise to p=quarantine then p=reject (pct=100).",
    },
    {
      id: "mail-from-mx",
      purpose: "MAIL_FROM_MX",
      type: "MX",
      host: "mail",
      value: sesConfig.mailFromMx,
      priority: 10,
      status: "pending",
      hint: "Custom MAIL FROM so SPF aligns with your domain.",
    },
    {
      id: "mail-from-spf",
      purpose: "MAIL_FROM_SPF",
      type: "TXT",
      host: "mail",
      value: `v=spf1 include:${sesConfig.spfInclude} ~all`,
      status: "pending",
      hint: "SPF for the MAIL FROM subdomain.",
    },
  );

  return records;
}
