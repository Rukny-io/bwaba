/**
 * Parse duration strings like 30m, 7d, 14d into seconds (for cookies / DB).
 */
export function parseDurationToSeconds(
  value: string | undefined,
  fallbackSeconds: number,
): number {
  if (!value?.trim()) return fallbackSeconds;

  const match = value.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackSeconds;

  const amount = Number.parseInt(match[1], 10);
  if (!Number.isFinite(amount) || amount <= 0) return fallbackSeconds;

  switch (match[2].toLowerCase()) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 24 * 60 * 60;
    default:
      return fallbackSeconds;
  }
}

/**
 * Parse duration strings into days (for refresh token DB expiry).
 */
export function parseDurationToDays(
  value: string | undefined,
  fallbackDays: number,
): number {
  if (!value?.trim()) return fallbackDays;

  const match = value.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackDays;

  const amount = Number.parseInt(match[1], 10);
  if (!Number.isFinite(amount) || amount <= 0) return fallbackDays;

  switch (match[2].toLowerCase()) {
    case 's':
      return Math.max(1, Math.ceil(amount / 86400));
    case 'm':
      return Math.max(1, Math.ceil(amount / 1440));
    case 'h':
      return Math.max(1, Math.ceil(amount / 24));
    case 'd':
      return amount;
    default:
      return fallbackDays;
  }
}
