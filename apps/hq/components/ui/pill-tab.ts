import { cn } from '@/lib/utils';

export const pillTabGroupClassName =
  'flex flex-wrap items-center justify-center gap-2';

export function pillTabClassName(active: boolean, className?: string) {
  return cn(
    'rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 sm:text-sm',
    active
      ? 'bg-[var(--foreground)] text-[var(--background)]'
      : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--foreground)]/25 hover:bg-[var(--surface-secondary)]',
    className,
  );
}

export const workspaceTabGroupClassName = cn(
  pillTabGroupClassName,
  'w-full gap-2 sm:gap-2.5',
);

export function workspaceTabClassName(active: boolean, className?: string) {
  return pillTabClassName(
    active,
    cn(
      'inline-flex min-w-[6.75rem] items-center justify-center gap-2 px-4 py-2.5 text-sm sm:min-w-[7.5rem] sm:px-5',
      className,
    ),
  );
}

export const detailPanelClassName =
  'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5';
