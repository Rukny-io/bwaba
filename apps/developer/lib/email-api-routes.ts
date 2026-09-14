import {
  EMAIL_API_SECTIONS,
  type EmailApiSectionId,
} from '@/lib/email-api-catalog';

export type { EmailApiSectionId };

export function appEmailApiHref(
  appId: string,
  section: EmailApiSectionId = 'overview',
): string {
  const base = `/apps/${appId}/email-api`;
  const match = EMAIL_API_SECTIONS.find((item) => item.id === section);
  if (!match?.slug) return base;
  return `${base}/${match.slug}`;
}

export function isEmailApiSectionActive(
  pathname: string,
  appId: string,
  section: EmailApiSectionId,
): boolean {
  const href = appEmailApiHref(appId, section);
  if (section === 'overview') {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
