const TIER_CONVERSATIONS: Record<string, number> = {
  TIER_50: 50,
  TIER_250: 250,
  TIER_1K: 1_000,
  TIER_10K: 10_000,
  TIER_100K: 100_000,
  TIER_UNLIMITED: Number.POSITIVE_INFINITY,
  UNLIMITED: Number.POSITIVE_INFINITY,
};

export function formatMessagingLimitTier(
  tier: string | null | undefined,
  labels: { perDay: string; unlimited: string },
): string | null {
  if (!tier?.trim()) return null;

  const key = tier.trim().toUpperCase();
  if (key === 'TIER_UNLIMITED' || key === 'UNLIMITED') {
    return labels.unlimited;
  }

  const conversations = TIER_CONVERSATIONS[key];
  if (conversations != null && Number.isFinite(conversations)) {
    const count = new Intl.NumberFormat('en-US').format(conversations);
    return `${count} ${labels.perDay}`;
  }

  const numeric = key.replace(/^TIER_/, '').replace(/K$/i, '000');
  if (/^\d+$/.test(numeric)) {
    const count = new Intl.NumberFormat('en-US').format(Number(numeric));
    return `${count} ${labels.perDay}`;
  }

  return tier;
}

export function isUnknownQualityRating(
  rating: string | null | undefined,
): boolean {
  const value = (rating || '').trim().toUpperCase();
  return !value || value === 'UNKNOWN';
}

export function formatQualityRatingLabel(
  rating: string | null | undefined,
  labels: { unknown: string },
): string {
  if (isUnknownQualityRating(rating)) {
    return labels.unknown;
  }
  return (rating || '').toUpperCase();
}

export function qualityRatingBadgeClass(
  rating: string | null | undefined,
): string {
  const value = (rating || '').toUpperCase();
  if (value === 'GREEN') {
    return 'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]';
  }
  if (value === 'YELLOW' || value === 'ORANGE') {
    return 'bg-[color-mix(in_srgb,var(--warning)_14%,var(--background))] text-[var(--warning)]';
  }
  if (value === 'RED') {
    return 'bg-[color-mix(in_srgb,var(--danger)_14%,var(--background))] text-[var(--danger)]';
  }
  return 'bg-[var(--surface)] text-[var(--muted-foreground)] ring-1 ring-[var(--border)]/50';
}
