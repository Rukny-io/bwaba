import { validateEnv } from './env.validation';

const baseConfig = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'abcdefghijklmnopqrstuvwxyz123456',
  TWO_FACTOR_ENCRYPTION_KEY: 'a'.repeat(64),
  NODE_ENV: 'production',
};

describe('validateEnv GLOBAL_AUTH_MODE', () => {
  it('rejects report mode in production', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        GLOBAL_AUTH_MODE: 'report',
      }),
    ).toThrow(/GLOBAL_AUTH_MODE cannot be "report" in production/);
  });

  it('allows enforce mode in production', () => {
    expect(
      validateEnv({
        ...baseConfig,
        GLOBAL_AUTH_MODE: 'enforce',
        ENCRYPTION_KEY: 'b'.repeat(64),
      }),
    ).toEqual({
      ...baseConfig,
      GLOBAL_AUTH_MODE: 'enforce',
      ENCRYPTION_KEY: 'b'.repeat(64),
    });
  });

  it('requires ENCRYPTION_KEY in production', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        GLOBAL_AUTH_MODE: 'enforce',
      }),
    ).toThrow(/ENCRYPTION_KEY is required in production/);
  });
});
