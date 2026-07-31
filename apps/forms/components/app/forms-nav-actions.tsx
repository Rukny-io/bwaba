'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useOptionalFormsDashboard } from '@/components/app/forms-dashboard-context';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { formsNavGlassClass } from '@/components/app/nav-glass';
import { APP_BASE } from '@/components/app/nav-config';
import { cn } from '@/lib/utils';

type NotificationsMode = 'dashboard' | 'standalone';

const NOTIFICATIONS_PATH = `${APP_BASE}/notifications`;

export function FormsNavActions({
  notificationsMode = 'dashboard',
  showNotifications = true,
  className,
}: {
  notificationsMode?: NotificationsMode;
  /** Hide bell on form creator routes */
  showNotifications?: boolean;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const dashboard = useOptionalFormsDashboard();
  const router = useRouter();
  const pathname = usePathname();
  const { count: unreadCount } = useUnreadNotificationCount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const isNotificationsPage = pathname === NOTIFICATIONS_PATH;

  function handleNotificationsClick() {
    if (!dashboard) return;

    const isDesktop =
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
      dashboard.toggleDesktopNotifications();
      return;
    }

    if (isNotificationsPage) {
      router.push(APP_BASE);
      return;
    }

    router.push(NOTIFICATIONS_PATH);
  }

  const notificationsActive =
    isNotificationsPage || (dashboard?.desktopNotificationsOpen ?? false);
  const badgeLabel =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5',
        formsNavGlassClass,
        className,
      )}
    >
      {showNotifications && dashboard ? (
        <>
          <button
            type="button"
            onClick={handleNotificationsClick}
            aria-label={
              unreadCount > 0
                ? `الإشعارات، ${unreadCount} غير مقروء`
                : 'الإشعارات'
            }
            aria-expanded={notificationsActive}
            aria-haspopup={isNotificationsPage ? undefined : 'dialog'}
            className={cn(
              'relative flex size-9 items-center justify-center rounded-full transition-colors sm:size-8',
              notificationsActive
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
            )}
          >
            <Bell className="size-[18px] sm:size-4" strokeWidth={1.75} />
            {badgeLabel && !notificationsActive ? (
              <span
                className="absolute -top-0.5 end-0 flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--danger)] px-1 py-px text-[10px] font-bold leading-none text-white ring-2 ring-[var(--surface)]"
                dir="ltr"
                lang="en"
              >
                {badgeLabel}
              </span>
            ) : null}
          </button>

          <div className="h-5 w-px bg-[var(--border)]/30" aria-hidden />
        </>
      ) : null}

      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
        aria-label="تبديل السمة"
      >
        {mounted ? (
          isDark ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )
        ) : (
          <span className="size-4" />
        )}
      </button>
    </div>
  );
}
