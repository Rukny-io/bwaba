import type { ReactNode } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { HqSidebar } from '@/components/layout/hq-sidebar';
import { HqShell } from '@/components/layout/hq-shell';
import { HqMobileDock } from '@/components/layout/hq-mobile-dock';
import { DashboardNav } from '@/components/app/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getDashboardUser();
  const displayName = user.name ?? user.username ?? user.email;

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      <div className="flex min-h-0 flex-1">
        <HqSidebar avatarUrl={user.avatar} userName={displayName} />

        <div className="relative flex min-w-0 flex-1 flex-col sm:ml-[82px]">
          <DashboardNav />
          <HqShell>{children}</HqShell>
          <HqMobileDock />
        </div>
      </div>
    </div>
  );
}
