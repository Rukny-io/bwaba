'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Info,
  Activity,
  Trash2,
  X,
  XCircle,
  ChevronLeft,
} from 'lucide-react';
import { Button, Skeleton } from '@heroui/react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { useFormsPreferences } from '@/hooks/use-forms-preferences';
import type { AppNotification } from '@/lib/api/notifications';
import { isNotificationCategoryEnabled } from '@/lib/forms-preferences';
import {
  NOTIFICATION_FILTERS,
  countByFilter,
  enrichNotification,
  filterNotifications,
  groupNotificationsByDate,
  type EnrichedNotification,
  type NotificationFilter,
  type NotificationUiType,
} from '@/lib/notifications-utils';

const TYPE_ICONS: Record<NotificationUiType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  update: Activity,
};

const TYPE_STYLES: Record<
  NotificationUiType,
  { color: string; bg: string; dot: string }
> = {
  success: {
    color: 'text-[var(--success)]',
    bg: 'bg-[var(--success)]/15',
    dot: 'bg-[var(--success)]',
  },
  error: {
    color: 'text-[var(--danger)]',
    bg: 'bg-[var(--danger)]/10',
    dot: 'bg-[var(--danger)]',
  },
  warning: {
    color: 'text-[var(--warning)]',
    bg: 'bg-[var(--warning)]/15',
    dot: 'bg-[var(--warning)]',
  },
  info: {
    color: 'text-[var(--primary)]',
    bg: 'bg-[var(--primary)]/12',
    dot: 'bg-[var(--primary)]',
  },
  update: {
    color: 'text-[var(--foreground)]',
    bg: 'bg-[var(--surface-secondary)]',
    dot: 'bg-[var(--foreground)]',
  },
};

function NotificationListSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('space-y-3 py-2', compact ? 'px-4' : 'px-1')}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <Skeleton className="size-9 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationItem({
  notif,
  busy,
  showAction,
  onMarkRead,
  onDelete,
  onOpen,
}: {
  notif: EnrichedNotification;
  busy: boolean;
  showAction?: boolean;
  onMarkRead: (n: AppNotification) => void;
  onDelete: (id: string) => void;
  onOpen: (n: EnrichedNotification) => void;
}) {
  const styles = TYPE_STYLES[notif.uiType];
  const Icon = TYPE_ICONS[notif.uiType];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notif)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(notif);
      }}
      className="group relative cursor-pointer rounded-xl px-3 py-3 transition-colors hover:bg-[var(--surface-secondary)]/80"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
            styles.bg,
          )}
        >
          <Icon className={cn('size-[18px]', styles.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-[13px] leading-tight text-[var(--foreground)]',
                !notif.isRead ? 'font-bold' : 'font-medium',
              )}
            >
              {notif.title}
            </h4>
            {!notif.isRead && (
              <span
                className={cn('mt-1.5 size-2 shrink-0 rounded-full', styles.dot)}
              />
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            {notif.message}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] tabular-nums text-[var(--muted-foreground)]/70">
              {notif.time}
            </span>
            {showAction && notif.href && notif.actionLabel && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[var(--foreground)]">
                {notif.actionLabel}
                <ChevronLeft className="size-3" />
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif.id);
          }}
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-[var(--muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] group-hover:opacity-100 disabled:opacity-50"
          aria-label="حذف"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function NotificationsFeed({
  onClose,
  className,
  embedded,
}: {
  onClose?: () => void;
  className?: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const { data, isLoading, error, markRead, markAllRead, remove, removeAll, socketConnected } =
    useNotifications(100);
  const { preferences } = useFormsPreferences();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const items = useMemo(() => {
    const notifications = data?.notifications ?? [];
    const visible = notifications.filter((n) =>
      isNotificationCategoryEnabled(
        n.type,
        n.data,
        preferences.notificationCategories,
      ),
    );

    return visible.map(enrichNotification);
  }, [data?.notifications, preferences.notificationCategories]);

  const filtered = useMemo(
    () => filterNotifications(items, filter),
    [items, filter],
  );

  const grouped = useMemo(
    () => groupNotificationsByDate(filtered),
    [filtered],
  );

  const unreadCount =
    data?.unreadCount ?? items.filter((n) => !n.isRead).length;

  const total = data?.total ?? items.length;

  const handleMarkRead = useCallback(
    async (n: AppNotification) => {
      if (n.isRead) return;
      setBusy(n.id);
      try {
        await markRead(n.id);
      } finally {
        setBusy(null);
      }
    },
    [markRead],
  );

  const handleOpen = useCallback(
    (notif: EnrichedNotification) => {
      void handleMarkRead(notif);
      if (notif.href) router.push(notif.href);
    },
    [handleMarkRead, router],
  );

  const handleMarkAllRead = useCallback(async () => {
    setBusy('all');
    try {
      await markAllRead();
    } finally {
      setBusy(null);
    }
  }, [markAllRead]);

  const handleDelete = useCallback(
    async (id: string) => {
      setBusy(id);
      try {
        await remove(id);
      } finally {
        setBusy(null);
      }
    },
    [remove],
  );

  const handleDeleteAll = useCallback(async () => {
    setBusy('delete-all');
    try {
      await removeAll();
    } finally {
      setBusy(null);
    }
  }, [removeAll]);

  const showPanelHeader = embedded ? unreadCount > 0 : true;

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {showPanelHeader && (
        <div
          className={cn(
            'flex shrink-0 items-center justify-between px-4 pb-3',
            embedded ? 'pt-0' : 'pt-4',
          )}
        >
          {!embedded && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                الإشعارات
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] tabular-nums text-[var(--muted-foreground)]">
                {unreadCount} غير مقروء · {total} إجمالي
                {socketConnected && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/15 px-1.5 py-0.5 text-[9px] font-medium text-[var(--success)]"
                    title="متصل بالتحديثات المباشرة"
                  >
                    <span className="size-1.5 rounded-full bg-[var(--success)]" />
                    مباشر
                  </span>
                )}
              </p>
            </div>
          )}
          <div
            className={cn(
              'flex items-center gap-1',
              embedded && 'ms-auto w-full justify-end',
            )}
          >
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={busy === 'all'}
                onClick={() => void handleMarkAllRead()}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" />
                اقرأ الكل
              </button>
            )}
            {onClose && (
              <Button
                variant="tertiary"
                size="sm"
                isIconOnly
                onPress={onClose}
                aria-label="إغلاق"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div
        className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {NOTIFICATION_FILTERS.map((f) => {
          const active = filter === f.key;
          const count =
            f.key !== 'all' ? countByFilter(items, f.key) : 0;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {f.label}
              {count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading ? (
          <NotificationListSkeleton compact />
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)]">
              <BellOff className="size-5 text-[var(--muted-foreground)]/40" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[var(--foreground)]/70">
                {filter === 'unread' ? 'لا إشعارات غير مقروءة' : 'لا توجد إشعارات'}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                ستظهر تنبيهات النماذج والحساب هنا
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-3 pb-2">
            {grouped.map((group) => (
              <section key={group.key}>
                <h3 className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
                  {group.label}
                </h3>
                <div className="space-y-0.5 rounded-xl bg-[var(--surface-secondary)]/25">
                  {group.items.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      busy={busy === notif.id}
                      showAction
                      onMarkRead={(n) => void handleMarkRead(n)}
                      onDelete={(id) => void handleDelete(id)}
                      onOpen={handleOpen}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="shrink-0 border-t border-[var(--border)]/50 px-4 py-3">
          <button
            type="button"
            disabled={busy === 'delete-all'}
            onClick={() => void handleDeleteAll()}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] disabled:opacity-50"
          >
            <Trash2 className="size-3" />
            حذف كل الإشعارات
          </button>
        </div>
      )}

    </div>
  );
}
