import { appSettings } from '@/lib/app-routes';

export const APP_SETTINGS_TABS = [
  { segment: 'identity', slug: '' },
  { segment: 'domains', slug: 'domains' },
  { segment: 'legal', slug: 'legal' },
] as const;

export type AppSettingsTabSegment =
  (typeof APP_SETTINGS_TABS)[number]['segment'];

export function appSettingsHref(
  appId: string,
  slug: string,
): string {
  const base = appSettings(appId);
  return slug ? `${base}/${slug}` : base;
}

export function isAppSettingsTabActive(
  pathname: string,
  appId: string,
  slug: string,
): boolean {
  const href = appSettingsHref(appId, slug);
  if (!slug) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
