import { io, type Socket } from 'socket.io-client';
import { api } from '@/lib/api-client';

function stripApiPath(url: string): string {
  return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

function getSocketBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const wsEnv = process.env.NEXT_PUBLIC_API_WS_URL;
  if (wsEnv) return stripApiPath(wsEnv);

  if (process.env.NEXT_PUBLIC_API_URL) {
    return stripApiPath(process.env.NEXT_PUBLIC_API_URL);
  }

  const { protocol, hostname } = window.location;
  const port = hostname === 'localhost' ? ':3001' : '';
  const scheme = protocol === 'https:' ? 'https' : 'http';
  return `${scheme}://${hostname}${port}`;
}

export type NotificationsSocketHandlers = {
  onNewNotification?: (notification: unknown) => void;
  onUnreadCount?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

let sharedSocket: Socket | null = null;
let connectPromise: Promise<Socket | null> | null = null;
const subscribers = new Map<number, NotificationsSocketHandlers>();
let nextSubscriberId = 0;

function broadcast<K extends keyof NotificationsSocketHandlers>(
  event: K,
  ...args: Parameters<NonNullable<NotificationsSocketHandlers[K]>>
) {
  for (const handlers of subscribers.values()) {
    const fn = handlers[event];
    if (typeof fn === 'function') {
      (fn as (...a: typeof args) => void)(...args);
    }
  }
}

async function ensureSharedSocket(): Promise<Socket | null> {
  if (sharedSocket?.connected) return sharedSocket;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      const { data } = await api.get<{ token: string }>('/auth/ws-token');
      const base = getSocketBaseUrl();
      if (!base || !data.token) return null;

      const socket = io(`${base}/notifications`, {
        auth: { token: data.token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 8,
      });

      socket.on('connect', () => broadcast('onConnect'));
      socket.on('disconnect', () => broadcast('onDisconnect'));
      socket.on('new-notification', (payload: unknown) =>
        broadcast('onNewNotification', payload),
      );
      socket.on('unread-count', (payload: { count?: number }) => {
        if (typeof payload?.count === 'number') {
          broadcast('onUnreadCount', payload.count);
        }
      });

      sharedSocket = socket;
      return socket;
    } catch {
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/** Subscribe to the shared notifications socket (one connection per tab). */
export function subscribeNotificationsSocket(
  handlers: NotificationsSocketHandlers,
): () => void {
  const id = ++nextSubscriberId;
  subscribers.set(id, handlers);
  void ensureSharedSocket();

  return () => {
    subscribers.delete(id);
    if (subscribers.size === 0) {
      sharedSocket?.disconnect();
      sharedSocket = null;
    }
  };
}

/** @deprecated Prefer subscribeNotificationsSocket — kept for gradual migration. */
export async function connectNotificationsSocket(
  handlers: NotificationsSocketHandlers,
): Promise<{ disconnect: () => void } | null> {
  const disconnect = subscribeNotificationsSocket(handlers);
  await ensureSharedSocket();
  return { disconnect };
}
