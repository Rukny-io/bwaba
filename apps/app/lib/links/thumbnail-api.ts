import { api } from '@/lib/api-client';
import type { SocialLink } from '@/lib/links/types';

export interface UrlMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const { data } = await api.get<UrlMetadata>(
    `/utils/url-metadata?url=${encodeURIComponent(url)}`,
  );
  return data;
}

export async function uploadLinkThumbnail(
  linkId: string,
  file: File,
): Promise<SocialLink> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<SocialLink>(
    `/social-links/${linkId}/thumbnail`,
    formData,
  );
  return data;
}

export async function removeLinkThumbnail(linkId: string): Promise<SocialLink> {
  const { data } = await api.delete<SocialLink>(`/social-links/${linkId}/thumbnail`);
  return data;
}

export async function importLinkLogoFromUrl(
  linkId: string,
  sourceUrl: string,
): Promise<SocialLink> {
  const metadata = await fetchUrlMetadata(sourceUrl);
  const logoUrl = metadata.favicon || metadata.image;
  if (!logoUrl) {
    throw new Error('لم يُعثر على شعار لهذا الرابط');
  }
  const { data } = await api.put<SocialLink>(`/social-links/${linkId}`, {
    thumbnail: logoUrl,
  });
  return data;
}
