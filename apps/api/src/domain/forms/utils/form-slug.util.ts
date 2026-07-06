import { randomBytes } from 'crypto';

/** Public form slug charset: lowercase letters + digits (6 chars by default). */
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const DEFAULT_SLUG_LENGTH = 6;
const SLUG_PATTERN = /^[a-z0-9]{6}$/;

export function isSystemFormSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function generateRandomFormSlug(length = DEFAULT_SLUG_LENGTH): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SLUG_CHARS[bytes[i]! % SLUG_CHARS.length];
  }
  return out;
}

export function normalizeFormSlugInput(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 200);
}
