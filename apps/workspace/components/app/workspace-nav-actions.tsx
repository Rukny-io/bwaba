'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@heroui/react';
import { workspaceNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

export function WorkspaceNavActions({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5',
        workspaceNavGlassClass,
        className,
      )}
    >
      <Button
        variant="ghost"
        isIconOnly
        size="sm"
        aria-label="تبديل السمة"
        onPress={() => setTheme(isDark ? 'light' : 'dark')}
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
      </Button>
    </div>
  );
}
