/** Relative time in Arabic for integration sync timestamps */
export function formatRelativeTime(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;

  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'الآن';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} د`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} ي`;

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
