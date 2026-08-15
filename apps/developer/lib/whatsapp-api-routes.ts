import { WHATSAPP_API_SECTIONS, type WhatsappApiSectionId } from '@/lib/whatsapp-api-catalog';

export { WHATSAPP_API_SECTIONS, type WhatsappApiSectionId };

export function appWhatsappApiHref(
  appId: string,
  section?: WhatsappApiSectionId,
  query?: { endpoint?: string; recipe?: string },
): string {
  const base = `/apps/${appId}/whatsapp-api`;
  if (!section || section === 'overview') {
    if (query?.endpoint || query?.recipe) {
      const params = new URLSearchParams();
      if (query.endpoint) params.set('endpoint', query.endpoint);
      if (query.recipe) params.set('recipe', query.recipe);
      return `${base}/try?${params.toString()}`;
    }
    return base;
  }

  const tab = WHATSAPP_API_SECTIONS.find((item) => item.id === section);
  const path = tab?.slug ? `${base}/${tab.slug}` : base;

  if (query?.endpoint || query?.recipe) {
    const params = new URLSearchParams();
    if (query.endpoint) params.set('endpoint', query.endpoint);
    if (query.recipe) params.set('recipe', query.recipe);
    return `${path}?${params.toString()}`;
  }

  return path;
}

export function isWhatsappApiSectionActive(
  pathname: string,
  appId: string,
  section: WhatsappApiSectionId,
): boolean {
  const href = appWhatsappApiHref(appId, section);
  if (section === 'overview') {
    const base = `/apps/${appId}/whatsapp-api`;
    return pathname === base || pathname === `${base}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
