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
        'flex items-center gap-2 text-xs',
        done ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]',
      )}
    >
      {done ? (
        <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
      ) : (
        <Circle className="size-3.5 shrink-0 opacity-50" strokeWidth={1.8} />
      )}
      {label}
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
        'rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-secondary)]/30 px-4 py-3',
        className,
      )}
      aria-label="جاهزية النشر"
    >
      <p className="mb-2 text-xs font-semibold text-[var(--foreground)]">
        قبل النشر
      </p>
      <ul className="space-y-1.5">
        <ReadinessItem done={hasTitle} label="أضف عنواناً للنموذج" />
        <ReadinessItem
          done={hasFields}
          label="أضف حقلاً واحداً على الأقل"
        />
      </ul>
    </aside>
  );
}
