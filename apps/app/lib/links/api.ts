import { api } from '@/lib/api-client';
import type {
  CreateSocialLinkInput,
  LinkGroup,
  LinkStatsResponse,
  SocialLink,
  UpdateSocialLinkInput,
} from '@/lib/links/types';

export async function fetchMyLinks(): Promise<SocialLink[]> {
  const { data } = await api.get<SocialLink[]>('/social-links/my-links');
  return data;
}

export async function fetchLink(id: string): Promise<SocialLink> {
  const { data } = await api.get<SocialLink>(`/social-links/${id}`);
  return data;
}

export async function fetchLinkStats(id: string): Promise<LinkStatsResponse> {
  const { data } = await api.get<LinkStatsResponse>(`/social-links/${id}/stats`);
  return data;
}

export async function createLink(input: CreateSocialLinkInput): Promise<SocialLink> {
  const { data } = await api.post<SocialLink>('/social-links', input);
  return data;
}

export async function updateLink(
  id: string,
  input: UpdateSocialLinkInput,
): Promise<SocialLink> {
  const { data } = await api.put<SocialLink>(`/social-links/${id}`, input);
  return data;
}

export async function deleteLink(id: string): Promise<void> {
  await api.delete(`/social-links/${id}`);
}

export async function reorderLinks(linkIds: string[]): Promise<void> {
  await api.patch('/social-links/reorder', { linkIds });
}

export async function fetchLinkGroups(): Promise<LinkGroup[]> {
  const { data } = await api.get<LinkGroup[]>('/link-groups');
  return data;
}

export function buildLinkPayload(title: string, url: string): CreateSocialLinkInput {
  const trimmedTitle = title.trim();
  const trimmedUrl = url.trim();

  let hostname = 'link';
  try {
    hostname = new URL(trimmedUrl).hostname.replace(/^www\./, '');
  } catch {
    /* keep default */
  }

  const platform = hostname.split('.')[0] || 'link';

  return {
    platform,
    username: trimmedTitle || hostname,
    url: trimmedUrl,
    title: trimmedTitle || undefined,
  };
}
