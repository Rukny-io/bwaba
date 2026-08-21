import { promises as dns } from "node:dns";
import type { DnsRecordStatus, MailDnsRecord } from "@/lib/mail-domain";
import { buildDnsRecords, normalizeDomain, validateDomain } from "@/lib/mail-domain";
import { getSesDomainStatus } from "@/lib/ses-admin";

export type DnsCheckResult = {
  id: string;
  status: DnsRecordStatus;
};

function fqdn(host: string, domain: string) {
  if (host === "@") return domain;
  return `${host}.${domain}`;
}

function clean(value: string) {
  return value.replace(/\.$/, "").trim().toLowerCase();
}

function flattenTxt(chunks: string[][]) {
  return chunks.map((parts) => parts.join(""));
}

async function lookupMx(name: string) {
  try {
    return await dns.resolveMx(name);
  } catch {
    return [];
  }
}

async function lookupTxt(name: string) {
  try {
    return flattenTxt(await dns.resolveTxt(name));
  } catch {
    return [];
  }
}

async function lookupCname(name: string) {
  try {
    return (await dns.resolveCname(name)).map(clean);
  } catch {
    return [];
  }
}

async function checkRecord(domain: string, record: MailDnsRecord): Promise<DnsRecordStatus> {
  const name = fqdn(record.host, domain);

  if (record.type === "MX") {
    const rows = await lookupMx(name);
    const expected = clean(record.value);
    return rows.some((row) => clean(row.exchange) === expected) ? "verified" : "failed";
  }

  if (record.type === "CNAME") {
    const rows = await lookupCname(name);
    return rows.includes(clean(record.value)) ? "verified" : "failed";
  }

  const txt = await lookupTxt(name);
  const expected = record.value.toLowerCase();
  const matched = txt.some((value) => {
    const current = value.toLowerCase();
    if (record.purpose === "SPF" || record.purpose === "MAIL_FROM_SPF") {
      return current.includes("v=spf1") && current.includes("amazonses.com");
    }
    if (record.purpose === "DMARC") {
      return current.includes("v=dmarc1");
    }
    return current === expected || current.includes(expected);
  });
  return matched ? "verified" : "failed";
}

export async function verifyDomainDns(rawDomain: string, dkimTokens: string[] = []) {
  const domain = normalizeDomain(rawDomain);
  const error = validateDomain(domain);
  if (error) {
    return { ok: false as const, error, domain, results: [] as DnsCheckResult[] };
  }

  let ses = { found: false, sending: false, dkim: "NOT_STARTED", tokens: [] as string[] };
  try {
    ses = await getSesDomainStatus(domain);
  } catch {
    ses = { found: false, sending: false, dkim: "NOT_STARTED", tokens: [] };
  }
  const tokens = ses.tokens.length > 0 ? ses.tokens : dkimTokens;
  const records = buildDnsRecords(domain, tokens);
  const results: DnsCheckResult[] = [];

  for (const record of records) {
    results.push({
      id: record.id,
      status: await checkRecord(domain, record),
    });
  }

  const dnsVerified = results.length > 0 && results.every((item) => item.status === "verified");
  const sesReady = ses.found && ses.sending && ses.dkim === "SUCCESS";
  const verified = dnsVerified && sesReady;
  const waiting = dnsVerified && !sesReady;

  return {
    ok: true as const,
    domain,
    verified,
    waiting,
    results,
    ses,
    records,
  };
}
