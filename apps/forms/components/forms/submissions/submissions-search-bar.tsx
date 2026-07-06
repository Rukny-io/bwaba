'use client';

import { Search, X } from 'lucide-react';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import { cn } from '@/lib/utils';

export function SubmissionsSearchBar({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy?: boolean;
}) {
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ابحث في الاستجابات (بريد، نص، معرّف…)"
          className={cn(
            fieldInputClass,
            'w-full py-2.5 ps-10 pe-10 text-sm',
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute end-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]"
            aria-label="مسح البحث"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="shrink-0 rounded-full bg-[var(--foreground)] px-4 py-2.5 text-xs font-medium text-[var(--background)] disabled:opacity-50"
      >
        {busy ? 'جاري البحث…' : 'بحث'}
      </button>
    </form>
  );
}
