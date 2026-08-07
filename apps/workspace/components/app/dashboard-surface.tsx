import type { ReactNode } from 'react';
import { Surface } from '@heroui/react';
import { cn } from '@/lib/utils';

type DashboardSurfacePadding = 'none' | 'sm' | 'md';

const paddingClasses: Record<DashboardSurfacePadding, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
};

interface DashboardSurfaceProps {
  children: ReactNode;
  className?: string;
  padding?: DashboardSurfacePadding;
  interactive?: boolean;
}

export function DashboardSurface({
  children,
  className,
  padding = 'md',
  interactive = false,
}: DashboardSurfaceProps) {
  return (
    <Surface
      className={cn(
        'rounded-2xl sm:rounded-3xl border border-border',
        paddingClasses[padding],
        interactive && 'transition-colors hover:bg-surface-secondary',
        className,
      )}
    >
      {children}
    </Surface>
  );
}
