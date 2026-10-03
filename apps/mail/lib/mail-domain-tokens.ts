import {
  buildDnsRecords,
  syncMailDomainRecords,
  type MailDomainSetup,
} from "@/lib/mail-domain";

/** Compare DKIM token sets regardless of order. */
export function dkimTokensMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].map((t) => t.trim()).filter(Boolean).sort();
  const right = [...b].map((t) => t.trim()).filter(Boolean).sort();
  return left.every((token, index) => token === right[index]);
}

/**
 * Rebuild DNS rows from live SES DKIM tokens.
 * Preserves per-record verification status when record ids are unchanged.
 */
export function applySesDkimTokens(
  setup: MailDomainSetup,
  tokens: string[],
): MailDomainSetup {
  const fresh = tokens.map((t) => t.trim()).filter(Boolean);
  if (!fresh.length) return syncMailDomainRecords(setup);

  const previous = new Map(setup.records.map((record) => [record.id, record.status]));
  const records = buildDnsRecords(setup.domain, fresh).map((record) => ({
    ...record,
    status: previous.get(record.id) ?? record.status,
  }));

  return syncMailDomainRecords({
    ...setup,
    dkimTokens: fresh,
    records,
  });
}

/** Prefer live SES tokens; fall back to cached tokens only when SES is unreachable. */
export function resolveDkimTokens(
  sesTokens: string[],
  cachedTokens: string[] = [],
): string[] {
  if (sesTokens.length > 0) return sesTokens;
  return cachedTokens.filter(Boolean);
}
