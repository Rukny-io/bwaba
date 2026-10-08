import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const dashboardPageSectionClass =
  'dashboard-page mx-auto flex w-full min-w-0 max-w-[1040px] flex-col gap-4 sm:gap-6';

export const dashboardPagePanelClass =
  'flex min-w-0 flex-col rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5';

type DashboardPageFrameProps = {
  children: ReactNode;
  /** مساحة أوسع للصفحات ذات الجداول (الطلبات، إلخ) */
  wide?: boolean;
};

export function DashboardPageFrame({ children, wide = false }: DashboardPageFrameProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full min-w-0 px-4 pt-4 pb-24 sm:px-5 sm:pt-16 sm:pb-6 md:px-6',
        wide ? 'max-w-[90rem] md:px-5' : 'max-w-7xl',
      )}
    >
      {children}
    </div>
  );
}
