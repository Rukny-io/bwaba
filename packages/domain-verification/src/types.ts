export type DnsRecordStatus = "pending" | "checking" | "verified" | "failed";

export type DnsRecordPurpose =
  | "MX"
  | "SPF"
  | "DKIM"
  | "DMARC"
  | "BIMI"
  | "MAIL_FROM_MX"
  | "MAIL_FROM_SPF"
  | "RUKNY_OWNERSHIP";

export type DnsRecord = {
  id: string;
  purpose: DnsRecordPurpose;
  type: "MX" | "TXT" | "CNAME";
  host: string;
  value: string;
  priority?: number;
  status: DnsRecordStatus;
  hint: string;
};

export type SesDnsConfig = {
  region: string;
  inboundMx: string;
  mailFromMx: string;
  dkimTargetSuffix: string;
  spfInclude: string;
};

export type SesDomainStatus = {
  found: boolean;
  sending: boolean;
  dkim: string;
  tokens: string[];
};

export type DnsCheckResult = {
  id: string;
  status: DnsRecordStatus;
};
