'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { appNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

export function AppNavActions({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5',
        appNavGlassClass,
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
        aria-label="تبديل السمة"
      >
        {mounted ? (
          isDark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )
        ) : (
          <span className="size-4" />
        )}
      </button>
    </div>
  );
}
