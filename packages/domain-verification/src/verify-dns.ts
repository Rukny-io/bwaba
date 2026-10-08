import { promises as dns } from "node:dns";
import { buildDnsRecords, normalizeDomain, validateDomain } from "./domain";
import { ownershipTxtMatches } from "./ownership";
import type {
  DnsCheckResult,
  DnsRecord,
  SesDnsConfig,
  SesDomainStatus,
} from "./types";

export type VerifyDomainDnsOptions = {
  dkimTokens?: string[];
  ownershipToken?: string;
  sesConfig?: SesDnsConfig;
  getSesStatus?: (domain: string) => Promise<SesDomainStatus>;
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

async function checkRecord(
  domain: string,
  record: DnsRecord,
  ownershipToken?: string,
): Promise<DnsCheckResult["status"]> {
  const name = fqdn(record.host, domain);

  if (record.type === "MX") {
    const rows = await lookupMx(name);
    const expected = clean(record.value);
    return rows.some((row: { exchange: string }) => clean(row.exchange) === expected)
      ? "verified"
      : "failed";
  }

  if (record.type === "CNAME") {
    const rows = await lookupCname(name);
    return rows.includes(clean(record.value)) ? "verified" : "failed";
  }

  const txt = await lookupTxt(name);
  const expected = record.value.toLowerCase();
  const matched = txt.some((value) => {
    const current = value.toLowerCase();
    if (record.purpose === "RUKNY_OWNERSHIP") {
      return ownershipToken
        ? ownershipTxtMatches(value, ownershipToken)
        : false;
    }
    if (record.purpose === "SPF" || record.purpose === "MAIL_FROM_SPF") {
      return current.includes("v=spf1") && current.includes("amazonses.com");
    }
    if (record.purpose === "DMARC") {
      return current.includes("v=dmarc1");
    }
    if (record.purpose === "BIMI") {
      return current.includes("v=bimi1") && current.includes(expected);
    }
    return current === expected || current.includes(expected);
  });
  return matched ? "verified" : "failed";
}

export async function verifyDomainDns(
  rawDomain: string,
  options: VerifyDomainDnsOptions = {},
) {
  const domain = normalizeDomain(rawDomain);
  const error = validateDomain(domain);
  if (error) {
    return { ok: false as const, error, domain, results: [] as DnsCheckResult[] };
  }

  const ownershipToken = options.ownershipToken?.trim();
  if (!ownershipToken) {
    return {
      ok: true as const,
      domain,
      verified: false,
      waiting: false,
      results: [] as DnsCheckResult[],
      ses: {
        found: false,
        sending: false,
        dkim: "NOT_STARTED",
        tokens: [],
      },
      records: buildDnsRecords(
        domain,
        options.dkimTokens ?? [],
        undefined,
        options.sesConfig,
      ),
      ownershipMissing: true,
    };
  }

  let ses: SesDomainStatus = {
    found: false,
    sending: false,
    dkim: "NOT_STARTED",
    tokens: [],
  };
  if (options.getSesStatus) {
    try {
      ses = await options.getSesStatus(domain);
    } catch {
      ses = { found: false, sending: false, dkim: "NOT_STARTED", tokens: [] };
    }
  }

  const tokens =
    ses.tokens.length > 0 ? ses.tokens : (options.dkimTokens ?? []);
  const records = buildDnsRecords(
    domain,
    tokens,
    ownershipToken,
    options.sesConfig,
  );
  const results: DnsCheckResult[] = [];

  for (const record of records) {
    results.push({
      id: record.id,
      status: await checkRecord(domain, record, ownershipToken),
    });
  }

  const dnsVerified =
    results.length > 0 && results.every((item) => item.status === "verified");
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
    ownershipMissing: false,
  };
}
