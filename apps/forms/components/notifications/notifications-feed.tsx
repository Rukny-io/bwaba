'use client';

import Link from 'next/link';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { Skeleton } from '@heroui/react';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { APP_BASE } from '@/components/app/nav-config';
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

const PRIMARY_FILTERS: NotificationFilter[] = ['all', 'unread'];

const SECONDARY_FILTER_KEYS: NotificationFilter[] = ['error', 'update'];

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

function NotificationsActionsMenu({
  unreadCount,
  itemCount,
  errorCount,
  updateCount,
  busy,
  embedded = false,
  onMarkAllRead,
  onDeleteAll,
  onFilter,
}: {
  unreadCount: number;
  itemCount: number;
  errorCount: number;
  updateCount: number;
  busy: string | null;
  embedded?: boolean;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
  onFilter: (filter: NotificationFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const bulkItems = [
    unreadCount > 0
      ? {
          key: 'mark-all',
          label: 'اقرأ الكل',
          icon: CheckCheck,
          disabled: busy === 'all',
          danger: false,
          onSelect: () => {
            onMarkAllRead();
            setOpen(false);
          },
        }
      : null,
    itemCount > 0
      ? {
          key: 'delete-all',
          label: 'حذف الكل',
          icon: Trash2,
          disabled: busy === 'delete-all',
          danger: true,
          onSelect: () => {
            onDeleteAll();
            setOpen(false);
          },
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: React.ElementType;
    disabled: boolean;
    danger: boolean;
    onSelect: () => void;
  }>;

  const filterItems = [
    errorCount > 0
      ? {
          key: 'filter-error',
          label: `أخطاء (${errorCount})`,
          icon: XCircle,
          onSelect: () => {
            onFilter('error');
            setOpen(false);
          },
        }
      : null,
    updateCount > 0
      ? {
          key: 'filter-update',
          label: `تحديثات (${updateCount})`,
          icon: Activity,
          onSelect: () => {
            onFilter('update');
            setOpen(false);
          },
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: React.ElementType;
    onSelect: () => void;
  }>;

  if (bulkItems.length === 0 && filterItems.length === 0) return null;

  const iconButtonClass =
    'flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(iconButtonClass, open && 'bg-[var(--surface-secondary)] text-[var(--foreground)]')}
        aria-label="إجراءات الإشعارات"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute end-0 z-[60] min-w-[11.5rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--card-shadow-hover)]',
            embedded
              ? 'bottom-[calc(100%+0.5rem)]'
              : 'top-[calc(100%+0.375rem)]',
          )}
        >
          {bulkItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={item.onSelect}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm transition-colors disabled:opacity-50',
                  item.danger
                    ? 'text-[var(--danger)] hover:bg-[var(--danger)]/10'
                    : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {item.label}
              </button>
            );
          })}

          {bulkItems.length > 0 && filterItems.length > 0 ? (
            <div className="my-1 h-px bg-[var(--border)]/60" role="separator" />
          ) : null}

          {filterItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={item.onSelect}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
              >
                <Icon className="size-3.5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

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
  embedded = false,
  onMarkRead,
  onDelete,
  onOpen,
}: {
  notif: EnrichedNotification;
  busy: boolean;
  showAction?: boolean;
  embedded?: boolean;
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
      className={cn(
        'group relative flex w-full items-start gap-3 cursor-pointer text-start transition-colors',
        embedded
          ? cn(
              'border-b border-[var(--border)]/45 px-4 py-3.5 last:border-b-0 active:bg-[var(--surface-secondary)]/70',
              !notif.isRead && 'bg-[var(--primary)]/[0.03]',
            )
          : cn(
              'rounded-xl px-3 py-3 hover:bg-[var(--surface-secondary)]/80',
              !notif.isRead &&
                'border border-[var(--primary)]/10 bg-[var(--primary)]/[0.04]',
            ),
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl',
          'size-9',
          styles.bg,
        )}
      >
        <Icon className={cn('size-[18px]', styles.color)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h4
            className={cn(
              'min-w-0 flex-1 break-words text-[13px] leading-snug text-[var(--foreground)]',
              !notif.isRead ? 'font-bold' : 'font-medium',
            )}
          >
            {notif.title}
          </h4>
          <div className="flex shrink-0 items-center gap-1">
            {!notif.isRead ? (
              <span className={cn('size-2 rounded-full', styles.dot)} />
            ) : null}
            {!embedded ? (
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notif.id);
                }}
                className="flex size-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] opacity-0 transition-opacity hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] group-hover:opacity-100 disabled:opacity-50"
                aria-label="حذف"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <p className="mt-1 line-clamp-2 break-words text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {notif.message}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]/75">
            {notif.time}
          </span>
          {showAction && notif.href && notif.actionLabel ? (
            <span className="inline-flex min-w-0 items-center gap-0.5 text-[11px] font-medium text-[var(--primary)]">
              <span className="truncate">{notif.actionLabel}</span>
              <ChevronLeft className="size-3 shrink-0" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function NotificationsFeed({
  onClose,
  className,
  embedded,
  fullPage,
}: {
  onClose?: () => void;
  className?: string;
  embedded?: boolean;
  /** Mobile full-screen route (`/app/notifications`) */
  fullPage?: boolean;
}) {
  const router = useRouter();
  const { data, isLoading, error, markRead, markAllRead, remove, removeAll } =
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

  const errorCount = countByFilter(items, 'error');
  const updateCount = countByFilter(items, 'update');
  const isSecondaryFilter = SECONDARY_FILTER_KEYS.includes(filter);
  const activeSecondaryLabel = NOTIFICATION_FILTERS.find((f) => f.key === filter)?.label;

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

  const isListMode = embedded || fullPage;

  const listContent = (
    <>
      {isLoading ? (
        <NotificationListSkeleton compact />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-6">
          <DashboardEmptyState
            compact
            icon={BellOff}
            title={
              filter === 'unread'
                ? 'لا إشعارات غير مقروءة'
                : filter === 'error'
                  ? 'لا أخطاء'
                  : filter === 'update'
                    ? 'لا تحديثات'
                    : 'لا توجد إشعارات'
            }
            description="ستظهر تنبيهات النماذج والحساب هنا"
          />
        </div>
      ) : (
        <div className={cn(isListMode ? 'pb-2' : 'space-y-4 px-3 pb-4')}>
          {grouped.map((group) => (
            <section key={group.key}>
              <h3 className="px-4 pb-1 pt-2 text-[11px] font-semibold text-[var(--muted-foreground)] first:pt-1">
                {group.label}
              </h3>
              <div className={cn(!isListMode && 'space-y-1')}>
                {group.items.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    busy={busy === notif.id}
                    showAction={!isListMode}
                    embedded={isListMode}
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
    </>
  );

  if (fullPage) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
        <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-[var(--border)]/50 bg-[var(--surface)] px-3 py-2.5">
          <Link
            href={APP_BASE}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
            aria-label="رجوع"
          >
            <ChevronRight className="size-5" strokeWidth={2} />
          </Link>
          <h1 className="flex min-w-0 flex-1 items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            الإشعارات
            {unreadCount > 0 ? (
              <span
                className="inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--danger)] px-1.5 py-0.5 text-[10px] font-bold text-white"
                dir="ltr"
                lang="en"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </h1>
        </header>
        <div className="notifications-feed-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {listContent}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div
        className={cn(
          'relative z-10 flex shrink-0 items-center justify-between gap-3 overflow-visible border-b border-[var(--border)]/50 px-4',
          embedded ? 'py-3' : 'pb-3 pt-4',
        )}
      >
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          الإشعارات
          {unreadCount > 0 ? (
            <span
              className="inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--danger)] px-1.5 py-0.5 text-[10px] font-bold text-white"
              dir="ltr"
              lang="en"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </h2>

        {!embedded ? (
          <div className="flex shrink-0 items-center gap-1">
            <NotificationsActionsMenu
              unreadCount={unreadCount}
              itemCount={items.length}
              errorCount={errorCount}
              updateCount={updateCount}
              busy={busy}
              embedded={embedded}
              onMarkAllRead={() => void handleMarkAllRead()}
              onDeleteAll={() => void handleDeleteAll()}
              onFilter={setFilter}
            />
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                aria-label="إغلاق"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!embedded ? (
        <div className="shrink-0 border-b border-[var(--border)]/50 px-4 py-3">
          <div
            className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-secondary)] p-1"
            role="tablist"
            aria-label="تصفية الإشعارات"
          >
            {PRIMARY_FILTERS.map((key) => {
              const meta = NOTIFICATION_FILTERS.find((f) => f.key === key)!;
              const active = filter === key;
              const count = key === 'unread' ? unreadCount : 0;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-center text-xs font-medium transition-colors',
                    active
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--muted-foreground)]',
                  )}
                >
                  {meta.label}
                  {count > 0 ? ` (${count > 99 ? '99+' : count})` : ''}
                </button>
              );
            })}
          </div>

          {isSecondaryFilter && activeSecondaryLabel ? (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)]"
            >
              {activeSecondaryLabel}
              <X className="size-3" aria-hidden />
              <span className="sr-only">إزالة التصفية</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            'notifications-feed-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain',
            !embedded && 'px-2 pb-2 pt-1',
          )}
        >
          {listContent}
        </div>
      </div>
    </div>
  );
}
