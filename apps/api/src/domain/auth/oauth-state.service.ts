import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { RedisService } from '../../core/cache/redis.service';
import { getClientIp } from '../../core/common/utils/client-ip.util';

export interface OAuthStatePayload {
  /** redirect_origin */
  o?: string | null;
  /** link_token */
  l?: string | null;
  /** next */
  n?: string | null;
  /** initiating client IP (for optional binding) */
  ip?: string | null;
  /** initiating user-agent */
  ua?: string | null;
  /** userId when the flow is an authenticated account-link */
  userId?: string | null;
}

/**
 * 🔒 F-02 — OAuth state (anti-CSRF) manager.
 *
 * Generates an unpredictable single-use nonce, stores the associated redirect
 * metadata in Redis with a short TTL, and verifies+consumes it on callback.
 * This replaces the previous scheme where `state` merely carried base64-encoded
 * redirect data (predictable, replayable → login CSRF).
 */
@Injectable()
export class OAuthStateService {
  private readonly logger = new Logger(OAuthStateService.name);
  private readonly PREFIX = 'oauth:state:';
  private readonly TTL_SECONDS = 600; // 10 minutes

  // Atomically fetch and delete (single-use). Prevents replay/race duplication.
  private readonly CONSUME_LUA = `
    local v = redis.call('GET', KEYS[1])
    if v then redis.call('DEL', KEYS[1]) end
    return v
  `;

  constructor(private readonly redis: RedisService) {}

  /**
   * Guard helper: on an OAuth *initiation* request (no `?code=`), create a state
   * nonce from the request's redirect metadata and stash it on the request so
   * `getAuthenticateOptions()` can return it as `{ state }`. On the callback
   * request (has `?code=`) this is a no-op.
   */
  async attachToRequest(context: ExecutionContext): Promise<void> {
    const req = context.switchToHttp().getRequest();
    // Callback leg already carries `code` (+ `state`) — do not mint a new nonce.
    if (req.query?.code) return;

    const nonce = await this.create({
      o: req.query?.redirect_origin ?? null,
      l: req.query?.link_token ?? null,
      n: req.query?.next ?? null,
      ip: getClientIp(req),
      ua: req.headers?.['user-agent'] ?? null,
    });
    req._oauthStateNonce = nonce;
  }

  /** Guard helper: the authenticate options containing the freshly-minted state. */
  static readAuthenticateOptions(context: ExecutionContext): { state?: string } {
    const req = context.switchToHttp().getRequest();
    return req._oauthStateNonce ? { state: req._oauthStateNonce } : {};
  }

  /**
   * Create a new state nonce and persist its payload.
   * @returns the base64url nonce to send as the `state` OAuth parameter.
   */
  async create(payload: OAuthStatePayload): Promise<string> {
    const nonce = randomBytes(32).toString('base64url');
    await this.redis.set(
      `${this.PREFIX}${nonce}`,
      JSON.stringify(payload ?? {}),
      this.TTL_SECONDS,
    );
    return nonce;
  }

  /**
   * Verify and consume a state nonce (single-use).
   * @returns the stored payload, or null if the nonce is missing/expired/used.
   */
  async consume(nonce: string): Promise<OAuthStatePayload | null> {
    if (!nonce || typeof nonce !== 'string') return null;
    const key = `${this.PREFIX}${nonce}`;
    try {
      const client = this.redis.getClient();
      const raw = (await client.eval(this.CONSUME_LUA, 1, key)) as
        | string
        | null;
      if (!raw) return null;
      return JSON.parse(raw) as OAuthStatePayload;
    } catch (err) {
      this.logger.error(
        `Failed to consume OAuth state nonce: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
