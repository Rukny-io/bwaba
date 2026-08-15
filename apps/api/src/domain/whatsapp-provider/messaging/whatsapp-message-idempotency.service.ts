import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../../core/cache/redis.service';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function normalizeWhatsAppIdempotencyKey(
  raw: string | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const key = raw.trim();
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new ConflictException(
      'Idempotency-Key must be 8-128 alphanumeric characters, hyphens, or underscores',
    );
  }
  return key;
}

@Injectable()
export class WhatsAppMessageIdempotencyService {
  constructor(private readonly redis: RedisService) {}

  private resultKey(apiKeyId: string, idempotencyKey: string): string {
    return `wa:idempotency:${apiKeyId}:${idempotencyKey}`;
  }

  private lockKey(apiKeyId: string, idempotencyKey: string): string {
    return `wa:idempotency:lock:${apiKeyId}:${idempotencyKey}`;
  }

  async claim(
    apiKeyId: string,
    idempotencyKey: string,
  ): Promise<'proceed' | 'replay'> {
    const resultKey = this.resultKey(apiKeyId, idempotencyKey);
    const existing = await this.redis.get<unknown>(resultKey);
    if (existing) return 'replay';

    const lockKey = this.lockKey(apiKeyId, idempotencyKey);
    const acquired = await this.redis.setNX(lockKey, '1', 120);
    if (!acquired) {
      const waited = await this.redis.get<unknown>(resultKey);
      if (waited) return 'replay';
      throw new ConflictException(
        'A request with this Idempotency-Key is already in progress',
      );
    }

    return 'proceed';
  }

  async getStoredResult(
    apiKeyId: string,
    idempotencyKey: string,
  ): Promise<unknown | null> {
    return this.redis.get(this.resultKey(apiKeyId, idempotencyKey));
  }

  async storeResult(
    apiKeyId: string,
    idempotencyKey: string,
    result: unknown,
  ): Promise<void> {
    const resultKey = this.resultKey(apiKeyId, idempotencyKey);
    const lockKey = this.lockKey(apiKeyId, idempotencyKey);
    await this.redis.set(resultKey, result, IDEMPOTENCY_TTL_SECONDS);
    await this.redis.del(lockKey);
  }

  async releaseClaim(apiKeyId: string, idempotencyKey: string): Promise<void> {
    await this.redis.del(this.lockKey(apiKeyId, idempotencyKey));
  }
}
