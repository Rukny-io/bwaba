import type { ReactNode } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { HqSidebar } from '@/components/layout/hq-sidebar';
import { HqShell } from '@/components/layout/hq-shell';

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

      <div className="flex min-w-0 flex-1 gap-2 p-2 sm:m-2 sm:ml-[82px]">
        <HqShell userName={user.name ?? user.username}>
          {children}
        </HqShell>
      </div>
    </div>
  );
}
