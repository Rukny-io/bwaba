export const WHATSAPP_TABS = [
  { segment: 'overview', slug: '' },
  { segment: 'phones', slug: 'phone-numbers' },
  { segment: 'templates', slug: 'templates' },
  { segment: 'logs', slug: 'logs' },
  { segment: 'webhooks', slug: 'webhooks' },
  { segment: 'contacts', slug: 'contacts' },
] as const;

export type WhatsappTabSegment = (typeof WHATSAPP_TABS)[number]['segment'];

export function appWhatsappHref(appId: string, tab?: WhatsappTabSegment): string {
  const base = `/apps/${appId}/whatsapp`;
  if (!tab || tab === 'overview') return base;
  const found = WHATSAPP_TABS.find((t) => t.segment === tab);
  return found?.slug ? `${base}/${found.slug}` : base;
}

export function isWhatsappTabActive(
  pathname: string,
  appId: string,
  tab: WhatsappTabSegment,
): boolean {
  const href = appWhatsappHref(appId, tab);
  if (tab === 'overview') {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
