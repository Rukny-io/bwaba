/**
 * 🔒 F-10 — Declarative map of which model fields are encrypted at rest.
 *
 * `encrypt`      : fields transparently AES-256-GCM encrypted on write / decrypted on read.
 * `blindIndex`   : encrypted fields that also need equality search; maps the
 *                  plaintext field → the deterministic index column used in WHERE.
 *
 * Keys are Prisma model names exactly as they appear in `prisma.<model>`.
 */
export interface ModelEncryptionConfig {
  encrypt: string[];
  /** plaintext field name → blind-index column name */
  blindIndex?: Record<string, string>;
}

export const ENCRYPTED_FIELDS: Record<string, ModelEncryptionConfig> = {
  user: {
    // OAuth tokens: directly usable if leaked → strong candidates for encryption.
    // PII: phone/phoneNumber. email is searchable → uses a blind index.
    // NOTE: Google Calendar/Drive OAuth refresh tokens are also stored here
    // (user.googleRefreshToken), so they are covered by this entry.
    encrypt: [
      'email',
      'phone',
      'phoneNumber',
      'googleAccessToken',
      'googleRefreshToken',
    ],
    blindIndex: {
      email: 'emailBlindIndex',
      // phoneNumber is @unique too; enable once the column + backfill exist:
      // phoneNumber: 'phoneNumberBlindIndex',
    },
  },

  // 🔒 F2-03 — Third-party social OAuth tokens. Long-lived and directly usable
  // for account takeover if leaked, so they are encrypted at rest.
  // Keys MUST match `model.charAt(0).toLowerCase() + model.slice(1)` (the
  // Prisma delegate name) — see getModelConfig() below.
  instagramConnection: {
    // Instagram long-lived (60-day) access token.
    encrypt: ['accessToken'],
  },
  youTubeConnection: {
    encrypt: ['accessToken', 'refreshToken'],
  },
  linkedInConnection: {
    encrypt: ['accessToken', 'refreshToken'],
  },
  tikTokConnection: {
    encrypt: ['accessToken', 'refreshToken'],
  },
  // Google Drive / Google Sheets tokens are persisted on FormIntegration.
  formIntegration: {
    encrypt: ['accessToken', 'refreshToken'],
  },
  // Dedicated calendar OAuth model (Google/other providers).
  calendar_integrations: {
    encrypt: ['accessToken', 'refreshToken'],
  },
};

/** Models keyed by the lowercase name used in Prisma middleware `params.model`. */
export function getModelConfig(
  model: string | undefined,
): ModelEncryptionConfig | undefined {
  if (!model) return undefined;
  // Prisma reports models capitalized (e.g. "User"); normalize to our keys.
  return ENCRYPTED_FIELDS[model.charAt(0).toLowerCase() + model.slice(1)];
}
