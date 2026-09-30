import type { ReactNode } from 'react';

export const dashboardPageSectionClass =
  'dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6';

export const dashboardPagePanelClass =
  'flex min-w-0 flex-col rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5';

export function DashboardPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 pt-4 pb-24 sm:px-5 sm:pt-16 sm:pb-6 md:px-6">
      {children}
    </div>
  );
}
