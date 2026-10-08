export {
  DEFAULT_SES_DNS_CONFIG,
  buildDnsRecords,
  normalizeDomain,
  validateDomain,
} from "./domain";
export {
  OWNERSHIP_TXT_HOST,
  OWNERSHIP_VALUE_PREFIX,
  buildOwnershipTxtValue,
  generateOwnershipToken,
  ownershipTxtMatches,
} from "./ownership";
export { verifyDomainDns } from "./verify-dns";
export type { VerifyDomainDnsOptions } from "./verify-dns";
export type {
  DnsCheckResult,
  DnsRecord,
  DnsRecordPurpose,
  DnsRecordStatus,
  SesDnsConfig,
  SesDomainStatus,
} from "./types";
