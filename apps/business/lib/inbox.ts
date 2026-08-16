import { api } from '@/lib/api-client';
import type { InstagramConnection } from '@/lib/instagram';
import { APP_BASE } from '@/lib/business-routes';

export type InboxChannel = 'instagram' | 'messenger';

export type InboxChannelTab = 'all' | InboxChannel;

export const inboxChannelTabs: ReadonlyArray<{
  id: InboxChannelTab;
  label: string;
}> = [
  { id: 'all', label: 'الكل' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'messenger', label: 'Messenger' },
];

export function parseInboxChannelTab(
  value: string | null | undefined,
): InboxChannelTab {
  if (value === 'instagram' || value === 'messenger') {
    return value;
  }
  return 'all';
}

export function inboxChannelTabHref(tab: InboxChannelTab): string {
  if (tab === 'all') {
    return `${APP_BASE}/inbox`;
  }
  return `${APP_BASE}/inbox?channel=${tab}`;
}

export interface InboxConversation {
  id: string;
  channel: InboxChannel;
  connectionId: string;
  participantName: string;
  participantUsername?: string | null;
  participantAvatarUrl?: string | null;
  preview: string;
  updatedAt: string;
  unreadCount: number;
  messagingWindowExpiresAt?: string | null;
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  body: string;
  messageType?: string;
  sentAt: string;
}

function normalizeChannel(channel?: InboxChannelTab): string | undefined {
  if (channel === 'instagram' || channel === 'messenger') {
    return channel;
  }
  return undefined;
}

export async function fetchInboxConversations(options?: {
  channel?: InboxChannelTab;
  connectionId?: string | null;
}): Promise<InboxConversation[]> {
  const params: Record<string, string | undefined> = {};
  const channel = normalizeChannel(options?.channel);
  if (channel) params.channel = channel;
  if (options?.connectionId) params.connectionId = options.connectionId;

  const { data } = await api.get<{ conversations: InboxConversation[] }>(
    '/integrations/instagram/inbox/conversations',
    params,
  );
  return data.conversations ?? [];
}

export async function fetchInboxMessages(
  conversationId: string,
): Promise<{ conversation: InboxConversation; messages: InboxMessage[] }> {
  const { data } = await api.get<{
    conversation: InboxConversation;
    messages: InboxMessage[];
  }>(`/integrations/instagram/inbox/conversations/${conversationId}/messages`);
  return data;
}

export async function sendInboxMessage(
  conversationId: string,
  text: string,
): Promise<{ message: InboxMessage; conversation: InboxConversation }> {
  const { data } = await api.post<{
    message: InboxMessage;
    conversation: InboxConversation;
  }>(`/integrations/instagram/inbox/conversations/${conversationId}/messages`, {
    text,
  });
  return data;
}

export async function markInboxConversationRead(
  conversationId: string,
): Promise<{ conversation: InboxConversation }> {
  const { data } = await api.post<{ conversation: InboxConversation }>(
    `/integrations/instagram/inbox/conversations/${conversationId}/read`,
  );
  return data;
}

export async function fetchInboxAccounts(): Promise<InstagramConnection[]> {
  const { data } = await api.get<{ connections: InstagramConnection[] }>(
    '/integrations/instagram/connections',
  );
  return data.connections ?? [];
}
