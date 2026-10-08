import { promises as dns } from "node:dns";
import {
  verifyDomainDns as verifyDomainDnsCore,
  type VerifyDomainDnsOptions,
} from "@rukny/domain-verification";
import type { DnsRecordStatus, MailDnsRecord } from "@/lib/mail-domain";
import { buildDnsRecords, normalizeDomain, validateDomain } from "@/lib/mail-domain";
import { getSesDomainStatus } from "@/lib/ses-admin";
import { MAIL_SES } from "@/lib/ses";

export type DnsCheckResult = {
  id: string;
  status: DnsRecordStatus;
};

function flattenTxt(chunks: string[][]) {
  return chunks.map((parts) => parts.join(""));
}

function tagValue(record: string, tag: string) {
  const entry = record
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.slice(0, part.indexOf("=")).trim().toLowerCase() === tag);
  return entry ? entry.slice(entry.indexOf("=") + 1).trim() : "";
}

async function lookupTxt(name: string) {
  try {
    return flattenTxt(await dns.resolveTxt(name));
  } catch {
    return [];
  }
}

export function inspectDmarcRecords(records: string[]) {
  const candidates = records.filter((record) => /^\s*v\s*=\s*DMARC1(?:\s*;|$)/i.test(record));
  if (candidates.length !== 1) {
    return { enforced: false, policy: null, percentage: null, record: null };
  }
  const record = candidates[0];
  const policy = tagValue(record, "p").toLowerCase();
  const parsedPercentage = Number.parseInt(tagValue(record, "pct") || "100", 10);
  const percentage = Number.isFinite(parsedPercentage) ? parsedPercentage : 0;
  return {
    enforced: (policy === "quarantine" || policy === "reject") && percentage === 100,
    policy,
    percentage,
    record,
  };
}

export async function verifyBimiDns(domain: string, expectedLogoUrl: string) {
  const dmarc = inspectDmarcRecords(await lookupTxt(`_dmarc.${domain}`));
  const records = await lookupTxt(`default._bimi.${domain}`);
  const candidates = records.filter((record) => /^\s*v\s*=\s*BIMI1(?:\s*;|$)/i.test(record));
  const record = candidates.length === 1 ? candidates[0] : null;
  return {
    dmarc,
    record,
    logoMatches: Boolean(record && tagValue(record, "l") === expectedLogoUrl),
  };
}

const sesDnsConfig = {
  region: MAIL_SES.region,
  inboundMx: MAIL_SES.inboundMx,
  mailFromMx: MAIL_SES.mailFromMx,
  dkimTargetSuffix: MAIL_SES.dkimTargetSuffix,
  spfInclude: MAIL_SES.spfInclude,
};

export async function verifyDomainDns(
  rawDomain: string,
  dkimTokens: string[] = [],
  ownershipToken?: string,
) {
  const domain = normalizeDomain(rawDomain);
  const error = validateDomain(domain);
  if (error) {
    return { ok: false as const, error, domain, results: [] as DnsCheckResult[] };
  }

  const options: VerifyDomainDnsOptions = {
    dkimTokens,
    ownershipToken,
    sesConfig: sesDnsConfig,
    getSesStatus: getSesDomainStatus,
  };
  const result = await verifyDomainDnsCore(domain, options);
  if (!result.ok) {
    return result;
  }

  const records: MailDnsRecord[] = result.records.map((record) => ({
    ...record,
    purpose: record.purpose as MailDnsRecord["purpose"],
  }));

  return {
    ...result,
    records:
      records.length > 0
        ? records
        : buildDnsRecords(domain, dkimTokens, ownershipToken),
  };
}
