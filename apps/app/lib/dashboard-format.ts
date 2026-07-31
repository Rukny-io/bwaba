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
  return {
    label: `${rounded >= 0 ? '+' : ''}${rounded}%`,
    positive: rounded >= 0,
  };
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatTrendBadge(value?: number | null): string | undefined {
  if (value == null || value === 0) return undefined;
  return `${value >= 0 ? '+' : ''}${value}%`;
}

export function formatCurrency(value: number, currency = 'IQD'): string {
  if (currency === 'IQD') {
    return `${formatNumber(Math.round(value))} د.ع`;
  }
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ي`;
  return date.toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' });
}
