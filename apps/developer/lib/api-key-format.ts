export function formatApiKeyDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatApiKeyNumber(value: number | string | undefined): string {
  return new Intl.NumberFormat('en-US').format(Number(value ?? 0));
}

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

export function isValidIpAddress(value: string): boolean {
  return IPV4_PATTERN.test(value.trim());
}
