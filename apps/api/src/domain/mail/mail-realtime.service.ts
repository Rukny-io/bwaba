import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

export type MailRealtimeEvent = {
  type: 'mail.changed';
  appId: string;
  mailboxId: string;
  folder: string;
  messageId: string;
  direction?: 'INBOUND' | 'OUTBOUND';
};

/**
 * In-process realtime bus for Mail inbox (SSE).
 * Same API instance receives SES webhooks and serves inbox clients.
 */
@Injectable()
export class MailRealtimeService {
  private readonly bus = new EventEmitter();

  constructor() {
    this.bus.setMaxListeners(200);
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
}
