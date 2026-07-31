import { PUBLIC_SITE_URL } from '@/lib/config';
import { getFormCreatingPath } from '@/lib/forms-paths';
import type { FormStatus, FormType } from '@/lib/forms-api';

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  DRAFT: 'مسودة',
  PUBLISHED: 'منشور',
  CLOSED: 'مغلق',
  ARCHIVED: 'مؤرشف',
};

export const FORM_STATUS_CONFIG: Record<
  FormStatus,
  { bg: string; color: string }
> = {
  DRAFT: {
    bg: 'bg-[var(--surface-secondary)]/90',
    color: 'text-[var(--foreground)]',
  },
  PUBLISHED: {
    bg: 'bg-[var(--success)]/90',
    color: 'text-white',
  },
  CLOSED: {
    bg: 'bg-[var(--warning)]/90',
    color: 'text-white',
  },
  ARCHIVED: {
    bg: 'bg-[var(--muted-foreground)]/80',
    color: 'text-white',
  },
};

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  CONTACT: 'تواصل',
  SURVEY: 'استبيان',
  REGISTRATION: 'تسجيل',
  ORDER: 'طلب',
  FEEDBACK: 'ملاحظات',
  QUIZ: 'اختبار',
  APPLICATION: 'طلب التحاق',
  OTHER: 'أخرى',
};

export function getFormStatusLabel(status: FormStatus): string {
  return FORM_STATUS_LABELS[status] ?? status;
}

export function getFormTypeLabel(type: FormType): string {
  return FORM_TYPE_LABELS[type] ?? type;
}

/** Gregorian dates in English across the forms app UI */
export const DATE_LOCALE = 'en-US';

export function formatShortDate(dateStr: string): string {
  const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
  return new Date(normalized).toLocaleDateString(DATE_LOCALE, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatFormDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(DATE_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFormDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(DATE_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Legacy helper — new forms use server-generated 6-char slugs. */
export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export function getCreatorFormPath(slug: string): string {
  return getFormCreatingPath(slug);
}

/** Respondent-facing URL on the main site (not forms.rukny.io). */
export function getPublicFormUrl(slug: string): string {
  const base = PUBLIC_SITE_URL.replace(/\/$/, '');
  return `${base}/f/${encodeURIComponent(slug)}`;
}

export function truncateId(id: string, len = 8): string {
  return id.length <= len ? id : `${id.slice(0, len)}…`;
}
