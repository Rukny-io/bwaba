'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationsFeed } from '@/components/notifications/notifications-feed';
import {
  markDesktopNotificationsIntent,
  useFormsDashboard,
} from '@/components/app/forms-dashboard-context';
import { APP_BASE } from '@/components/app/nav-config';

/** Full-screen notifications — mobile/tablet only. Desktop opens slide-in panel. */
export function NotificationsMobilePage() {
  const router = useRouter();
  const { openDesktopNotifications } = useFormsDashboard();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (!isDesktop) return;

    redirectedRef.current = true;
    markDesktopNotificationsIntent();
    openDesktopNotifications();
    router.replace(APP_BASE, { scroll: false });
  }, [router, openDesktopNotifications]);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:hidden">
      <NotificationsFeed fullPage className="min-h-0 flex-1" />
    </div>
  );
}
