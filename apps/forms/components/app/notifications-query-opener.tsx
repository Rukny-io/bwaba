'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useFormsDashboard } from '@/components/app/forms-dashboard-context';
import { APP_BASE } from '@/components/app/nav-config';

const NOTIFICATIONS_PATH = `${APP_BASE}/notifications`;

/** Opens notifications: popover on desktop, `/app/notifications` on mobile. */
export function NotificationsQueryOpener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { openDesktopNotifications } = useFormsDashboard();
  const handledRef = useRef(false);

  useEffect(() => {
    if (searchParams.get('notifications') !== '1') return;
    if (handledRef.current) return;
    handledRef.current = true;

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('notifications');
    const qs = params.toString();
    const cleanPath = qs ? `${pathname}?${qs}` : pathname;

    if (isDesktop) {
      window.history.replaceState(null, '', cleanPath);
      openDesktopNotifications();
      return;
    }

    router.replace(NOTIFICATIONS_PATH, { scroll: false });
  }, [pathname, router, searchParams, openDesktopNotifications]);

  return null;
}
