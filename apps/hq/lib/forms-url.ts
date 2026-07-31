const FORMS_APP_URL =
  process.env.NEXT_PUBLIC_FORMS_URL?.replace(/\/$/, '') ?? 'http://localhost:3007';

/** Public preview URL for a form (read-only admin access). */
export function getFormPreviewUrl(slug: string): string {
  return `${FORMS_APP_URL}/forms/n/${encodeURIComponent(slug)}/preview`;
}

/** Owner-facing form editor in the Forms app (admin deep link). */
export function getFormEditorUrl(formId: string): string {
  return `${FORMS_APP_URL}/app/forms/${encodeURIComponent(formId)}`;
}
