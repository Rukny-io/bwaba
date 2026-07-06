import type { AnalyticsPeriodDays } from '@/components/analytics/analytics-period-picker';
import type { NotificationCategory } from '@/lib/notification-categories';
import { getNotificationCategory } from '@/lib/notification-categories';

export type NotificationCategoryPrefs = Record<NotificationCategory, boolean>;

export interface FormsPreferences {
  /** Default period for /app/analytics overview */
  analyticsDefaultPeriod: AnalyticsPeriodDays;
  /** Which notification categories appear in the feed */
  notificationCategories: NotificationCategoryPrefs;
  /** Toast when a new notification arrives while the panel is closed */
  showInAppNotificationToasts: boolean;
  /** User opted in to browser push (subscription may still require permission) */
  browserPushEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_CATEGORIES: NotificationCategoryPrefs = {
  submissions: true,
  security: true,
  integrations: true,
};

export const DEFAULT_FORMS_PREFERENCES: FormsPreferences = {
  analyticsDefaultPeriod: 30,
  notificationCategories: { ...DEFAULT_NOTIFICATION_CATEGORIES },
  showInAppNotificationToasts: true,
  browserPushEnabled: false,
};

const STORAGE_KEY = 'rukny-forms-preferences';

function isAnalyticsPeriod(value: unknown): value is AnalyticsPeriodDays {
  return value === 7 || value === 30 || value === 90;
}

function parseCategoryPrefs(
  parsed: Partial<FormsPreferences> & { highlightSubmissionNotifications?: boolean },
): NotificationCategoryPrefs {
  const fromCategories = parsed.notificationCategories;
  if (fromCategories && typeof fromCategories === 'object') {
    return {
      submissions:
        typeof fromCategories.submissions === 'boolean'
          ? fromCategories.submissions
          : DEFAULT_NOTIFICATION_CATEGORIES.submissions,
      security:
        typeof fromCategories.security === 'boolean'
          ? fromCategories.security
          : DEFAULT_NOTIFICATION_CATEGORIES.security,
      integrations:
        typeof fromCategories.integrations === 'boolean'
          ? fromCategories.integrations
          : DEFAULT_NOTIFICATION_CATEGORIES.integrations,
    };
  }

  if (typeof parsed.highlightSubmissionNotifications === 'boolean') {
    return {
      ...DEFAULT_NOTIFICATION_CATEGORIES,
      submissions: parsed.highlightSubmissionNotifications,
    };
  }

  return { ...DEFAULT_NOTIFICATION_CATEGORIES };
}

export function readFormsPreferences(): FormsPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_FORMS_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FORMS_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<FormsPreferences> & {
      highlightSubmissionNotifications?: boolean;
    };

    return {
      analyticsDefaultPeriod: isAnalyticsPeriod(parsed.analyticsDefaultPeriod)
        ? parsed.analyticsDefaultPeriod
        : DEFAULT_FORMS_PREFERENCES.analyticsDefaultPeriod,
      notificationCategories: parseCategoryPrefs(parsed),
      showInAppNotificationToasts:
        typeof parsed.showInAppNotificationToasts === 'boolean'
          ? parsed.showInAppNotificationToasts
          : DEFAULT_FORMS_PREFERENCES.showInAppNotificationToasts,
      browserPushEnabled:
        typeof parsed.browserPushEnabled === 'boolean'
          ? parsed.browserPushEnabled
          : DEFAULT_FORMS_PREFERENCES.browserPushEnabled,
    };
  } catch {
    return DEFAULT_FORMS_PREFERENCES;
  }
}

export function writeFormsPreferences(
  patch: Partial<FormsPreferences>,
): FormsPreferences {
  const next = { ...readFormsPreferences(), ...patch };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent('rukny-forms-preferences-changed', { detail: next }),
    );
  }

  return next;
}

export const FORMS_PREFERENCES_CHANGED_EVENT = 'rukny-forms-preferences-changed';

export function isNotificationCategoryEnabled(
  type: string,
  data: Record<string, unknown> | null | undefined,
  categories: NotificationCategoryPrefs,
): boolean {
  const category = getNotificationCategory(type, data);
  if (!category) return true;
  return categories[category];
}
