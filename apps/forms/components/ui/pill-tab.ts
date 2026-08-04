import { cn } from '@/lib/utils';

export const pillTabGroupClassName =
  'flex flex-wrap justify-center gap-2';

export function pillTabClassName(active: boolean, className?: string) {
  return cn(
    'rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm',
    active
      ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
      : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--foreground)]/20 hover:bg-[var(--surface-secondary)]',
    className,
  );
}

/** Primary section tabs (form workspace: إعدادات · استجابات · تحليلات · تكاملات) */
export const formWorkspaceTabGroupClassName = cn(
  pillTabGroupClassName,
  'w-full gap-2 sm:gap-2.5',
);

export function formWorkspaceTabClassName(active: boolean, className?: string) {
  return pillTabClassName(
    active,
    cn(
      'inline-flex min-w-[6.75rem] items-center justify-center gap-2 px-4 py-2.5 text-sm sm:min-w-[7.5rem] sm:px-5',
      className,
    ),
  );
}
