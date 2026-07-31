import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DashboardSurfacePadding = 'none' | 'sm' | 'md';

const paddingClasses: Record<DashboardSurfacePadding, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
};

interface DashboardSurfaceProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  padding?: DashboardSurfacePadding;
  interactive?: boolean;
}

export function DashboardSurface({
  as: Component = 'div',
  children,
  className,
  padding = 'md',
  interactive = false,
}: DashboardSurfaceProps) {
  return (
    <Component
      className={cn(
        'dashboard-card rounded-2xl sm:rounded-3xl',
        paddingClasses[padding],
        interactive && 'dashboard-card-interactive',
        className,
      )}
    >
      {children}
    </Component>
  );
}
