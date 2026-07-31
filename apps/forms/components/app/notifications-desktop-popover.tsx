'use client';

import { useFormsDashboard } from '@/components/app/forms-dashboard-context';
import { NotificationsPanelContent } from '@/components/app/notifications-panel';
import { cn } from '@/lib/utils';

export function NotificationsDesktopPopover() {
  const { desktopNotificationsOpen, closeNotifications } = useFormsDashboard();

  if (!desktopNotificationsOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 hidden bg-black/15 backdrop-blur-[3px] lg:block"
        aria-label="إغلاق الإشعارات"
        onClick={closeNotifications}
      />

      <div
        className={cn(
          'dashboard-card fixed z-50 hidden flex-col overflow-hidden rounded-3xl',
          'top-[calc(3.25rem+env(safe-area-inset-top,0px))] end-4 sm:end-6',
          'h-[min(72dvh,34.5rem)] w-[min(calc(100vw-2rem),23.75rem)]',
          'origin-top duration-200 lg:flex',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="الإشعارات"
      >
        <NotificationsPanelContent
          onClose={closeNotifications}
          className="min-h-0 flex-1"
        />
      </div>
    </>
  );
}
