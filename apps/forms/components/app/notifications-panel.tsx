'use client';

import { NotificationsFeed } from '@/components/notifications/notifications-feed';
import { cn } from '@/lib/utils';

export function NotificationsPanelContent({
  onClose,
  className,
  embedded,
  desktopPanel,
}: {
  onClose?: () => void;
  className?: string;
  embedded?: boolean;
  /** Desktop slide-in panel (lg+) */
  desktopPanel?: boolean;
}) {
  return (
    <NotificationsFeed
      onClose={onClose}
      className={cn(className)}
      embedded={embedded}
      desktopPanel={desktopPanel}
    />
  );
}

export function NotificationsPanel({ onClose }: { onClose?: () => void }) {
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-[var(--surface)]">
      <NotificationsPanelContent onClose={onClose} />
    </aside>
  );
}
