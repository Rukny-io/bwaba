import type { ReactNode } from 'react';

export function DashboardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {children}
    </div>
  );
}
