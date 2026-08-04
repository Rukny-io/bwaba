'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFormsDashboard } from '@/components/app/forms-dashboard-context';
import { NotificationsPanelContent } from '@/components/app/notifications-panel';
import { cn } from '@/lib/utils';

/** iOS 26 Liquid Glass spring */
const PANEL_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 36,
  mass: 0.85,
};

export function NotificationsDesktopPanel() {
  const { desktopNotificationsOpen, closeNotifications } = useFormsDashboard();

  useEffect(() => {
    if (!desktopNotificationsOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeNotifications();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [desktopNotificationsOpen, closeNotifications]);

  return (
    <AnimatePresence>
      {desktopNotificationsOpen ? (
        <>
          <motion.button
            type="button"
            key="notifications-backdrop"
            className="fixed inset-0 z-[60] hidden bg-black/15 backdrop-blur-xl lg:block dark:bg-black/45"
            aria-label="إغلاق الإشعارات"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeNotifications}
          />

          <motion.aside
            key="notifications-panel"
            className={cn(
              'notifications-liquid-sheet fixed z-[70] hidden flex-col lg:flex',
              'inset-y-3 start-3 w-[min(calc(100vw-1.5rem),24.5rem)] sm:w-[26rem]',
              'rounded-[28px]',
            )}
            role="dialog"
            aria-modal="true"
            aria-label="الإشعارات"
            initial={{ x: '110%', opacity: 0.85, scale: 0.96 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '110%', opacity: 0.85, scale: 0.96 }}
            transition={PANEL_SPRING}
          >
            <NotificationsPanelContent
              onClose={closeNotifications}
              desktopPanel
              className="min-h-0 flex-1"
            />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
