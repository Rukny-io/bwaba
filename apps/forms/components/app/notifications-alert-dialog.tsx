'use client';

import { AlertDialog } from '@heroui/react';
import { useFormsDashboard } from '@/components/app/forms-dashboard-context';
import { NotificationsPanelContent } from '@/components/app/notifications-panel';

/** Mobile / tablet — bottom sheet. Desktop uses NotificationsDesktopPanel. */
export function NotificationsAlertDialog() {
  const { mobileNotificationsOpen, setMobileNotificationsOpen } =
    useFormsDashboard();

  return (
    <AlertDialog.Backdrop
      className="lg:hidden"
      isDismissable
      isOpen={mobileNotificationsOpen}
      onOpenChange={setMobileNotificationsOpen}
      variant="blur"
    >
      <AlertDialog.Container
        placement="bottom"
        size="cover"
        className="lg:hidden !max-w-none px-0 pb-0"
      >
        <AlertDialog.Dialog className="flex h-[min(92dvh,720px)] min-h-0 w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-b-0 border-[var(--border)] bg-[var(--surface)] shadow-[0_-12px_40px_rgba(15,23,42,0.12)] sm:rounded-t-3xl dark:shadow-[0_-12px_40px_rgba(0,0,0,0.35)]">
          <div
            className="mx-auto mt-2.5 mb-1 h-1 w-12 shrink-0 rounded-full bg-[var(--border)]"
            aria-hidden
          />
          <AlertDialog.Body className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 pb-[env(safe-area-inset-bottom)]">
            <NotificationsPanelContent embedded className="min-h-0 flex-1" />
          </AlertDialog.Body>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
