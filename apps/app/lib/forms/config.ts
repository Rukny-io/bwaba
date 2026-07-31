/** روابط النماذج العامة للزوار — rukny.io/f/{slug} */
export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3006';

/** محرّر النماذج — forms.rukny.io */
export const FORMS_URL =
  process.env.NEXT_PUBLIC_FORMS_URL || 'http://localhost:3007';

/** لوحة التحكم — app.rukny.io */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
