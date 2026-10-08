import {
  DEFAULT_LOCALE,
  toIntlLocale,
  type AppLocale,
} from '@/lib/i18n/config';
import { getMessage } from '@/lib/i18n/get-message';
import { getMessages } from '@/lib/i18n/messages';

export const NUMBER_LOCALE = 'en-US';
export const DATE_LOCALE = 'en-GB';

function resolveLocale(locale?: AppLocale): AppLocale {
  return locale ?? DEFAULT_LOCALE;
}

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

export function formatNumber(value: number, locale?: AppLocale): string {
  return new Intl.NumberFormat(
    locale ? toIntlLocale(locale) : NUMBER_LOCALE,
  ).format(value);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatTrendBadge(value?: number | null): string | undefined {
  if (value == null || value === 0) return undefined;
  return `${value >= 0 ? '+' : ''}${value}%`;
}

export function formatCurrency(
  value: number,
  currency = 'IQD',
  locale?: AppLocale,
): string {
  const resolved = resolveLocale(locale);
  if (currency === 'IQD') {
    const suffix = getMessages(resolved).common.currencyIqd;
    return `${formatNumber(Math.round(value), resolved)} ${suffix}`;
  }
  return new Intl.NumberFormat(toIntlLocale(resolved), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
  locale?: AppLocale,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(
    locale ? toIntlLocale(locale) : DATE_LOCALE,
    options,
  ).format(date);
}

export function formatShortDate(dateStr: string, locale?: AppLocale): string {
  return formatDate(dateStr, { month: 'short', day: 'numeric' }, locale);
}

export function formatIsoDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate());

  return `${year}-${month}-${day}`;
}

export function formatRelativeTime(dateStr: string, locale?: AppLocale): string {
  const resolved = resolveLocale(locale);
  const messages = getMessages(resolved);
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return messages.common.now;
  if (minutes < 60) {
    return getMessage(messages, 'common.minutesAgo', {
      n: formatNumber(minutes, resolved),
    });
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return getMessage(messages, 'common.hoursAgo', {
      n: formatNumber(hours, resolved),
    });
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return getMessage(messages, 'common.daysAgo', {
      n: formatNumber(days, resolved),
    });
  }
  return formatShortDate(dateStr, resolved);
}
