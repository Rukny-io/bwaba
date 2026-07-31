import { io, type Socket } from 'socket.io-client';

function stripApiPath(url: string): string {
  return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

function getSocketBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const wsEnv = process.env.NEXT_PUBLIC_API_WS_URL;
  if (wsEnv) return stripApiPath(wsEnv);

  const external = process.env.NEXT_PUBLIC_API_EXTERNAL_URL;
  if (external) return stripApiPath(external);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && !apiUrl.startsWith('/')) {
    return stripApiPath(apiUrl);
  }

  const { protocol, hostname } = window.location;
  const port = hostname === 'localhost' ? ':3001' : '';
  const scheme = protocol === 'https:' ? 'https' : 'http';
  return `${scheme}://${hostname}${port}`;
}

export type LiveSupportMessage = {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isStaff: boolean;
  isInternal?: boolean;
  createdAt: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
  }>;
};

export type LiveTicketUpdate = {
  ticketId: string;
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  updatedAt?: string;
  closedAt?: string | null;
};

export type LiveTicketTyping = {
  ticketId: string;
  userId: string;
  isStaff: boolean;
  isTyping: boolean;
};

export type SupportTicketLiveHandlers = {
  onMessage?: (message: LiveSupportMessage) => void;
  onInternalMessage?: (message: LiveSupportMessage) => void;
  onTicketUpdated?: (update: LiveTicketUpdate) => void;
  onTyping?: (payload: LiveTicketTyping) => void;
  onStaffActivity?: (activity: {
    ticketId: string;
    ticketNumber: string;
    subject: string;
    preview: string;
  }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

let sharedSocket: Socket | null = null;
let connectPromise: Promise<Socket | null> | null = null;
const subscribers = new Map<number, SupportTicketLiveHandlers>();
const joinedTickets = new Set<string>();
let nextSubscriberId = 0;

function broadcast<K extends keyof SupportTicketLiveHandlers>(
  event: K,
  ...args: Parameters<NonNullable<SupportTicketLiveHandlers[K]>>
) {
  for (const handlers of subscribers.values()) {
    const fn = handlers[event];
    if (typeof fn === 'function') {
      (fn as (...a: typeof args) => void)(...args);
    }
  }
}

function emitJoinTicket(socket: Socket, ticketId: string) {
  socket.emit(
    'join-ticket',
    { ticketId },
    (response?: { success?: boolean }) => {
      if (response?.success === false) {
        window.setTimeout(() => {
          if (socket.connected) emitJoinTicket(socket, ticketId);
        }, 400);
      }
    },
  );
}

function rejoinAllTickets(socket: Socket) {
  for (const ticketId of joinedTickets) {
    emitJoinTicket(socket, ticketId);
  }
}

function attachSocketListeners(socket: Socket) {
  socket.off('connect');
  socket.off('disconnect');
  socket.off('ticket-message');
  socket.off('ticket-internal');
  socket.off('ticket-updated');
  socket.off('staff-activity');
  socket.off('ticket-typing');

  socket.on('connect', () => {
    rejoinAllTickets(socket);
    broadcast('onConnect');
  });
  socket.on('disconnect', () => broadcast('onDisconnect'));
  socket.on(
    'ticket-message',
    (payload: { ticketId: string; message: LiveSupportMessage }) => {
      broadcast('onMessage', payload.message);
    },
  );
  socket.on(
    'ticket-internal',
    (payload: { ticketId: string; message: LiveSupportMessage }) => {
      broadcast('onInternalMessage', payload.message);
    },
  );
  socket.on('ticket-updated', (payload: LiveTicketUpdate) => {
    broadcast('onTicketUpdated', payload);
  });
  socket.on(
    'staff-activity',
    (payload: {
      ticketId: string;
      ticketNumber: string;
      subject: string;
      preview: string;
    }) => {
      broadcast('onStaffActivity', payload);
    },
  );
  socket.on('ticket-typing', (payload: LiveTicketTyping) => {
    broadcast('onTyping', payload);
  });
}

async function fetchWsToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/ws-token', { credentials: 'include' });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

async function ensureSharedSocket(): Promise<Socket | null> {
  if (sharedSocket?.connected) return sharedSocket;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      const token = await fetchWsToken();
      const base = getSocketBaseUrl();
      if (!base || !token) return null;

      if (!sharedSocket) {
        sharedSocket = io(`${base}/support`, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 12,
          reconnectionDelay: 800,
        });
        attachSocketListeners(sharedSocket);
      } else if (!sharedSocket.connected) {
        sharedSocket.auth = { token };
        sharedSocket.connect();
      }

      return sharedSocket;
    } catch {
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export function subscribeSupportSocket(
  handlers: SupportTicketLiveHandlers,
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

export async function joinSupportTicket(ticketId: string): Promise<void> {
  joinedTickets.add(ticketId);
  const socket = await ensureSharedSocket();
  if (!socket) return;
  if (socket.connected) {
    emitJoinTicket(socket, ticketId);
  }
}

export function leaveSupportTicket(ticketId: string): void {
  joinedTickets.delete(ticketId);
  sharedSocket?.emit('leave-ticket', { ticketId });
}

export function emitTicketTyping(ticketId: string, isTyping: boolean): void {
  if (!sharedSocket?.connected) return;
  sharedSocket.emit('typing', { ticketId, isTyping });
}
