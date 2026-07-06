import { api } from '@/lib/api-client';

export interface FormDeveloperEmbedStatus {
  linked: false;
}

export interface FormDeveloperEmbedLinked {
  linked: true;
  app: {
    appId: string;
    name: string;
  };
  slug: string;
  status: string;
  embedReady: boolean;
  embed: {
    allowedOrigins: string[];
    embedEnabled: boolean;
    requiresWebsiteOrOrigins: boolean;
    websiteOrigin: string | null;
  };
}

export type FormDeveloperEmbed =
  | FormDeveloperEmbedStatus
  | FormDeveloperEmbedLinked;

export async function getFormDeveloperEmbed(
  formId: string,
): Promise<FormDeveloperEmbed> {
  const { data } = await api.get<FormDeveloperEmbed>(
    `/forms/${encodeURIComponent(formId)}/developer-embed`,
  );
  return data;
}

export async function unlinkFormFromDeveloperApp(
  publicAppId: string,
  formId: string,
): Promise<void> {
  await api.delete(
    `/developer/forms/${encodeURIComponent(formId)}/link?appId=${encodeURIComponent(publicAppId)}`,
  );
}

export interface DeveloperLinkTarget {
  appId: string;
  name: string;
  websiteOrigin: string | null;
  domainConfigured: boolean;
  linkedFormsCount: number;
  linkChallenge: string;
}

export interface DeveloperLinkTargetsResponse {
  canLink: boolean;
  reason: 'already_linked' | null;
  linkedApp: {
    appId: string;
    name: string;
    websiteOrigin: string | null;
  } | null;
  targets: DeveloperLinkTarget[];
}

export async function getDeveloperLinkTargets(
  formId: string,
): Promise<DeveloperLinkTargetsResponse> {
  const { data } = await api.get<DeveloperLinkTargetsResponse>(
    `/forms/${encodeURIComponent(formId)}/developer-embed/link-targets`,
  );
  return data;
}

export async function linkFormToDeveloperApp(
  formId: string,
  appId: string,
  linkChallenge: string,
): Promise<void> {
  await api.post(`/forms/${encodeURIComponent(formId)}/developer-embed/link`, {
    appId,
    linkChallenge,
  });
}
