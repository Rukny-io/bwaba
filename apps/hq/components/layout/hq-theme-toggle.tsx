'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@heroui/react';
import { useHqTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export function HqThemeToggle({
  className,
  withLabel = false,
}: {
  className?: string;
  withLabel?: boolean;
}) {
  const { theme, toggleTheme } = useHqTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Light mode' : 'Dark mode';

  if (withLabel) {
    return (
      <Button
        variant="ghost"
        className={cn('justify-start gap-2.5', className)}
        onPress={toggleTheme}
      >
        {isDark ? (
          <Sun className="size-4 shrink-0" />
        ) : (
          <Moon className="size-4 shrink-0" />
        )}
        {label}
      </Button>
    );
  }

  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={label}
      className={className}
      onPress={toggleTheme}
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.7} />
      ) : (
        <Moon className="size-4" strokeWidth={1.7} />
      )}
    </Button>
  );
}
