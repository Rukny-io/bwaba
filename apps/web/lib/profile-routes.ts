export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,30}$/;

/** مسارات وأسماء محجوزة — لا تُعرَض كملف شخصي */
export const RESERVED_PROFILE_SEGMENTS = new Set([
  'f',
  'pricing',
  'profile',
  'api',
  'admin',
  'login',
  'app',
  'forms',
  'accounts',
  'auth',
  'www',
  'static',
  'assets',
  'icons',
  'logos',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  '_next',
]);

export function isValidProfileUsername(username: string): boolean {
  if (!USERNAME_PATTERN.test(username)) return false;
  return !RESERVED_PROFILE_SEGMENTS.has(username.toLowerCase());
}

export function getPublicProfilePath(username: string): string {
  return `/${encodeURIComponent(username.trim())}`;
}
