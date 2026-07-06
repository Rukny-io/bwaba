import { DATE_LOCALE } from '@/lib/forms-format';
import { APP_BASE } from '@/components/app/nav-config';
import type { AppNotification, NotificationType } from '@/lib/api/notifications';
import { isIntegrationNotification } from '@/lib/notification-categories';

export type NotificationUiType = 'success' | 'error' | 'warning' | 'info' | 'update';
export type NotificationFilter = 'all' | 'unread' | NotificationUiType;

export type EnrichedNotification = AppNotification & {
  uiType: NotificationUiType;
  time: string;
  href: string | null;
  actionLabel: string | null;
};

export const NOTIFICATION_FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'unread', label: 'غير مقروء' },
  { key: 'error', label: 'أخطاء' },
  { key: 'update', label: 'تحديثات' },
];

export function isSubmissionNotification(type: NotificationType): boolean {
  return (
    type === 'FORM_RESPONSE' ||
    type === 'FORM_SUBMISSION' ||
    type === 'FORM_SHARED'
  );
}

export function isWebhookNotification(
  type: NotificationType,
  data?: Record<string, unknown> | null,
): boolean {
  return isIntegrationNotification(type, data);
}

export function mapNotificationType(type: NotificationType): NotificationUiType {
  switch (type) {
    case 'FORM_RESPONSE':
      return 'success';
    case 'SECURITY_ALERT':
    case 'SESSION_EXPIRED':
      return 'error';
    case 'FORM_SUBMISSION':
    case 'FORM_SHARED':
    case 'NEW_LOGIN':
      return 'update';
    case 'SYSTEM':
      return 'warning';
    default:
      return 'info';
  }
}

export function formatNotificationRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(dateStr).toLocaleDateString(DATE_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getFormRef(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  if (typeof data.formSlug === 'string' && data.formSlug) return data.formSlug;
  if (typeof data.formId === 'string' && data.formId) return data.formId;
  return null;
}

export function getNotificationHref(notification: AppNotification): string | null {
  const data = notification.data ?? undefined;
  const formRef = getFormRef(data);

  if (
    notification.type === 'SYSTEM' &&
    data &&
    typeof data === 'object' &&
    (data as Record<string, unknown>).integrationType === 'webhook'
  ) {
    return formRef
      ? `${APP_BASE}/forms/${formRef}/integrations`
      : `${APP_BASE}/forms`;
  }

  switch (notification.type) {
    case 'FORM_SUBMISSION':
    case 'FORM_RESPONSE':
      return formRef ? `${APP_BASE}/forms/${formRef}/submissions` : null;
    case 'FORM_SHARED':
      return formRef ? `${APP_BASE}/forms/${formRef}` : null;
    case 'SECURITY_ALERT':
    case 'NEW_LOGIN':
    case 'SESSION_EXPIRED':
      return `${APP_BASE}/settings`;
    default:
      return null;
  }
}

export function getNotificationActionLabel(
  notification: AppNotification,
): string | null {
  if (
    notification.type === 'SYSTEM' &&
    notification.data &&
    typeof notification.data === 'object' &&
    (notification.data as Record<string, unknown>).integrationType === 'webhook'
  ) {
    return 'فتح التكاملات';
  }

  switch (notification.type) {
    case 'FORM_SUBMISSION':
    case 'FORM_RESPONSE':
      return 'عرض الاستجابات';
    case 'FORM_SHARED':
      return 'فتح النموذج';
    case 'SECURITY_ALERT':
    case 'NEW_LOGIN':
    case 'SESSION_EXPIRED':
      return 'الإعدادات';
    default:
      return null;
  }
}

export function enrichNotification(notification: AppNotification): EnrichedNotification {
  return {
    ...notification,
    uiType: mapNotificationType(notification.type),
    time: formatNotificationRelativeTime(notification.createdAt),
    href: getNotificationHref(notification),
    actionLabel: getNotificationActionLabel(notification),
  };
}

export function filterNotifications(
  items: EnrichedNotification[],
  filter: NotificationFilter,
): EnrichedNotification[] {
  if (filter === 'all') return items;
  if (filter === 'unread') return items.filter((n) => !n.isRead);
  return items.filter((n) => n.uiType === filter);
}

export function countByFilter(
  items: EnrichedNotification[],
  filter: NotificationFilter,
): number {
  return filterNotifications(items, filter).length;
}

export type DateGroupKey = 'today' | 'yesterday' | 'thisWeek' | 'older';

export const DATE_GROUP_LABELS: Record<DateGroupKey, string> = {
  today: 'اليوم',
  yesterday: 'أمس',
  thisWeek: 'هذا الأسبوع',
  older: 'سابقاً',
};

export function getDateGroupKey(dateStr: string): DateGroupKey {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  if (date >= startOfToday) return 'today';
  if (date >= startOfYesterday) return 'yesterday';
  if (date >= startOfWeek) return 'thisWeek';
  return 'older';
}

const DATE_GROUP_ORDER: DateGroupKey[] = [
  'today',
  'yesterday',
  'thisWeek',
  'older',
];

export function groupNotificationsByDate(
  items: EnrichedNotification[],
): { key: DateGroupKey; label: string; items: EnrichedNotification[] }[] {
  const buckets = new Map<DateGroupKey, EnrichedNotification[]>();

  for (const item of items) {
    const key = getDateGroupKey(item.createdAt);
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  return DATE_GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    label: DATE_GROUP_LABELS[key],
    items: buckets.get(key)!,
  }));
}
