'use client';

import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormCreateReadinessProps {
  hasTitle: boolean;
  fieldCount: number;
  className?: string;
}

function ReadinessItem({
  done,
  label,
}: {
  done: boolean;
  label: string;
}) {
  return (
    <li
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs',
        done ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]',
      )}
    >
      {done ? (
        <Check className="size-3 shrink-0 sm:size-3.5" strokeWidth={2.5} />
      ) : (
        <Circle
          className="size-3 shrink-0 opacity-50 sm:size-3.5"
          strokeWidth={1.8}
        />
      )}
      <span className="truncate">{label}</span>
    </li>
  );
}

export function FormCreateReadiness({
  hasTitle,
  fieldCount,
  className,
}: FormCreateReadinessProps) {
  const hasFields = fieldCount > 0;
  const ready = hasTitle && hasFields;

  if (ready) return null;

  return (
    <aside
      className={cn(
        'rounded-xl border border-[var(--border)]/70 bg-[var(--surface-secondary)]/30 px-3 py-2.5',
        'sm:rounded-2xl sm:px-4 sm:py-3',
        className,
      )}
      aria-label="جاهزية النشر"
    >
      <div className="flex flex-col gap-2 sm:gap-0">
        <p className="text-[11px] font-semibold text-[var(--foreground)] sm:mb-2 sm:text-xs">
          قبل النشر
        </p>
        <ul className="grid grid-cols-1 gap-1 sm:space-y-1.5">
          <ReadinessItem done={hasTitle} label="أضف عنواناً للنموذج" />
          <ReadinessItem
            done={hasFields}
            label="أضف حقلاً واحداً على الأقل"
          />
        </ul>
      </div>
    </aside>
  );
}
