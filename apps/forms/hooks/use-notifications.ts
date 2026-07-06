'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationsResponse,
} from '@/lib/api/notifications';
import {
  emitNotificationsChanged,
  NOTIFICATIONS_CHANGED_EVENT,
} from '@/lib/notifications-events';
import { subscribeNotificationsSocket } from '@/lib/notifications-socket';
import {
  normalizeSocketNotification,
  prependNotification,
} from '@/lib/notifications-live';

const POLL_MS = 30_000;
const POLL_MS_WITH_SOCKET = 120_000;

export function useNotifications(limit = 50) {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const mounted = useRef(true);

  const fetchList = useCallback(async () => {
    try {
      const res = await getNotifications({ limit });
      if (mounted.current) {
        setData(res);
        setError(null);
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : 'تعذّر تحميل الإشعارات');
      }
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    mounted.current = true;
    setIsLoading(true);
    void fetchList();

    let unsubscribe: (() => void) | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    function startPolling(ms: number) {
      if (pollId) clearInterval(pollId);
      pollId = setInterval(() => void fetchList(), ms);
    }

    startPolling(POLL_MS);

    unsubscribe = subscribeNotificationsSocket({
      onConnect: () => {
        if (!mounted.current) return;
        setSocketConnected(true);
        startPolling(POLL_MS_WITH_SOCKET);
      },
      onDisconnect: () => {
        if (!mounted.current) return;
        setSocketConnected(false);
        startPolling(POLL_MS);
      },
      onNewNotification: (raw) => {
        const notification = normalizeSocketNotification(raw);
        if (notification) {
          setData((prev) =>
            prev
              ? { ...prev, ...prependNotification(prev, notification, limit) }
              : prev,
          );
        } else {
          void fetchList();
        }
        emitNotificationsChanged();
      },
      onUnreadCount: (count) => {
        setData((prev) => (prev ? { ...prev, unreadCount: count } : prev));
        emitNotificationsChanged();
      },
    });

    return () => {
      mounted.current = false;
      if (pollId) clearInterval(pollId);
      unsubscribe?.();
    };
  }, [fetchList]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setData((prev) => {
      if (!prev) return prev;
      const notifications = prev.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      const unreadCount = Math.max(0, prev.unreadCount - 1);
      return { ...prev, notifications, unreadCount };
    });
    emitNotificationsChanged();
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        unreadCount: 0,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
      };
    });
    emitNotificationsChanged();
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteNotification(id);
    setData((prev) => {
      if (!prev) return prev;
      const removed = prev.notifications.find((n) => n.id === id);
      const notifications = prev.notifications.filter((n) => n.id !== id);
      const unreadCount =
        removed && !removed.isRead
          ? Math.max(0, prev.unreadCount - 1)
          : prev.unreadCount;
      return {
        ...prev,
        notifications,
        total: Math.max(0, prev.total - 1),
        unreadCount,
      };
    });
    emitNotificationsChanged();
  }, []);

  const removeAll = useCallback(async () => {
    await deleteAllNotifications();
    setData({ notifications: [], total: 0, unreadCount: 0 });
    emitNotificationsChanged();
  }, []);

  return {
    data,
    isLoading,
    error,
    socketConnected,
    refetch: fetchList,
    markRead,
    markAllRead,
    remove,
    removeAll,
  };
}

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);
  const mounted = useRef(true);

  const fetchCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (mounted.current) setCount(res.unreadCount);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void fetchCount();

    let pollId: ReturnType<typeof setInterval> | null = null;
    function startPolling(ms: number) {
      if (pollId) clearInterval(pollId);
      pollId = setInterval(() => void fetchCount(), ms);
    }
    startPolling(15_000);

    const unsubscribe = subscribeNotificationsSocket({
      onConnect: () => startPolling(60_000),
      onDisconnect: () => startPolling(15_000),
      onUnreadCount: (n) => {
        if (mounted.current) setCount(n);
      },
    });

    const onChanged = () => void fetchCount();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    return () => {
      mounted.current = false;
      if (pollId) clearInterval(pollId);
      unsubscribe();
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    };
  }, [fetchCount]);

  return { count, refetch: fetchCount };
}
