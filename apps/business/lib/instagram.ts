import { api } from '@/lib/api-client';
import { resolveBusinessOrigin } from '@/lib/auth-redirect';

export interface InstagramConnection {
  id: string;
  igUserId: string;
  username: string;
  name?: string | null;
  profilePicUrl?: string | null;
  biography?: string | null;
  website?: string | null;
  followersCount?: number | null;
  followsCount?: number | null;
  mediaCount?: number | null;
  tokenExpiry?: string | null;
  createdAt?: string;
}

export async function fetchInstagramConnections(): Promise<InstagramConnection[]> {
  const { data } = await api.get<{ connections: InstagramConnection[] }>(
    '/integrations/instagram/connections',
  );
  return data.connections ?? [];
}

export async function fetchInstagramConnection(
  connectionId: string,
): Promise<InstagramConnection | null> {
  const { data } = await api.get<{
    connected: boolean;
    connection: InstagramConnection | null;
  }>(`/integrations/instagram/connections/${connectionId}`);
  return data.connected ? data.connection : null;
}

export function instagramAccountPath(connectionId: string): string {
  return `/app/instagram/${encodeURIComponent(connectionId)}`;
}

export function inboxPathForAccount(_connectionId?: string): string {
  return '/app/inbox?channel=instagram';
}

export async function startInstagramOAuth(redirectPath = '/app/instagram'): Promise<void> {
  const origin = resolveBusinessOrigin();
  const { data } = await api.get<{ url: string }>('/integrations/instagram/auth-url', {
    redirect: redirectPath,
    redirectBase: origin,
    intent: 'business_inbox',
  });

  if (!data?.url) {
    throw new Error('تعذر بدء ربط إنستغرام');
  }

  window.location.href = data.url;
}

export async function disconnectInstagram(connectionId: string): Promise<void> {
  await api.delete(`/integrations/instagram/connections/${connectionId}`);
}
