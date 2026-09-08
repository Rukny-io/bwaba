function browserFlag(value: string | undefined): boolean {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return process.env.NODE_ENV !== "production";
}

export const hqMailFeatureFlags = {
  ruknyVerification: browserFlag(
    process.env.NEXT_PUBLIC_MAIL_RUKNY_DOMAIN_VERIFICATION_ENABLED,
  ),
} as const;
