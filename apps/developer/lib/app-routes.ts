import { isValidAppId } from '@/lib/api/types';

export const LAST_APP_COOKIE = 'rukny_last_app_id';

export function appBase(appId: string): string {
  return `/apps/${appId}`;
}

export function appDashboard(appId: string): string {
  return `${appBase(appId)}/dashboard`;
}

export function appApiKeys(appId: string): string {
  return `${appBase(appId)}/api-keys`;
}

export function appApiKeysNew(appId: string): string {
  return `${appBase(appId)}/api-keys/new`;
}

export function appApiKeyEdit(appId: string, slug: string): string {
  return `${appBase(appId)}/api-keys/${slug}/edit`;
}

export function appWhatsapp(appId: string): string {
  return `${appBase(appId)}/whatsapp`;
}

export function appWhatsappApi(appId: string): string {
  return `${appBase(appId)}/whatsapp-api`;
}

/** @deprecated Use appWhatsappApi */
export function appDocs(appId: string): string {
  return appWhatsappApi(appId);
}

export function appWallet(appId: string): string {
  return `${appBase(appId)}/wallet`;
}

export function appAnalytics(appId: string): string {
  return `${appBase(appId)}/analytics`;
}

export function appCreation(): string {
  return '/apps/creation';
}

export function appProducts(appId: string): string {
  return `${appBase(appId)}/products`;
}

export function appForms(appId: string): string {
  return `${appBase(appId)}/forms`;
}

export function appFormConnect(appId: string, formId: string): string {
  return `${appBase(appId)}/forms/${formId}/connect`;
}

export function appSettings(appId: string): string {
  return `${appBase(appId)}/settings`;
}

export function extractAppIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/apps\/(\d{16})(?:\/|$)/);
  if (!match?.[1] || !isValidAppId(match[1])) return null;
  return match[1];
}
