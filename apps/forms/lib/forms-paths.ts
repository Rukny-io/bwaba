import { FORMS_URL } from '@/lib/config';

/** Entry: creates a draft then redirects to `/forms/n/{slug}/creating`. */
export const FORMS_CREATE_ENTRY_PATH = '/forms/n/new';

export function getFormCreatingPath(slug: string): string {
  return `/forms/n/${encodeURIComponent(slug)}/creating`;
}

export function getFormPreviewPath(slug: string): string {
  return `/forms/n/${encodeURIComponent(slug)}/preview`;
}

export function getFormCreatingUrl(slug: string): string {
  const base = FORMS_URL.replace(/\/$/, '');
  return `${base}${getFormCreatingPath(slug)}`;
}

export function getFormPreviewUrl(slug: string): string {
  const base = FORMS_URL.replace(/\/$/, '');
  return `${base}${getFormPreviewPath(slug)}`;
}
