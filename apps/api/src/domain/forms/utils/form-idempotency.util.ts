import { BadRequestException } from '@nestjs/common';

const IDEMPOTENCY_KEY_MIN = 8;
const IDEMPOTENCY_KEY_MAX = 128;
const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function normalizeIdempotencyKey(
  key: string | undefined,
): string | undefined {
  if (key === undefined || key === null || key === '') {
    return undefined;
  }

  const trimmed = key.trim();
  if (
    trimmed.length < IDEMPOTENCY_KEY_MIN ||
    trimmed.length > IDEMPOTENCY_KEY_MAX ||
    !IDEMPOTENCY_KEY_PATTERN.test(trimmed)
  ) {
    throw new BadRequestException(
      'Idempotency-Key must be 8-128 alphanumeric characters, hyphens, or underscores',
    );
  }

  return trimmed;
}

export function idempotencyResultKey(formId: string, key: string): string {
  return `form:idempotency:${formId}:${key}`;
}

export function idempotencyLockKey(formId: string, key: string): string {
  return `form:idempotency:lock:${formId}:${key}`;
}
