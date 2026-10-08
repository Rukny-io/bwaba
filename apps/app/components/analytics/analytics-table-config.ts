import { cn } from '@/lib/utils';

const rowHoverTd =
  'hover:[&_td]:bg-[color-mix(in_oklab,var(--surface-secondary)_48%,var(--surface))]';

export const analyticsTableChrome = {
  shell: 'relative isolate min-w-0 overflow-hidden rounded-2xl bg-transparent',
  scroll:
    'overflow-x-auto w-full overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
  table: 'w-full table-fixed border-collapse text-[13px] leading-snug',
  headRow: 'bg-[color-mix(in_oklab,var(--surface-secondary)_32%,transparent)]',
  bodyRow: cn(
    'group',
    rowHoverTd,
    'hover:bg-transparent dark:hover:bg-transparent',
    'not-in-data-[variant=card]:hover:!bg-transparent',
    'dark:not-in-data-[variant=card]:hover:!bg-transparent',
  ),
  headCell:
    'h-11 px-3 align-middle text-[11px] font-medium leading-none tracking-tight text-[var(--muted-foreground)]',
  bodyCell:
    'h-[45px] bg-transparent px-3 py-0 align-middle text-[var(--foreground)] group-hover:bg-[color-mix(in_oklab,var(--surface-secondary)_48%,var(--surface))]',
  numeric: 'tabular-nums',
} as const;

export function analyticsHeadClass(
  align: 'start' | 'center' | 'end',
  widthClass?: string,
) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'end' ? 'text-end' : 'text-start';
  return cn(analyticsTableChrome.headCell, alignClass, widthClass);
}

export function analyticsCellClass(
  align: 'start' | 'center' | 'end',
  widthClass?: string,
) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'end' ? 'text-end' : 'text-start';
  return cn(analyticsTableChrome.bodyCell, alignClass, widthClass);
}
