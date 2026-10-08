import { createHash, randomBytes } from 'crypto';

export function newMailSsoToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashMailSsoToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Tokens are base64url(32 bytes) = 43 chars; reject anything else before hitting the DB. */
export function isWellFormedMailSsoToken(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export type MailSsoLinkStatus = 'sent' | 'used' | 'expired' | 'revoked';

export function mailSsoLinkStatus(
  link: { usedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
  now = Date.now(),
): MailSsoLinkStatus {
  if (link.usedAt) return 'used';
  if (link.revokedAt) return 'revoked';
  if (link.expiresAt.getTime() <= now) return 'expired';
  return 'sent';
}
