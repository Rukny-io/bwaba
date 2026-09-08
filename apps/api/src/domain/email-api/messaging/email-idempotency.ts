import { BadRequestException } from '@nestjs/common';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function requireEmailIdempotencyKey(raw: string | undefined): string {
  const key = raw?.trim();
  if (!key) {
    throw new BadRequestException('Idempotency-Key header is required.');
  }
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new BadRequestException(
      'Idempotency-Key must be 8-128 alphanumeric characters, hyphens, or underscores.',
    );
  }
  return key;
}
