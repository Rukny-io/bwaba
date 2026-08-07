import type { ReactNode } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { Sidebar } from '@/components/app/sidebar';
import { WorkspaceDashboardShell } from '@/components/app/workspace-dashboard-shell';

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
        userEmail={user.email}
      />

      <div className="flex min-w-0 flex-1 transition-[margin] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:m-2 sm:ms-[var(--dashboard-sidebar-gutter)]">
        <WorkspaceDashboardShell>{children}</WorkspaceDashboardShell>
      </div>
    </div>
  );
}
