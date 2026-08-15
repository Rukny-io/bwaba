export const WHATSAPP_PHONE_TABS = [
  { segment: 'overview', slug: '' },
  { segment: 'templates', slug: 'templates' },
  { segment: 'logs', slug: 'logs' },
  { segment: 'errors', slug: 'errors' },
] as const;

export type WhatsappPhoneTabSegment = (typeof WHATSAPP_PHONE_TABS)[number]['segment'];

export function appWhatsappPhoneHref(
  appId: string,
  phoneId: string,
  tab?: WhatsappPhoneTabSegment,
): string {
  const base = `/apps/${appId}/whatsapp/phone-numbers/${phoneId}`;
  if (!tab || tab === 'overview') return base;
  const found = WHATSAPP_PHONE_TABS.find((t) => t.segment === tab);
  return found?.slug ? `${base}/${found.slug}` : base;
}

export function isWhatsappPhoneTabActive(
  pathname: string,
  appId: string,
  phoneId: string,
  tab: WhatsappPhoneTabSegment,
): boolean {
  const href = appWhatsappPhoneHref(appId, phoneId, tab);
  if (tab === 'overview') {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isWhatsappPhoneRoute(pathname: string, appId: string): boolean {
  const prefix = `/apps/${appId}/whatsapp/phone-numbers/`;
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}
