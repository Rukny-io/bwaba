'use client';

import { ChevronDown } from 'lucide-react';

export function FormSectionTransition({
  fromIndex,
  toTitle,
}: {
  fromIndex: number;
  toTitle: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 text-xs text-[var(--muted-foreground)]">
      <span>بعد القسم {fromIndex + 1}</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)]/60 bg-[var(--surface-secondary)]/40 px-2.5 py-1">
        <span>الانتقال إلى</span>
        <ChevronDown className="size-3.5 opacity-70" />
        <span className="font-medium text-[var(--foreground)]">{toTitle || 'القسم التالي'}</span>
      </span>
    </div>
  );
}
