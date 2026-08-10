import { resolveAccountsUrl, resolveFormsOrigin } from '@/lib/dev-urls';

/** Dashboard app (creator UI) — forms.rukny.io */
export const FORMS_URL = resolveFormsOrigin();

/** Public marketing site — rukny.io (privacy, terms, public forms) */
export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
  process.env.FORM_PUBLIC_BASE_URL ||
  'http://localhost:3006'
).replace(/\/$/, '');

export const ACCOUNTS_URL = resolveAccountsUrl();
