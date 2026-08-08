'use client';

import { DashboardTopTabs } from '@/components/app/dashboard-top-tabs';

interface DashboardNavProps {
  avatarUrl?: string | null;
  userName?: string | null;
}

export function DashboardNav({
  avatarUrl,
  userName,
}: DashboardNavProps) {
  return (
    <DashboardTopTabs avatarUrl={avatarUrl} userName={userName} />
  );
}
