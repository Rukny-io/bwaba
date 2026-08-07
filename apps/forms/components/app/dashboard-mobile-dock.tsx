'use client';

import { usePathname } from 'next/navigation';
import { MobileDock } from '@/components/app/mobile-dock';

const FORM_WORKSPACE_PATH = /^\/app\/forms\/[^/]+/;
const SETTINGS_PATH = /^\/app\/settings(?:\/|$)/;

export function DashboardMobileDock() {
  const pathname = usePathname();

  if (FORM_WORKSPACE_PATH.test(pathname) || SETTINGS_PATH.test(pathname)) {
    return null;
  }

  return <MobileDock />;
}
