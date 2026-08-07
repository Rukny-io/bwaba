'use client';

import { ArrowDown } from 'lucide-react';

export function FormSectionTransition({
  fromIndex,
  toTitle,
}: {
  fromIndex: number;
  toTitle: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 sm:py-4">
      <span className="h-px w-8 bg-[var(--border)] sm:w-12" aria-hidden />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)]/80 px-3 py-1.5 text-[11px] text-[var(--muted-foreground)] sm:text-xs">
        <span>بعد القسم {fromIndex + 1}</span>
        <ArrowDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
        <span className="max-w-[10rem] truncate font-medium text-[var(--foreground)] sm:max-w-[14rem]">
          {toTitle || 'القسم التالي'}
        </span>
      </span>
      <span className="h-px w-8 bg-[var(--border)] sm:w-12" aria-hidden />
    </div>
  );
}
