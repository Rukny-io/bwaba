import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VerifyWebhookInput } from './types';

const DEFAULT_MAX_AGE_SECONDS = 300;

export function verifyWebhookSignature(input: VerifyWebhookInput): boolean {
  const {
    rawBody,
    signatureHeader,
    secret,
    timestampHeader,
    maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS,
  } = input;

  if (!signatureHeader?.startsWith('sha256=')) return false;

  if (timestampHeader !== undefined && timestampHeader !== null) {
    const unix = Number(timestampHeader);
    if (!Number.isFinite(unix)) return false;
    const age = Math.abs(Math.floor(Date.now() / 1000) - unix);
    if (age > maxAgeSeconds) return false;
  }

  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expected =
    'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Returns true when deliveryId was not seen before in the provided store.
 * Use an in-memory Set, Redis SETNX, or database unique constraint.
 */
export function assertWebhookDeliveryNotReplayed(
  deliveryId: string | null | undefined,
  seen: Set<string> | { has(id: string): boolean; add(id: string): void },
): boolean {
  if (!deliveryId?.trim()) return true;
  if (seen.has(deliveryId)) return false;
  seen.add(deliveryId);
  return true;
}
