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

const MAX_LISTENERS_PER_CHANNEL = 500;
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
    this.bus.setMaxListeners(MAX_LISTENERS_PER_CHANNEL);
  }

  publish(event: MailRealtimeEvent) {
    // Isolate on mailbox channels so subscribers never receive other
    // mailboxes' identifiers, even transiently on a shared app bus.
    this.bus.emit(this.mailboxChannel(event.mailboxId), event);
  }

  /**
   * SSE subscription scoped to the caller's accessible mailboxes, with
   * per-user connection cap and max lifetime.
   */
  subscribeStream(
    appId: string,
    userId: string,
    mailboxIds: ReadonlySet<string>,
    handler: (
      event:
        | MailRealtimeEvent
        | { type: 'connected' | 'expired' },
    ) => void,
  ): MailStreamSubscription {
    const connectionId = `${userId}:${appId}:${Date.now()}:${Math.random()}`;

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

    const channels = [...mailboxIds].map((id) => this.mailboxChannel(id));
    const onEvent = (event: MailRealtimeEvent) => {
      // Defense in depth: only forward events for mailboxes this session may see.
      if (!mailboxIds.has(event.mailboxId) || event.appId !== appId) return;
      handler(event);
    };
    for (const channel of channels) {
      this.bus.on(channel, onEvent);
    }

    const lifetimeTimer = setTimeout(() => {
      handler({ type: 'expired' });
      this.teardown(connectionId, onEvent, channels);
    }, MAX_CONNECTION_LIFETIME_MS);
    lifetimeTimer.unref?.();

    handler({ type: 'connected' });

    return {
      unsubscribe: () => {
        clearTimeout(lifetimeTimer);
        this.teardown(connectionId, onEvent, channels);
      },
    };
  }

  private mailboxChannel(mailboxId: string) {
    return `mailbox:${mailboxId}`;
  }

  private teardown(
    connectionId: string,
    handler: (event: MailRealtimeEvent) => void,
    channels: string[],
  ) {
    this.connections.delete(connectionId);
    for (const channel of channels) {
      this.bus.off(channel, handler);
    }
  }
}
