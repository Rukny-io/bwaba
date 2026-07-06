export type NotificationCategory = 'submissions' | 'security' | 'integrations';

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  submissions: 'استجابات النماذج',
  security: 'الأمان وتسجيل الدخول',
  integrations: 'التكاملات (Webhook)',
};

export function getNotificationCategory(
  type: string,
  data?: Record<string, unknown> | null,
): NotificationCategory | null {
  if (
    type === 'FORM_SUBMISSION' ||
    type === 'FORM_RESPONSE' ||
    type === 'FORM_SHARED'
  ) {
    return 'submissions';
  }

  if (
    type === 'SECURITY_ALERT' ||
    type === 'NEW_LOGIN' ||
    type === 'SESSION_EXPIRED'
  ) {
    return 'security';
  }

  if (
    type === 'SYSTEM' &&
    data &&
    typeof data === 'object' &&
    data.integrationType === 'webhook'
  ) {
    return 'integrations';
  }

  return null;
}

export function isIntegrationNotification(
  type: string,
  data?: Record<string, unknown> | null,
): boolean {
  return getNotificationCategory(type, data) === 'integrations';
}
