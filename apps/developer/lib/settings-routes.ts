export const SETTINGS_TABS = [
  { slug: '', href: '/settings', segment: 'account' },
  { slug: 'alerts', href: '/settings/alerts', segment: 'alerts' },
  { slug: 'platform', href: '/settings/platform', segment: 'platform' },
] as const;

export type SettingsTabSegment = (typeof SETTINGS_TABS)[number]['segment'];

export function isSettingsTabActive(
  pathname: string,
  href: string,
): boolean {
  if (href === '/settings') {
    return pathname === '/settings';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
