import { api } from '@/lib/api-client';

export type InstagramLinkIntent = 'profile_card' | 'media_grid';

/** Fetch Instagram OAuth URL (authenticated) then redirect */
export async function startInstagramOAuth(
  intent: InstagramLinkIntent,
  options?: { redirect?: string; linkId?: string },
): Promise<void> {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const redirect =
    options?.redirect ||
    (typeof window !== 'undefined' ? window.location.pathname : '/app/links');

  const { data } = await api.get<{ url: string }>('/integrations/instagram/auth-url', {
    redirect,
    redirectBase: origin,
    intent,
    ...(options?.linkId ? { linkId: options.linkId } : {}),
  });

  if (!data?.url) {
    throw new Error('تعذر بدء ربط إنستغرام');
  }

  window.location.href = data.url;
}

export function getInstagramEmbedUrl(linkId: string): string {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  return `${API_BASE}/integrations/instagram/embed/${encodeURIComponent(linkId)}`;
}
