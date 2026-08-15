export const NUMBER_LOCALE = 'en-US';

const numberFormatter = new Intl.NumberFormat(NUMBER_LOCALE);

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}
