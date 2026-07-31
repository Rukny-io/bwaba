import { z } from 'zod';

/**
 * 🔒 Environment Variables Validation Schema
 *
 * Validates all critical environment variables at startup
 * Prevents runtime errors due to missing or invalid configuration
 */

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // JWT & Authentication
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // 🔒 F-04: must be exactly 32 random bytes encoded as 64 hex chars.
  // Weak UTF-8 passphrases are no longer accepted. Generate: openssl rand -hex 32
  TWO_FACTOR_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      'TWO_FACTOR_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Generate with: openssl rand -hex 32',
    ),

  // 🔒 F-10: application-level field encryption key (32 bytes / 64 hex chars).
  // Optional so the app boots without encryption enabled; required when
  // FIELD_ENCRYPTION_ENABLED=true. Generate with: openssl rand -hex 32
  FIELD_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      'FIELD_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).',
    )
    .optional(),
  // 🔒 F-10: separate key for the deterministic email blind index (HMAC).
  BLIND_INDEX_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      'BLIND_INDEX_KEY must be exactly 64 hex characters (32 bytes).',
    )
    .optional(),
  FIELD_ENCRYPTION_ENABLED: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  FACEBOOK_CALLBACK_URL: z.string().optional(),
  FACEBOOK_CONFIG_ID: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),

  // Frontend
  FRONTEND_URL: z
    .string()
    .url('FRONTEND_URL must be a valid URL')
    .default('http://localhost:3000'),
  FORMS_APP_URL: z
    .string()
    .url('FORMS_APP_URL must be a valid URL')
    .default('http://localhost:3007'),
  FRONTEND_URL_ALT: z
    .string()
    .url('FRONTEND_URL_ALT must be a valid URL')
    .optional(),
  APP_FRONTEND_URL: z
    .string()
    .url('APP_FRONTEND_URL must be a valid URL')
    .optional(),
  AUTH_FRONTEND_URL: z
    .string()
    .url('AUTH_FRONTEND_URL must be a valid URL')
    .optional(),

  // Third-party integrations (Make.com OAuth)
  API_PUBLIC_URL: z.string().url().optional(),
  INTEGRATION_OAUTH_CLIENT_ID: z.string().optional(),
  INTEGRATION_OAUTH_CLIENT_SECRET: z.string().optional(),
  INTEGRATION_OAUTH_REDIRECT_URIS: z.string().optional(),

  // Cookies
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // Security
  INTERNAL_API_SECRET: z
    .string()
    .min(32, 'INTERNAL_API_SECRET must be at least 32 characters')
    .optional(),

  // Account Lockout
  LOCKOUT_MAX_ATTEMPTS: z
    .string()
    .default('5')
    .transform((val) => parseInt(val, 10)),
  LOCKOUT_DURATION_MINUTES: z
    .string()
    .default('15')
    .transform((val) => parseInt(val, 10)),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Forms geo analytics (mock country for localhost/private IPs)
  GEOIP_MOCK_COUNTRY: z.string().optional(),
  GEOIP_MOCK_GOVERNORATE: z.string().optional(),
  GEOIP_MOCK_CITY: z.string().optional(),

  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10)),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Throws error if validation fails.
 *
 * Compatible with NestJS `ConfigModule.forRoot({ validate })`: receives the raw
 * config object (defaults to `process.env`) and returns it **unchanged** so that
 * all env vars remain available via `ConfigService` (Zod would otherwise strip
 * keys not declared in the schema). Validation runs purely as a startup guard.
 */
export function validateEnv<T extends Record<string, unknown>>(
  config: T = process.env as unknown as T,
): T {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `❌ Environment validation failed:\n${errorMessage}\n\n` +
        `Please check your .env file and ensure all required variables are set.`,
    );
  }

  return config;
}
