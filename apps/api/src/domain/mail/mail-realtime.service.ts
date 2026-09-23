import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export type MailRealtimeEvent = {
  type: 'mail.changed';
  appId: string;
  mailboxId: string;
  folder: string;
  messageId: string;
  direction?: 'INBOUND' | 'OUTBOUND';
};

export type MailStreamSubscription = {
  unsubscribe: () => void;
};

const MAX_LISTENERS_PER_APP = 500;
const MAX_CONNECTIONS_PER_USER = 3;
const MAX_CONNECTION_LIFETIME_MS = 2 * 60 * 60 * 1000; // 2 hours

@Injectable()
export class MailRealtimeService {
  private readonly logger = new Logger(MailRealtimeService.name);
  private readonly bus = new EventEmitter();
  private readonly connections = new Map<
    string,
    { userId: string; appId: string; openedAt: number }
  >();

  constructor() {
    this.bus.setMaxListeners(MAX_LISTENERS_PER_APP);
  }

  publish(event: MailRealtimeEvent) {
    this.bus.emit(`app:${event.appId}`, event);
  }

  subscribe(appId: string, handler: (event: MailRealtimeEvent) => void) {
    const channel = `app:${appId}`;
    this.bus.on(channel, handler);
    return () => {
      this.bus.off(channel, handler);
    };
  }

  /**
   * SSE subscription with per-user connection cap and max lifetime.
   */
  subscribeStream(
    appId: string,
    userId: string,
    handler: (
      event:
        | MailRealtimeEvent
        | { type: 'connected' | 'expired' },
    ) => void,
  ): MailStreamSubscription {
    const connectionId = `${userId}:${appId}:${Date.now()}:${Math.random()}`;
    const userKey = `${userId}:${appId}`;

    const activeForUser = [...this.connections.values()].filter(
      (entry) => entry.userId === userId && entry.appId === appId,
    ).length;
    if (activeForUser >= MAX_CONNECTIONS_PER_USER) {
      this.logger.warn(
        `SSE connection limit reached user=${userId} app=${appId}`,
      );
      throw new Error('Too many active mail stream connections.');
    }

    this.connections.set(connectionId, {
      userId,
      appId,
      openedAt: Date.now(),
    });

    const onEvent = (event: MailRealtimeEvent) => handler(event);
    const channel = `app:${appId}`;
    this.bus.on(channel, onEvent);

    const lifetimeTimer = setTimeout(() => {
      handler({ type: 'expired' });
      this.teardown(connectionId, onEvent, channel);
    }, MAX_CONNECTION_LIFETIME_MS);
    lifetimeTimer.unref?.();

    handler({ type: 'connected' });

    return {
      unsubscribe: () => {
        clearTimeout(lifetimeTimer);
        this.teardown(connectionId, onEvent, channel);
      },
    };
  }

  private teardown(
    connectionId: string,
    handler: (event: MailRealtimeEvent) => void,
    channel: string,
  ) {
    this.connections.delete(connectionId);
    this.bus.off(channel, handler);
  }
}
