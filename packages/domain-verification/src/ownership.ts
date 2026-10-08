export const OWNERSHIP_TXT_HOST = "_rukny-verify";
export const OWNERSHIP_VALUE_PREFIX = "rukny-domain-verification=";

/** Web Crypto keeps this module importable from browser bundles. */
export function generateOwnershipToken(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildOwnershipTxtValue(token: string): string {
  return `${OWNERSHIP_VALUE_PREFIX}${token}`;
}

export function ownershipTxtMatches(record: string, token: string): boolean {
  const expected = buildOwnershipTxtValue(token).toLowerCase();
  const current = record.trim().toLowerCase();
  return current === expected || current.includes(expected);
}
