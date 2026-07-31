export function formatIqd(
  amount: number,
  currencyLabel = 'IQD',
): string {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)} ${currencyLabel}`;
}
