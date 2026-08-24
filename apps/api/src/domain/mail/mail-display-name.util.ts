import { BadRequestException } from '@nestjs/common';

const GENERIC_DISPLAY_NAMES = new Set([
  'support',
  'admin',
  'security',
  'help',
  'helpdesk',
  'help desk',
  'postmaster',
  'noreply',
  'no-reply',
  'no reply',
  'no_reply',
  'info',
  'contact',
  'service',
  'customer service',
  'customer support',
]);

export function assertMailboxDisplayName(raw: string | undefined): string {
  const name = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 2) {
    throw new BadRequestException(
      'Display name is required. Use your name or company — not a generic title like Support.',
    );
  }
  if (name.length > 80) {
    throw new BadRequestException('Display name must be 80 characters or fewer.');
  }
  const key = name.toLowerCase();
  if (GENERIC_DISPLAY_NAMES.has(key) || GENERIC_DISPLAY_NAMES.has(key.replace(/[._-]/g, ' '))) {
    throw new BadRequestException(
      'Use your name or company as the From name. Titles like Support or Admin often land in spam.',
    );
  }
  return name;
}
