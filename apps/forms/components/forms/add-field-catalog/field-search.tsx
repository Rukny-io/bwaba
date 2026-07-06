'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function FieldSearch({ value, onChange }: FieldSearchProps) {
  return (
    <div
      className={cn(
        'flex h-11 items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 transition-colors duration-150',
        'focus-within:bg-[var(--surface-secondary)]/80 focus-within:ring-2 focus-within:ring-[var(--foreground)]/8',
      )}
    >
      <Search className="size-4 shrink-0 text-[var(--muted-foreground)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ابحث عن نوع الحقل"
        className="w-full bg-transparent text-right text-[14px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
        dir="rtl"
        inputMode="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-all hover:bg-black/5 hover:text-[var(--foreground)] active:scale-90 dark:hover:bg-white/10"
          aria-label="مسح البحث"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
