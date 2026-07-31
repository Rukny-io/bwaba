/** Dashboard app (creator UI) — forms.rukny.io */
export const FORMS_URL =
  process.env.NEXT_PUBLIC_FORMS_URL || 'http://localhost:3007';

/** Public form links shared with respondents — rukny.io/f/{slug} */
export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

export const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';
