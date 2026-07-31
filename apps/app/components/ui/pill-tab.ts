import { cn } from '@/lib/utils';

export const pillTabGroupClassName = 'flex flex-wrap justify-center gap-2';

export function pillTabClassName(active: boolean, className?: string) {
  return cn(
    'rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm',
    active
      ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
      : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--foreground)]/20 hover:bg-[var(--surface-secondary)]',
    className,
  );
}
