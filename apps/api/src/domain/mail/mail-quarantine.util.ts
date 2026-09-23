export const DEFAULT_QUARANTINE_RETENTION_DAYS = 30;

export function quarantineExpiresAt(
  retentionDays: number,
  from = new Date(),
): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    return null;
  }
  const expires = new Date(from);
  expires.setDate(expires.getDate() + Math.floor(retentionDays));
  return expires;
}
