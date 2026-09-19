import {
  devFallbackKeyId,
  devFallbackUnwrapDek,
  devFallbackWrapDek,
} from './mail-kms-dev-fallback';

describe('mail-kms-dev-fallback', () => {
  const key = 'a'.repeat(64);

  it('wraps and unwraps a DEK', () => {
    const dek = Buffer.alloc(32, 9);
    const wrapped = devFallbackWrapDek(dek, key);
    const unwrapped = devFallbackUnwrapDek(wrapped, key);
    expect(unwrapped.equals(dek)).toBe(true);
    expect(devFallbackKeyId()).toBe('local-dev-fallback');
  });
});
