'use client';

import { usePathname } from 'next/navigation';
import { DashboardTopTabs } from '@/components/app/dashboard-top-tabs';
import { APP_BASE } from '@/components/app/nav-config';

interface DashboardNavProps {
  avatarUrl?: string | null;
  userName?: string | null;
}

export function DashboardNav({
  avatarUrl,
  userName,
}: DashboardNavProps) {
  const pathname = usePathname();

  if (pathname === `${APP_BASE}/notifications`) {
    return null;
  }

  return (
    <DashboardTopTabs avatarUrl={avatarUrl} userName={userName} />
  );
}
