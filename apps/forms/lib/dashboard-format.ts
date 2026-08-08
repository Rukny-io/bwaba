/** Western digits and Gregorian dates across the forms app UI */
export const NUMBER_LOCALE = 'en-US';

const numberFormatter = new Intl.NumberFormat(NUMBER_LOCALE);

export function formatTrendPercent(
  current: number,
  previous: number,
): { label: string; positive: boolean } | null {
  if (current === 0 && previous === 0) return null;

  if (previous === 0) {
    if (current === 0) return null;
    return { label: '+100%', positive: true };
  }

  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct * 10) / 10;
  const label = `${rounded >= 0 ? '+' : ''}${rounded}%`;
  return { label, positive: rounded >= 0 };
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Card/list metrics — compact from 1M+ (e.g. ١٫٢ مليون) */
export function formatMetricCount(value: number): string {
  const n = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;

  if (n >= 1_000_000) {
    return new Intl.NumberFormat('ar', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: n >= 10_000_000 ? 0 : 1,
    }).format(n);
  }

  return n.toLocaleString('ar');
}

export function formatMetricCountFull(value: number): string {
  const n = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  return n.toLocaleString('ar');
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

/** Trend badge from a pre-calculated percent delta (e.g. API `viewsTrend`). */
export function formatTrendBadge(value?: number | null): string | undefined {
  if (value == null || value === 0) return undefined;
  return `${value >= 0 ? '+' : ''}${value}%`;
}
