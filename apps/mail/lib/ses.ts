export const MAIL_SES_REGION = "eu-north-1";

export const MAIL_SES = {
  region: MAIL_SES_REGION,
  regionLabel: "Europe (Stockholm)",
  inboundMx: `inbound-smtp.${MAIL_SES_REGION}.amazonaws.com`,
  mailFromMx: `feedback-smtp.${MAIL_SES_REGION}.amazonses.com`,
  dkimTargetSuffix: "dkim.amazonses.com",
  spfInclude: "amazonses.com",
} as const;

export const MAIL_READY_COOKIE = "rukny-mail-ready";
/** Survives logout — last bound domain for the account (restore hint). */
export const MAIL_BOUND_DOMAIN_COOKIE = "rukny_mail_bound_domain";
/** @deprecated cleared on logout; was developer-app scoped */
export const MAIL_READY_APP_COOKIE = "rukny-mail-ready-app";
/** @deprecated cleared on logout; was developer-app map */
export const MAIL_DOMAIN_MAP_COOKIE = "rukny_mail_domain_map";
export const MAIL_DOMAIN_STORAGE_KEY = "rukny-mail-domain-v1";
