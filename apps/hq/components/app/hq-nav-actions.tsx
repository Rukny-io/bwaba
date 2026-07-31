'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { hqNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

const THEME_STORAGE_KEY = 'rukny-hq-theme';

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function HqNavActions({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark =
      stored === 'dark' ||
      (!stored && document.documentElement.classList.contains('dark'));
    setIsDark(prefersDark);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    setIsDark(next === 'dark');
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5',
        hqNavGlassClass,
        className,
      )}
    >
      <button
        type="button"
        onClick={toggleTheme}
        className="flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
        aria-label="Toggle theme"
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
