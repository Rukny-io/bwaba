'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkSearchProps {
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'panel';
}

export function LinkSearch({ value, onChange, variant = 'default' }: LinkSearchProps) {
  const isPanel = variant === 'panel';

  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-[var(--surface-secondary)] transition-colors duration-150',
        'focus-within:ring-2 focus-within:ring-[var(--foreground)]/8',
        isPanel
          ? 'h-9 rounded-lg px-3 focus-within:bg-[var(--surface-secondary)]'
          : 'h-11 rounded-full px-4 focus-within:bg-[var(--surface-secondary)]/80',
      )}
    >
      <Search
        className={cn(
          'shrink-0 text-[var(--muted-foreground)]',
          isPanel ? 'size-3.5' : 'size-4',
        )}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isPanel ? 'بحث في الأنواع…' : 'الصق أو ابحث عن رابط'}
        className={cn(
          'w-full bg-transparent text-right text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]',
          isPanel ? 'text-[12px]' : 'text-[14px]',
        )}
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
