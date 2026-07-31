import type { ReactNode } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { HqSidebar } from '@/components/layout/hq-sidebar';
import { HqShell } from '@/components/layout/hq-shell';
import { HqMobileDock } from '@/components/layout/hq-mobile-dock';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getDashboardUser();

  return (
    <div className="flex h-dvh bg-[var(--background)]">
      <HqSidebar
        avatarUrl={user.avatar}
        userName={user.name ?? user.username ?? user.email}
      />

      <div className="flex min-w-0 flex-1 flex-col sm:m-2 sm:ml-[82px] sm:gap-2">
        <HqShell userName={user.name ?? user.username}>
          {children}
        </HqShell>
        <HqMobileDock />
      </div>
    </div>
  );
}
