'use client';

import { Bell } from 'lucide-react';
import { AlertDialog } from '@heroui/react';
import { useFormsDashboard } from '@/components/app/forms-dashboard-context';
import { NotificationsPanelContent } from '@/components/app/notifications-panel';

/** Mobile only — desktop uses the side panel in the shell. */
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
      <AlertDialog.Container placement="center" size="lg">
        <AlertDialog.Dialog className="flex max-h-[min(85dvh,640px)] flex-col">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon className="bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <Bell className="size-5" />
            </AlertDialog.Icon>
            <AlertDialog.Heading>الإشعارات</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="min-h-0 flex-1 overflow-hidden p-0">
            <NotificationsPanelContent
              embedded
              className="max-h-[min(55dvh,480px)]"
            />
          </AlertDialog.Body>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
