'use client';

import { useEffect } from 'react';
import { useOptionalFormsDashboard } from '@/components/app/forms-dashboard-context';
import { useFormsPreferences } from '@/hooks/use-forms-preferences';
import { appToast } from '@/lib/app-toast';
import { isNotificationCategoryEnabled } from '@/lib/forms-preferences';
import {
  emitNotificationsChanged,
} from '@/lib/notifications-events';
import { normalizeSocketNotification } from '@/lib/notifications-live';
import { subscribeNotificationsSocket } from '@/lib/notifications-socket';

/** Global live listener: toasts + cross-tab count sync when the panel is closed. */
export function NotificationsLiveListener() {
  const dashboard = useOptionalFormsDashboard();
  const { preferences } = useFormsPreferences();
  const panelOpen = dashboard?.notificationsActive ?? false;

  useEffect(() => {
    const unsubscribe = subscribeNotificationsSocket({
      onNewNotification: (raw) => {
        const notification = normalizeSocketNotification(raw);
        if (!notification) return;

        if (
          !isNotificationCategoryEnabled(
            notification.type,
            notification.data,
            preferences.notificationCategories,
          )
        ) {
          return;
        }

        emitNotificationsChanged();

        if (!preferences.showInAppNotificationToasts || panelOpen) return;

        appToast.info(notification.title, {
          description: notification.message || undefined,
        });
      },
      onUnreadCount: () => {
        emitNotificationsChanged();
      },
    });

    return unsubscribe;
  }, [
    panelOpen,
    preferences.notificationCategories,
    preferences.showInAppNotificationToasts,
  ]);

  return null;
}
