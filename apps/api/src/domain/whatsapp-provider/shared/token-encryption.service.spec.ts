import { ConfigService } from '@nestjs/config';
import { TokenEncryptionService } from './token-encryption.service';

describe('TokenEncryptionService', () => {
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = prevNodeEnv;
  });

  function makeConfig(env: Record<string, string | undefined>) {
    return {
      get: (key: string, defaultValue?: string) =>
        env[key] !== undefined ? env[key] : defaultValue,
    } as ConfigService;
  }

  it('refuses to boot without ENCRYPTION_KEY in production', () => {
    process.env.NODE_ENV = 'production';
    expect(
      () => new TokenEncryptionService(makeConfig({ ENCRYPTION_KEY: '' })),
    ).toThrow(/ENCRYPTION_KEY must be set/);
  });

  it('refuses short ENCRYPTION_KEY without insecure-dev override', () => {
    process.env.NODE_ENV = 'development';
    expect(
      () =>
        new TokenEncryptionService(
          makeConfig({
            ENCRYPTION_KEY: 'too-short',
            ENCRYPTION_KEY_ALLOW_INSECURE_DEV: 'false',
          }),
        ),
    ).toThrow(/ENCRYPTION_KEY must be set/);
  });

  it('encrypts and decrypts with a strong key', () => {
    process.env.NODE_ENV = 'development';
    const key = 'a'.repeat(32);
    const service = new TokenEncryptionService(
      makeConfig({ ENCRYPTION_KEY: key }),
    );
    const cipher = service.encrypt('waba-token-secret');
    expect(cipher).not.toContain('waba-token-secret');
    expect(service.decrypt(cipher)).toBe('waba-token-secret');
  });
});
