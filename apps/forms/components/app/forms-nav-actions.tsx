'use client';

import { useEffect, useState } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useOptionalFormsDashboard } from '@/components/app/forms-dashboard-context';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { formsNavGlassClass } from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

type NotificationsMode = 'dashboard' | 'standalone';

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
  const { count: unreadCount } = useUnreadNotificationCount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  function handleNotificationsClick() {
    if (!dashboard) return;

    if (notificationsMode === 'standalone') {
      dashboard.toggleMobileNotifications();
      return;
    }

    const isDesktop =
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
      dashboard.toggleDesktopNotifications();
    } else {
      dashboard.toggleMobileNotifications();
    }
  }

  const notificationsActive = dashboard?.notificationsActive ?? false;

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
            aria-label="الإشعارات"
            aria-pressed={notificationsActive}
            className={cn(
              'relative flex size-8 items-center justify-center rounded-full transition-colors',
              notificationsActive
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
            )}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && !notificationsActive && (
              <span className="absolute end-1 top-1 flex size-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--surface)]" />
            )}
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
