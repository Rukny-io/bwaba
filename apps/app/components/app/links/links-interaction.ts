import { cn } from '@/lib/utils';

export const linksToolBtnClass = cn(
  'inline-flex items-center justify-center rounded-lg touch-manipulation select-none',
  'size-9 shrink-0 sm:size-8',
  'text-[var(--muted-foreground)]',
  'transition-[color,background-color,transform] duration-150 ease-out',
  'hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
  'active:scale-95 active:bg-[var(--surface-secondary)]',
  'disabled:pointer-events-none disabled:opacity-40',
);

export const linksPressableClass = cn(
  'touch-manipulation select-none',
  'transition-[transform,background-color,opacity] duration-150 ease-out',
  'active:scale-[0.98] active:bg-[var(--surface-secondary)]/70',
);

export const linksCardClass = cn(
  'touch-manipulation select-none',
  'transition-[border-color,background-color,opacity,transform,box-shadow] duration-200 ease-out',
);

export const linksActionButtonClass = cn(
  'touch-manipulation select-none',
  'transition-[transform,opacity,background-color] duration-150 ease-out',
  'active:scale-[0.97]',
);
