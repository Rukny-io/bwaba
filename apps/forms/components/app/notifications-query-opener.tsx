'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useFormsDashboard } from '@/components/app/forms-dashboard-context';

/** Opens the notifications panel when URL has ?notifications=1 (e.g. old /app/notifications redirect). */
export function NotificationsQueryOpener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleDesktopNotifications, toggleMobileNotifications } =
    useFormsDashboard();

  useEffect(() => {
    if (searchParams.get('notifications') !== '1') return;

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      toggleDesktopNotifications();
    } else {
      toggleMobileNotifications();
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('notifications');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    pathname,
    router,
    searchParams,
    toggleDesktopNotifications,
    toggleMobileNotifications,
  ]);

  return null;
}
