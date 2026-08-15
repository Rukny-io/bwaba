import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { getDashboardUser } from '@/lib/dal';
import { BusinessSidebar } from '@/components/layout/business-sidebar';
import { BusinessDashboardChrome } from '@/components/layout/business-dashboard-chrome';
import { BusinessHeaderTopBar } from '@/components/layout/business-header-top-bar';
import { BusinessDashboardShell } from '@/components/app/business-dashboard-shell';
import { BusinessMobileDock } from '@/components/layout/business-mobile-dock';

export default async function AppDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getDashboardUser();
  const displayName = user.name ?? user.username ?? user.email;

  return (
    <div dir="rtl" className="flex h-dvh flex-col bg-[var(--background)] dir-rtl">
      <BusinessDashboardChrome
        sidebar={
          <BusinessSidebar avatarUrl={user.avatar} userName={displayName} />
        }
      >
        <Suspense fallback={null}>
          <BusinessHeaderTopBar avatarUrl={user.avatar} userName={displayName} />
        </Suspense>
        <BusinessDashboardShell>{children}</BusinessDashboardShell>
        <BusinessMobileDock />
      </BusinessDashboardChrome>
    </div>
  );
}
