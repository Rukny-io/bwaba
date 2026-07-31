import type { AppNotification } from '@/lib/api/notifications';

export function normalizeSocketNotification(raw: unknown): AppNotification | null {
  if (!raw || typeof raw !== 'object') return null;

  const n = raw as Record<string, unknown>;
  if (typeof n.id !== 'string') return null;

  let createdAt = '';
  if (typeof n.createdAt === 'string') {
    createdAt = n.createdAt;
  } else if (n.createdAt instanceof Date) {
    createdAt = n.createdAt.toISOString();
  } else if (n.createdAt) {
    const parsed = new Date(String(n.createdAt));
    if (!Number.isNaN(parsed.getTime())) createdAt = parsed.toISOString();
  }

  if (!createdAt) createdAt = new Date().toISOString();

  return {
    id: n.id,
    type: String(n.type ?? 'SYSTEM'),
    title: String(n.title ?? ''),
    message: String(n.message ?? ''),
    data:
      n.data && typeof n.data === 'object'
        ? (n.data as Record<string, unknown>)
        : null,
    eventId: typeof n.eventId === 'string' ? n.eventId : null,
    isRead: Boolean(n.isRead),
    createdAt,
  };
}

export function prependNotification(
  prev: {
    notifications: AppNotification[];
    total: number;
    unreadCount: number;
  },
  notification: AppNotification,
  limit: number,
): {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
} {
  if (prev.notifications.some((item) => item.id === notification.id)) {
    return prev;
  }

  const notifications = [notification, ...prev.notifications].slice(0, limit);

  return {
    notifications,
    total: prev.total + 1,
    unreadCount: notification.isRead
      ? prev.unreadCount
      : prev.unreadCount + 1,
  };
}
