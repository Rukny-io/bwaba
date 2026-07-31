import { FORMS_URL, PUBLIC_SITE_URL } from '@/lib/forms/config';

export function getPublicFormUrl(slug: string): string {
  const base = PUBLIC_SITE_URL.replace(/\/$/, '');
  return `${base}/f/${encodeURIComponent(slug)}`;
}

export function getFormEditorUrl(slug: string): string {
  const base = FORMS_URL.replace(/\/$/, '');
  return `${base}/forms/n/${encodeURIComponent(slug)}/creating`;
}
