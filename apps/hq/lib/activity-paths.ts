import { APP_BASE } from '@/components/layout/nav-config';
import type { ActivityItem } from '@/lib/types/admin';

const TYPE_LABELS: Record<ActivityItem['type'], string> = {
  user_signup: 'New user',
  store_created: 'New store',
  form_created: 'New form',
  event_created: 'New event',
};

export function activityTypeLabel(type: ActivityItem['type']): string {
  return TYPE_LABELS[type];
}

export function activityDetailHref(item: ActivityItem): string | undefined {
  switch (item.type) {
    case 'user_signup':
      return `${APP_BASE}/users/${item.id}`;
    case 'store_created':
      return `${APP_BASE}/stores/${item.id}`;
    case 'form_created':
      return `${APP_BASE}/forms/${item.id}`;
    default:
      return undefined;
  }
}
