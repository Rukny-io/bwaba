import { BadRequestException } from '@nestjs/common';
import { validateFileType } from '../../../core/common/utils/file-validation.util';
import { v4 as uuidv4 } from 'uuid';

/** Max raw upload size before Sharp re-encodes to WebP on S3 */
export const FORM_COVER_MAX_BYTES = 5 * 1024 * 1024;

/** Raster covers only — no SVG/GIF (processed server-side → WebP on S3) */
export const FORM_COVER_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Extract S3 object key from a presigned GET/PUT URL in our bucket.
 */
export function extractFormCoverS3KeyFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname.replace(/^\//, '');
    if (path.startsWith('users/') || path.startsWith('forms/')) {
      return path;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Accept an existing S3 key or presigned URL (already on S3).
 * Rejects arbitrary external URLs.
 */
export function resolveExistingCoverImageKey(
  coverImage: string,
  userId: string,
  formId: string,
): string | undefined {
  const trimmed = coverImage.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('users/') || trimmed.startsWith('forms/')) {
    assertUserOwnedCoverS3Key(trimmed, userId, formId);
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const key = extractFormCoverS3KeyFromUrl(trimmed);
    if (!key) {
      throw new BadRequestException(
        'Cover image must be uploaded to Rukny storage (S3)',
      );
    }
    assertUserOwnedCoverS3Key(key, userId, formId);
    return key;
  }

  return undefined;
}

export function assertUserOwnedCoverS3Key(
  key: string,
  userId: string,
  formId: string,
): void {
  if (
    !key ||
    key.includes('..') ||
    key.includes('\\') ||
    key.includes('\0')
  ) {
    throw new BadRequestException('Invalid cover image reference');
  }

  if (key.startsWith(`users/${userId}/`)) {
    return;
  }

  // Legacy keys stored before users/{userId}/ prefix
  if (key.startsWith(`forms/${formId}/`)) {
    return;
  }

  throw new BadRequestException('Cover image reference is not authorized');
}

/**
 * Decode a base64 data URL into a buffer (before magic-byte validation + Sharp → S3).
 */
export function decodeCoverImageDataUrl(coverImage: string): Buffer {
  let normalized = coverImage.trim();

  if (normalized.startsWith('image/') && normalized.includes(';base64,')) {
    normalized = `data:${normalized}`;
  }

  if (!normalized.startsWith('data:image/')) {
    throw new BadRequestException('Invalid cover image format');
  }

  const header = normalized.slice(0, 80).toLowerCase();
  if (header.includes('svg')) {
    throw new BadRequestException('SVG images are not allowed for form covers');
  }

  const matches = normalized.match(
    /^data:image\/([\w+\-]+)(?:;)?base64,(.+)$/is,
  );
  if (!matches) {
    throw new BadRequestException('Invalid cover image data format');
  }

  const declaredType = matches[1].toLowerCase();
  if (declaredType.includes('svg') || declaredType === 'gif') {
    throw new BadRequestException(
      'Only JPEG, PNG, and WebP images are allowed for form covers',
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(matches[2], 'base64');
  } catch {
    throw new BadRequestException('Invalid cover image encoding');
  }

  if (buffer.length === 0) {
    throw new BadRequestException('Cover image is empty');
  }

  if (buffer.length > FORM_COVER_MAX_BYTES) {
    throw new BadRequestException('Cover image exceeds 5MB limit');
  }

  return buffer;
}

/** Verify file content via magic bytes (not client-declared MIME). */
export async function validateFormCoverImageBuffer(
  buffer: Buffer,
): Promise<void> {
  await validateFileType(buffer, FORM_COVER_ALLOWED_MIMES);
}

export function buildFormCoverS3Key(userId: string, formId: string): string {
  return `users/${userId}/forms/${formId}/cover/${uuidv4()}.webp`;
}
