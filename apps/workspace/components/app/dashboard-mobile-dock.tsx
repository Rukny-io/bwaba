'use client';

import { usePathname } from 'next/navigation';
import { MobileDock } from '@/components/app/mobile-dock';

const COMPOSE_PATH = /^\/app\/mail\/compose(?:\/|$)/;
const SETTINGS_PATH = /^\/app\/settings(?:\/|$)/;

export function DashboardMobileDock() {
  const pathname = usePathname();

  if (COMPOSE_PATH.test(pathname) || SETTINGS_PATH.test(pathname)) {
    return null;
  }

  return <MobileDock />;
}
