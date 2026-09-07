import { BadRequestException } from '@nestjs/common';
import { requireEmailIdempotencyKey } from './email-idempotency';

describe('requireEmailIdempotencyKey', () => {
  it('accepts and normalizes a valid key', () => {
    expect(requireEmailIdempotencyKey('  send_123-abc  ')).toBe('send_123-abc');
  });

  it('rejects a missing key', () => {
    expect(() => requireEmailIdempotencyKey(undefined)).toThrow(BadRequestException);
  });

  it('rejects unsafe and too-short keys', () => {
    expect(() => requireEmailIdempotencyKey('short')).toThrow(BadRequestException);
    expect(() => requireEmailIdempotencyKey('key\r\nInjected: value')).toThrow(BadRequestException);
  });
});
