import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { RedisService } from '../../core/cache/redis.service';
import { TOKEN_EXPIRY } from '../auth/cookie.config';

export const MAILBOX_LOCKED_CODE = 'MAILBOX_LOCKED';

export type MailMailboxSessionPayload = {
  userId: string;
  appId: string;
  mailboxId: string;
  address: string;
};

export function throwMailboxLocked(): never {
  throw new ForbiddenException({
    statusCode: 403,
    code: MAILBOX_LOCKED_CODE,
    message: 'Unlock this mailbox to continue.',
  });
}

@Injectable()
export class MailMailboxSessionService {
  constructor(private readonly redis: RedisService) {}

  private sessionKey(token: string) {
    return `mail:mbx-session:${token}`;
  }

  private userKey(userId: string, appId: string) {
    return `mail:mbx-session-user:${userId}:${appId}`;
  }

  private mailboxKey(mailboxId: string) {
    return `mail:mbx-session-box:${mailboxId}`;
  }

  private assertRedis() {
    if (!this.redis.getConnectionStatus().ready) {
      throw new ServiceUnavailableException(
        'Mailbox sign-in is temporarily unavailable.',
      );
    }
  }

  async create(
    payload: MailMailboxSessionPayload,
  ): Promise<string> {
    this.assertRedis();
    const previous = await this.redis.get<string>(
      this.userKey(payload.userId, payload.appId),
    );
    if (previous) {
      await this.revoke(previous);
    }
    const previousBox = await this.redis.get<string>(
      this.mailboxKey(payload.mailboxId),
    );
    if (previousBox) {
      await this.revoke(previousBox);
    }

    const token = randomBytes(32).toString('hex');
    const ttl = TOKEN_EXPIRY.mailboxSession;
    await this.redis.set(this.sessionKey(token), payload, ttl);
    await this.redis.set(
      this.userKey(payload.userId, payload.appId),
      token,
      ttl,
    );
    await this.redis.set(this.mailboxKey(payload.mailboxId), token, ttl);
    return token;
  }

  async read(token: string | undefined | null): Promise<MailMailboxSessionPayload | null> {
    if (!token) return null;
    return this.redis.get<MailMailboxSessionPayload>(this.sessionKey(token));
  }

  async revoke(token: string | undefined | null) {
    if (!token) return;
    const payload = await this.read(token);
    await this.redis.del(this.sessionKey(token));
    if (!payload) return;
    await this.redis.del(this.userKey(payload.userId, payload.appId));
    await this.redis.del(this.mailboxKey(payload.mailboxId));
  }

  async revokeMailbox(mailboxId: string) {
    const token = await this.redis.get<string>(this.mailboxKey(mailboxId));
    if (token) await this.revoke(token);
    await this.redis.del(this.mailboxKey(mailboxId));
  }

  async assertAsync(
    token: string | undefined | null,
    expected: { userId: string; appId: string; mailboxId: string },
  ): Promise<MailMailboxSessionPayload> {
    const session = await this.read(token);
    if (
      !session ||
      session.userId !== expected.userId ||
      session.appId !== expected.appId ||
      session.mailboxId !== expected.mailboxId
    ) {
      throwMailboxLocked();
    }
    return session;
  }
}
