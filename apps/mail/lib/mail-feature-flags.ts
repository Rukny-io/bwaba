function browserFlag(value: string | undefined): boolean {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return process.env.NODE_ENV !== "production";
}

export const mailFeatureFlags = {
  showBimiLogos: browserFlag(process.env.NEXT_PUBLIC_MAIL_BIMI_LOGOS_ENABLED),
  ruknyVerification: browserFlag(
    process.env.NEXT_PUBLIC_MAIL_RUKNY_DOMAIN_VERIFICATION_ENABLED,
  ),
  outboundBimi: browserFlag(process.env.NEXT_PUBLIC_MAIL_OUTBOUND_BIMI_ENABLED),
} as const;
