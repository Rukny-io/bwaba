import { api } from '@/lib/api-client';

export type NotificationType =
  | 'FORM_SUBMISSION'
  | 'FORM_RESPONSE'
  | 'FORM_SHARED'
  | 'SECURITY_ALERT'
  | 'NEW_LOGIN'
  | 'SYSTEM'
  | string;

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  eventId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export async function getNotifications(params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>(
    '/notifications',
    params as Record<string, string | number | boolean | undefined>,
  );
  return data;
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await api.get<UnreadCountResponse>(
    '/notifications/unread-count',
  );
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${encodeURIComponent(id)}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${encodeURIComponent(id)}`);
}

export async function deleteAllNotifications(): Promise<void> {
  await api.delete('/notifications');
}
