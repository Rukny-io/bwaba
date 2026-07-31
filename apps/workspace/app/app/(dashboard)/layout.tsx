import type { ReactNode } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { Sidebar } from '@/components/app/sidebar';
import { WorkspaceDashboardShell } from '@/components/app/workspace-dashboard-shell';
import { DashboardMobileDock } from '@/components/app/dashboard-mobile-dock';

export default async function AppDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getDashboardUser();

  return (
    <div dir="rtl" className="flex h-dvh bg-[var(--background)]">
      <Sidebar
        avatarUrl={user.avatar}
        userName={user.name ?? user.username ?? user.email}
      />

      <div className="flex min-w-0 flex-1 gap-2 p-2 sm:m-2 sm:ms-[82px]">
        <WorkspaceDashboardShell>{children}</WorkspaceDashboardShell>
      </div>

      <DashboardMobileDock />
    </div>
  );
}
