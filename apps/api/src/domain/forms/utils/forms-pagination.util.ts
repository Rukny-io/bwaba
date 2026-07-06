import { BadRequestException } from '@nestjs/common';
import { FORMS_MAX_PAGE_LIMIT } from '../forms.constants';

export function parsePageLimit(
  limit: unknown,
  defaultLimit: number,
): number {
  if (limit === undefined || limit === null || limit === '') {
    return defaultLimit;
  }

  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BadRequestException('limit must be a positive number');
  }

  return Math.min(Math.floor(parsed), FORMS_MAX_PAGE_LIMIT);
}
